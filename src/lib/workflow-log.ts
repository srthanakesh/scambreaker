import { prisma } from '@/lib/prisma';

export type WorkflowActorType = 'SYSTEM' | 'VICTIM' | 'AUTHORITY';

export async function logWorkflowEvent(input: {
  caseId: string;
  eventType: string;
  message: string;
  actorType: WorkflowActorType;
  actorId?: string;
  metadata?: unknown;
}) {
  return prisma.workflowLog.create({
    data: {
      caseId: input.caseId,
      eventType: input.eventType,
      message: input.message,
      actorType: input.actorType,
      actorId: input.actorId,
      metadata: input.metadata as any ?? undefined,
    },
  });
}
