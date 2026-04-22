import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  canTransitionWorkflow,
  detectManualReviewSignals,
  getAllowedTransitions,
  isWorkflowStatus,
} from '@/lib/authority-workflow';
import {
  generateDraftsForCase,
  generateFollowUpTasksForCase,
} from '@/lib/case-automation';
import { logWorkflowEvent } from '@/lib/workflow-log';

const ALLOWED_PRIORITIES = new Set(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);

function sanitizeMissingInfo(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  return input.filter((item): item is string => typeof item === 'string').map((item) => item.trim());
}

function sanitizeDocuments(input: unknown): Array<{ type?: string; title: string; content: string; generatedAt?: string }> | null {
  if (!Array.isArray(input)) return null;
  const sanitized: Array<{ type?: string; title: string; content: string; generatedAt?: string }> = [];

  for (const doc of input) {
    if (!doc || typeof doc !== 'object') continue;
    const docObj = doc as Record<string, unknown>;
    const title = typeof docObj.title === 'string' ? docObj.title.trim() : '';
    const content = typeof docObj.content === 'string' ? docObj.content : '';
    if (!title) continue;

    sanitized.push({
      type: typeof docObj.type === 'string' ? docObj.type.trim() : undefined,
      title,
      content,
      generatedAt: typeof docObj.generatedAt === 'string' ? docObj.generatedAt : undefined,
    });
  }

  return sanitized;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (session.role === 'VICTIM') {
      const victimCase = await prisma.case.findUnique({
        where: { id },
        include: {
          messages: true,
          evidence: true,
          ticket: true,
          followUpTasks: true,
          workflowLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!victimCase || victimCase.userId !== session.userId) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      return NextResponse.json(victimCase);
    }

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        messages: true,
        evidence: true,
        ticket: true,
        followUpTasks: true,
        workflowLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const fallbackSignals = detectManualReviewSignals({
      scamType: caseData.scamType,
      summary: caseData.summary,
      assignedAgency: caseData.assignedAgency,
    });

    return NextResponse.json({
      ...caseData,
      fallbackSignals,
      allowedTransitions: getAllowedTransitions(caseData.workflowStatus),
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'AUTHORITY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      action,
      workflowStatus,
      authorityNote,
      authorityNotes,
      requestMoreInfo,
      assignedAgency,
      priority,
      missingInfo,
      documents,
    } = body || {};

    const existingCase = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        workflowStatus: true,
        authorityNotes: true,
        assignedAgency: true,
        rawDescription: true,
        scamType: true,
        summary: true,
        suggestedStep: true,
        amountLost: true,
        missingInfo: true,
        documents: true,
      },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof assignedAgency === 'string') {
      const sanitizedAgency = assignedAgency.trim();
      if (!sanitizedAgency) {
        return NextResponse.json({ error: 'assignedAgency cannot be empty' }, { status: 400 });
      }
      updateData.assignedAgency = sanitizedAgency;
      if (assignedAgency.trim() !== existingCase.assignedAgency) {
        await logWorkflowEvent({
          caseId: id,
          eventType: 'AGENCY_UPDATED',
          message: `Assigned agency updated to ${assignedAgency.trim()}.`,
          actorType: 'AUTHORITY',
          actorId: session.userId,
        });
      }
    }

    if (typeof priority === 'string') {
      const normalizedPriority = priority.trim().toUpperCase();
      if (!ALLOWED_PRIORITIES.has(normalizedPriority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
      updateData.priority = normalizedPriority;
    }

    if (missingInfo !== undefined) {
      const sanitizedMissingInfo = sanitizeMissingInfo(missingInfo);
      if (!sanitizedMissingInfo) {
        return NextResponse.json({ error: 'missingInfo must be an array of strings' }, { status: 400 });
      }
      updateData.missingInfo = sanitizedMissingInfo;
    }

    if (documents !== undefined) {
      const sanitizedDocuments = sanitizeDocuments(documents);
      if (!sanitizedDocuments) {
        return NextResponse.json({ error: 'documents must be an array of draft objects' }, { status: 400 });
      }
      updateData.documents = sanitizedDocuments;
      await logWorkflowEvent({
        caseId: id,
        eventType: 'DRAFT_GENERATED',
        message: 'Draft payload updated manually by authority.',
        actorType: 'AUTHORITY',
        actorId: session.userId,
      });
    }

    let targetStatus: string | undefined;

    if (typeof workflowStatus === 'string') {
      targetStatus = workflowStatus;
    } else if (typeof action === 'string') {
      switch (action) {
        case 'move_to_routed':
          targetStatus = 'ROUTED';
          break;
        case 'move_to_follow_up_pending':
          targetStatus = 'FOLLOW_UP_PENDING';
          break;
        case 'close_case':
          targetStatus = 'CLOSED';
          break;
        case 'request_more_info':
          targetStatus = 'NEEDS_INFO';
          break;
        default:
          break;
      }
    }

    if (typeof requestMoreInfo === 'string' && requestMoreInfo.trim().length > 0) {
      const notePrefix = `[REQUEST_MORE_INFO ${new Date().toISOString()}]`;
      const appended = `${notePrefix}\n${requestMoreInfo.trim()}`;
      updateData.authorityNotes = [existingCase.authorityNotes, appended].filter(Boolean).join('\n\n');

      await prisma.message.create({
        data: {
          caseId: id,
          role: 'assistant',
          content: requestMoreInfo.trim(),
        },
      });

      if (!targetStatus) {
        targetStatus = 'NEEDS_INFO';
      }
      await logWorkflowEvent({
        caseId: id,
        eventType: 'MORE_INFO_REQUESTED',
        message: 'Authority requested more information from victim.',
        actorType: 'AUTHORITY',
        actorId: session.userId,
      });
    }

    const notePayload = typeof authorityNote === 'string' ? authorityNote : authorityNotes;
    if (typeof notePayload === 'string' && notePayload.trim().length > 0) {
      const notePrefix = `[INTERNAL_NOTE ${new Date().toISOString()}]`;
      const appended = `${notePrefix}\n${notePayload.trim()}`;
      updateData.authorityNotes = [updateData.authorityNotes ?? existingCase.authorityNotes, appended]
        .filter(Boolean)
        .join('\n\n');
      await logWorkflowEvent({
        caseId: id,
        eventType: 'AUTHORITY_NOTE_ADDED',
        message: 'Authority added an internal note.',
        actorType: 'AUTHORITY',
        actorId: session.userId,
      });
    }

    if (targetStatus) {
      if (!isWorkflowStatus(targetStatus)) {
        return NextResponse.json(
          { error: 'Invalid workflow status provided' },
          { status: 400 }
        );
      }

      if (!canTransitionWorkflow(existingCase.workflowStatus, targetStatus)) {
        return NextResponse.json(
          {
            error: 'Invalid workflow transition',
            from: existingCase.workflowStatus,
            to: targetStatus,
            allowed: getAllowedTransitions(existingCase.workflowStatus),
          },
          { status: 409 }
        );
      }

      updateData.workflowStatus = targetStatus;
      if (targetStatus !== existingCase.workflowStatus) {
        await logWorkflowEvent({
          caseId: id,
          eventType: targetStatus === 'CLOSED' ? 'CASE_CLOSED' : 'STATUS_CHANGED',
          message: `Workflow status changed from ${existingCase.workflowStatus} to ${targetStatus}.`,
          actorType: 'AUTHORITY',
          actorId: session.userId,
        });
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        messages: true,
        evidence: true,
        ticket: true,
        followUpTasks: true,
        workflowLogs: {
          orderBy: { createdAt: 'desc' },
        },
      }
    });

    await generateFollowUpTasksForCase({
      caseId: updatedCase.id,
      workflowStatus: updatedCase.workflowStatus,
      assignedAgency: updatedCase.assignedAgency,
      summary: updatedCase.summary,
      missingInfo: updatedCase.missingInfo,
      actorType: 'SYSTEM',
    });
    await generateDraftsForCase({
      caseId: updatedCase.id,
      rawDescription: updatedCase.rawDescription,
      scamType: updatedCase.scamType,
      summary: updatedCase.summary,
      suggestedStep: updatedCase.suggestedStep,
      assignedAgency: updatedCase.assignedAgency,
      missingInfo: updatedCase.missingInfo,
      workflowStatus: updatedCase.workflowStatus,
      amountLost: updatedCase.amountLost,
      existingDocuments: updatedCase.documents,
      actorType: 'SYSTEM',
    });

    const fallbackSignals = detectManualReviewSignals({
      scamType: updatedCase.scamType,
      summary: updatedCase.summary,
      assignedAgency: updatedCase.assignedAgency,
    });

    return NextResponse.json({
      ...updatedCase,
      fallbackSignals,
      allowedTransitions: getAllowedTransitions(updatedCase.workflowStatus),
    });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}
