'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  generateDraftsForCase,
  generateFollowUpTasksForCase,
} from '@/lib/case-automation';
import { logWorkflowEvent } from '@/lib/workflow-log';

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'VICTIM') {
    throw new Error('Unauthorized');
  }

  // Verify the task belongs to a case owned by this user
  const task = await prisma.followUpTask.findUnique({
    where: { id: taskId },
    include: { case: true }
  });

  if (!task || task.case.userId !== session.userId) {
    throw new Error('Task not found or unauthorized');
  }

  const previousStatus = task.status;
  await prisma.followUpTask.update({
    where: { id: taskId },
    data: { status: newStatus }
  });

  if (previousStatus !== newStatus) {
    await logWorkflowEvent({
      caseId: task.caseId,
      eventType: 'TASK_STATUS_CHANGED',
      message: `Task status changed from ${previousStatus} to ${newStatus}: ${task.title}`,
      actorType: 'VICTIM',
      actorId: session.userId,
      metadata: { taskId },
    });
  }

  if (newStatus === 'COMPLETED') {
    await logWorkflowEvent({
      caseId: task.caseId,
      eventType: 'TASK_COMPLETED',
      message: `Victim completed task: ${task.title}`,
      actorType: 'VICTIM',
      actorId: session.userId,
      metadata: { taskId },
    });
  }

  revalidatePath(`/victim/cases/${task.caseId}`);
  return { success: true };
}

export async function submitMissingInfo(caseId: string, content: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'VICTIM') {
    throw new Error('Unauthorized');
  }

  // Verify case ownership
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId }
  });

  if (!caseRecord || caseRecord.userId !== session.userId) {
    throw new Error('Case not found or unauthorized');
  }

  // Create message
  await prisma.message.create({
    data: {
      caseId,
      role: 'user',
      content
    }
  });

  // Update case status from NEEDS_INFO back to ROUTED so authority knows it's updated
  if (caseRecord.workflowStatus === 'NEEDS_INFO') {
    await prisma.case.update({
      where: { id: caseId },
      data: { workflowStatus: 'ROUTED' }
    });
    await logWorkflowEvent({
      caseId,
      eventType: 'STATUS_CHANGED',
      message: 'Workflow status changed from NEEDS_INFO to ROUTED after victim submission.',
      actorType: 'SYSTEM',
    });
  }

  await logWorkflowEvent({
    caseId,
    eventType: 'VICTIM_INFO_RECEIVED',
    message: 'Victim submitted additional information.',
    actorType: 'VICTIM',
    actorId: session.userId,
  });

  const updatedCase = await prisma.case.findUnique({
    where: { id: caseId },
  });
  if (updatedCase) {
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
  }

  revalidatePath(`/victim/cases/${caseId}`);
  return { success: true };
}
