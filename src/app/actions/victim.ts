'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function submitMissingInfo(caseId: string, content: string) {
  const session = await getCurrentUser();

  if (!session || session.role !== 'VICTIM') {
    throw new Error('Unauthorized');
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, userId: true, workflowStatus: true },
  });

  if (!caseRecord || caseRecord.userId !== session.userId) {
    throw new Error('Case not found');
  }

  if (!content || !content.trim()) {
    throw new Error('Missing information is required');
  }

  await prisma.message.create({
    data: {
      caseId,
      role: 'user',
      content: content.trim(),
    },
  });

  // Only move to ROUTED if currently in NEEDS_INFO
  if (caseRecord.workflowStatus === 'NEEDS_INFO') {
    await prisma.case.update({
      where: { id: caseId },
      data: {
        workflowStatus: 'ROUTED',
      },
    });
  }

  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getCurrentUser();

  if (!session || session.role !== 'VICTIM') {
    throw new Error('Unauthorized');
  }

  const task = await prisma.followUpTask.findUnique({
    where: { id: taskId },
    include: {
      case: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!task || !task.case || task.case.userId !== session.userId) {
    throw new Error('Task not found');
  }

  await prisma.followUpTask.update({
    where: { id: taskId },
    data: { status },
  });

  return { success: true };
}

export async function submitEvidence(caseId: string, fileUrl: string) {
  const session = await getCurrentUser();

  if (!session || session.role !== 'VICTIM') {
    throw new Error('Unauthorized');
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, userId: true },
  });

  if (!caseRecord || caseRecord.userId !== session.userId) {
    throw new Error('Case not found');
  }

  if (!fileUrl || !fileUrl.trim()) {
    throw new Error('Evidence file is required');
  }

  const evidence = await prisma.evidence.create({
    data: {
      caseId,
      fileUrl,
    },
  });

  return evidence;
}