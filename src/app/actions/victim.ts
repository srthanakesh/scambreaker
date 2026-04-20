'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

  await prisma.followUpTask.update({
    where: { id: taskId },
    data: { status: newStatus }
  });

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
  }

  revalidatePath(`/victim/cases/${caseId}`);
  return { success: true };
}
