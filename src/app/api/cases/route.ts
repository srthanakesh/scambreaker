import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeCase, restructureStatement } from '@/services/glm';
import { getCurrentUser } from '@/lib/auth';
import {
  detectManualReviewSignals,
  priorityWeight,
  urgencyWeight,
} from '@/lib/authority-workflow';
import {
  generateDraftsForCase,
  generateFollowUpTasksForCase,
} from '@/lib/case-automation';
import { logWorkflowEvent } from '@/lib/workflow-log';
import { calculateRecoverability } from '@/lib/recoverability-engine';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { rawDescription, analysisJson, uploadedFiles } = await request.json();

    if (!rawDescription) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Fetch victim user details for the prompt
    const victimDetails = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phoneNumber: true, icNumber: true }
    });

    // 1. Restructure the statement
    const attachmentMeta = Array.isArray(uploadedFiles) && uploadedFiles.length > 0
      ? uploadedFiles.map((f: any) => ({ file_name: f.name || 'attachment', file_type: f.type || 'unknown' }))
      : undefined;
    const structuredStatement = await restructureStatement(rawDescription, victimDetails || {}, attachmentMeta);
    rawDescription = structuredStatement;

    // 2. Run GLM analysis if not provided
    const analysis = analysisJson || await analyzeCase(rawDescription);

    // Calculate Recoverability
    const evidenceCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
    const recoverability = calculateRecoverability({
      rawDescription,
      scamType: analysis.scamType,
      amountLost: analysis.amountLost,
      createdAt: new Date(),
      evidenceCount,
    });

    // 3. Create the case with analysis payload
    const newCase = await prisma.case.create({
      data: ({
        userId: session.userId,
        rawDescription,
        detectedLanguage: analysis.detectedLanguage,
        scamType: analysis.scamType,
        amountLost: analysis.amountLost,
        urgency: analysis.urgency,
        summary: analysis.summary,
        missingInfo: analysis.missingInfo,
        suggestedStep: analysis.suggestedStep,
        suggestedRouting: analysis.suggestedRouting,
        assignedAgency: analysis.assignedAgency,
        priority: analysis.priority,
        workflowStatus: recoverability.level === 'CRITICAL' ? 'ACTION_REQUIRED' : 'TRIAGED',
        recoverabilityScore: recoverability.score,
        recoverabilityLevel: recoverability.level,
        timeToActMinutes: recoverability.timeWindowMinutes,
        priorityReason: recoverability.reasons.filter(r =>
          !r.toLowerCase().includes('ago') &&
          !r.toLowerCase().includes('occurred') &&
          !r.toLowerCase().includes('recently') &&
          !r.toLowerCase().includes('yesterday') &&
          !r.toLowerCase().includes('recency')
        ),
        // Create authority ticket
        ticket: {
          create: {
            priority: analysis.priority,
            assignedAgency: analysis.assignedAgency,
            status: 'OPEN',
          }
        }
      } as any),
    });

    await logWorkflowEvent({
      caseId: newCase.id,
      eventType: 'CASE_CREATED',
      message: 'Case created by victim.',
      actorType: 'VICTIM',
      actorId: session.userId,
    });
    await logWorkflowEvent({
      caseId: newCase.id,
      eventType: 'CASE_ANALYZED',
      message: `Case analyzed and classified as ${newCase.scamType ?? 'UNKNOWN'}.`,
      actorType: 'SYSTEM',
      metadata: { confidence: analysis.confidence ?? null },
    });

    const fallbackSignals = detectManualReviewSignals({
      scamType: newCase.scamType,
      summary: newCase.summary,
      assignedAgency: newCase.assignedAgency,
      confidence: analysis.confidence,
    });
    if (fallbackSignals.requiresManualReview) {
      await logWorkflowEvent({
        caseId: newCase.id,
        eventType: 'FALLBACK_ANALYSIS_USED',
        message: `Manual review flagged: ${fallbackSignals.reasons.join(', ')}`,
        actorType: 'SYSTEM',
      });
    }

    // Fetch victim info for draft generation
    const victim = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        icNumber: true,
        phoneNumber: true,
        email: true,
      }
    });

    await generateFollowUpTasksForCase({
      caseId: newCase.id,
      workflowStatus: newCase.workflowStatus,
      assignedAgency: newCase.assignedAgency,
      summary: newCase.summary,
      missingInfo: newCase.missingInfo,
      actorType: 'SYSTEM',
    });

    await generateDraftsForCase({
      caseId: newCase.id,
      rawDescription: newCase.rawDescription,
      scamType: newCase.scamType,
      summary: newCase.summary,
      suggestedStep: newCase.suggestedStep,
      assignedAgency: newCase.assignedAgency,
      missingInfo: newCase.missingInfo,
      workflowStatus: newCase.workflowStatus,
      amountLost: newCase.amountLost,
      existingDocuments: newCase.documents,
      actorType: 'SYSTEM',
      victimInfo: victim ? {
        fullName: victim.fullName || undefined,
        icNumber: victim.icNumber || undefined,
        phoneNumber: victim.phoneNumber || undefined,
        email: victim.email || undefined,
      } : undefined,
    });

    // Store uploaded evidence files
    if (uploadedFiles && Array.isArray(uploadedFiles)) {
      for (const file of uploadedFiles) {
        if (file.dataUrl) {
          await prisma.evidence.create({
            data: {
              caseId: newCase.id,
              fileUrl: file.dataUrl,
            },
          });
          await logWorkflowEvent({
            caseId: newCase.id,
            eventType: 'EVIDENCE_UPLOADED',
            message: `Evidence file uploaded: ${file.name || 'attachment'}`,
            actorType: 'VICTIM',
            actorId: session.userId,
          });
        }
      }
    }

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'AUTHORITY') {
      const authorityCases = await (prisma.case.findMany as any)({
        select: {
          id: true,
          scamType: true,
          urgency: true,
          priority: true,
          workflowStatus: true,
          assignedAgency: true,
          summary: true,
          createdAt: true,
          recoverabilityScore: true,
          recoverabilityLevel: true,
          timeToActMinutes: true,
        },
      });

      const sorted = authorityCases
        .map((caseItem: any) => ({
          ...caseItem,
          ...detectManualReviewSignals({
            scamType: caseItem.scamType,
            summary: caseItem.summary,
            assignedAgency: caseItem.assignedAgency,
          }),
        }))
        .sort((a: any, b: any) => {
          const urgencyDiff = urgencyWeight(b.urgency) - urgencyWeight(a.urgency);
          if (urgencyDiff !== 0) return urgencyDiff;

          const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
          if (priorityDiff !== 0) return priorityDiff;

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      return NextResponse.json(sorted);
    }

    const victimCases = await prisma.case.findMany({
      where: { userId: session.userId },
      include: {
        ticket: true,
        followUpTasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(victimCases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}
