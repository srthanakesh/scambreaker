'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  canTransitionWorkflow,
  getAllowedTransitions,
  WorkflowStatus,
} from '@/lib/authority-workflow';
import {
  generateDraftsForCase,
  generateFollowUpTasksForCase,
} from '@/lib/case-automation';
import { logWorkflowEvent } from '@/lib/workflow-log';

async function assertAuthority() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'AUTHORITY') {
    throw new Error('Unauthorized');
  }
  return session;
}

async function updateCaseWorkflow(caseId: string, toStatus: WorkflowStatus) {
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, workflowStatus: true },
  });

  if (!existingCase) {
    throw new Error('Case not found');
  }

  if (!canTransitionWorkflow(existingCase.workflowStatus, toStatus)) {
    throw new Error(
      `Invalid workflow transition from ${existingCase.workflowStatus} to ${toStatus}. Allowed: ${getAllowedTransitions(existingCase.workflowStatus).join(', ')}`
    );
  }

  return prisma.case.update({
    where: { id: caseId },
    data: { workflowStatus: toStatus },
  });
}

export async function updateWorkflowStatus(caseId: string, nextStatus: WorkflowStatus) {
  const session = await assertAuthority();
  const before = await prisma.case.findUnique({ where: { id: caseId } });
  const updated = await updateCaseWorkflow(caseId, nextStatus);
  if (before && before.workflowStatus !== updated.workflowStatus) {
    await logWorkflowEvent({
      caseId,
      eventType: nextStatus === 'CLOSED' ? 'CASE_CLOSED' : 'STATUS_CHANGED',
      message: `Workflow status changed from ${before.workflowStatus} to ${updated.workflowStatus}.`,
      actorType: 'AUTHORITY',
      actorId: session.userId,
    });
  }
  await generateFollowUpTasksForCase({
    caseId: updated.id,
    workflowStatus: updated.workflowStatus,
    assignedAgency: updated.assignedAgency,
    summary: updated.summary,
    missingInfo: updated.missingInfo,
    actorType: 'SYSTEM',
  });
  await generateDraftsForCase({
    caseId: updated.id,
    rawDescription: updated.rawDescription,
    scamType: updated.scamType,
    summary: updated.summary,
    suggestedStep: updated.suggestedStep,
    assignedAgency: updated.assignedAgency,
    missingInfo: updated.missingInfo,
    workflowStatus: updated.workflowStatus,
    amountLost: updated.amountLost,
    existingDocuments: updated.documents,
    actorType: 'SYSTEM',
  });

  revalidatePath('/authority/dashboard');
  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function addInternalAuthorityNote(caseId: string, note: string) {
  const session = await assertAuthority();
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { authorityNotes: true },
  });

  if (!existingCase) {
    throw new Error('Case not found');
  }

  const formatted = `[INTERNAL_NOTE ${new Date().toISOString()}]\n${note.trim()}`;
  const authorityNotes = [existingCase.authorityNotes, formatted].filter(Boolean).join('\n\n');
  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { authorityNotes },
  });
  await logWorkflowEvent({
    caseId,
    eventType: 'AUTHORITY_NOTE_ADDED',
    message: 'Authority added an internal note.',
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });

  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function requestMoreInfo(caseId: string, requestText: string) {
  const session = await assertAuthority();

  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { authorityNotes: true, workflowStatus: true },
  });

  if (!existingCase) {
    throw new Error('Case not found');
  }

  const formatted = `[REQUEST_MORE_INFO ${new Date().toISOString()}]\n${requestText.trim()}`;
  const authorityNotes = [existingCase.authorityNotes, formatted].filter(Boolean).join('\n\n');

  await prisma.message.create({
    data: {
      caseId,
      role: 'assistant',
      content: requestText.trim(),
    },
  });

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      authorityNotes,
      workflowStatus: canTransitionWorkflow(existingCase.workflowStatus, 'NEEDS_INFO')
        ? 'NEEDS_INFO'
        : existingCase.workflowStatus,
    },
  });
  await logWorkflowEvent({
    caseId,
    eventType: 'MORE_INFO_REQUESTED',
    message: 'Authority requested more information from victim.',
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });
  await generateFollowUpTasksForCase({
    caseId: updated.id,
    workflowStatus: updated.workflowStatus,
    assignedAgency: updated.assignedAgency,
    summary: updated.summary,
    missingInfo: updated.missingInfo,
    actorType: 'SYSTEM',
  });
  await generateDraftsForCase({
    caseId: updated.id,
    rawDescription: updated.rawDescription,
    scamType: updated.scamType,
    summary: updated.summary,
    suggestedStep: updated.suggestedStep,
    assignedAgency: updated.assignedAgency,
    missingInfo: updated.missingInfo,
    workflowStatus: updated.workflowStatus,
    amountLost: updated.amountLost,
    existingDocuments: updated.documents,
    actorType: 'SYSTEM',
  });

  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function moveCaseToRouted(caseId: string) {
  const session = await assertAuthority();
  const updated = await updateCaseWorkflow(caseId, 'ROUTED');
  await logWorkflowEvent({
    caseId,
    eventType: 'STATUS_CHANGED',
    message: 'Workflow status changed to ROUTED.',
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });
  revalidatePath('/authority/dashboard');
  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function moveCaseToFollowUpPending(caseId: string) {
  const session = await assertAuthority();
  const updated = await updateCaseWorkflow(caseId, 'FOLLOW_UP_PENDING');
  await logWorkflowEvent({
    caseId,
    eventType: 'STATUS_CHANGED',
    message: 'Workflow status changed to FOLLOW_UP_PENDING.',
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });
  revalidatePath('/authority/dashboard');
  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function closeCase(caseId: string) {
  const session = await assertAuthority();
  const updated = await updateCaseWorkflow(caseId, 'CLOSED');
  await logWorkflowEvent({
    caseId,
    eventType: 'CASE_CLOSED',
    message: 'Case closed by authority.',
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });
  revalidatePath('/authority/dashboard');
  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}

export async function updateAssignedAgency(caseId: string, assignedAgency: string) {
  const session = await assertAuthority();

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { assignedAgency: assignedAgency.trim() },
  });
  await logWorkflowEvent({
    caseId,
    eventType: 'AGENCY_UPDATED',
    message: `Assigned agency updated to ${assignedAgency.trim()}.`,
    actorType: 'AUTHORITY',
    actorId: session.userId,
  });
  await generateFollowUpTasksForCase({
    caseId: updated.id,
    workflowStatus: updated.workflowStatus,
    assignedAgency: updated.assignedAgency,
    summary: updated.summary,
    missingInfo: updated.missingInfo,
    actorType: 'SYSTEM',
  });
  await generateDraftsForCase({
    caseId: updated.id,
    rawDescription: updated.rawDescription,
    scamType: updated.scamType,
    summary: updated.summary,
    suggestedStep: updated.suggestedStep,
    assignedAgency: updated.assignedAgency,
    missingInfo: updated.missingInfo,
    workflowStatus: updated.workflowStatus,
    amountLost: updated.amountLost,
    existingDocuments: updated.documents,
    actorType: 'SYSTEM',
  });

  revalidatePath('/authority/dashboard');
  revalidatePath(`/authority/dashboard/cases/${caseId}`);
  return updated;
}
