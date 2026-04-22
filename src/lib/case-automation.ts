import { prisma } from '@/lib/prisma';
import { detectManualReviewSignals } from '@/lib/authority-workflow';
import { logWorkflowEvent, WorkflowActorType } from '@/lib/workflow-log';

type DraftDoc = {
  type: string;
  title: string;
  content: string;
  generatedAt: string;
};

function toArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((v): v is string => typeof v === 'string');
}

function normalizeDrafts(input: unknown): DraftDoc[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      type: typeof item.type === 'string' ? item.type : 'legacy',
      title: typeof item.title === 'string' ? item.title : 'Untitled Draft',
      content: typeof item.content === 'string' ? item.content : '',
      generatedAt:
        typeof item.generatedAt === 'string' ? item.generatedAt : new Date().toISOString(),
    }));
}

function setDraftByType(existing: DraftDoc[], next: DraftDoc): DraftDoc[] {
  const idx = existing.findIndex((d) => d.type === next.type);
  if (idx >= 0) {
    const updated = [...existing];
    updated[idx] = next;
    return updated;
  }
  return [...existing, next];
}

function buildCoreTaskTemplates(input: {
  caseId: string;
  workflowStatus: string;
  assignedAgency?: string | null;
  summary?: string | null;
  missingInfo?: unknown;
}) {
  const missingInfo = toArray(input.missingInfo);
  const tasks: Array<{
    dedupeKey: string;
    title: string;
    description: string;
    dueAt?: Date;
    assignedTo?: string;
  }> = [];

  tasks.push({
    dedupeKey: `${input.workflowStatus}:review_case`,
    title: 'Review case evidence and summary',
    description: input.summary
      ? `Review case summary and evidence: ${input.summary}`
      : 'Review case details and evidence for triage.',
    assignedTo: input.assignedAgency ?? undefined,
  });

  if (input.workflowStatus === 'NEEDS_INFO' || missingInfo.length > 0) {
    tasks.push({
      dedupeKey: 'needs_info:follow_up_victim',
      title: 'Follow up with victim for missing information',
      description:
        missingInfo.length > 0
          ? `Request and verify missing information: ${missingInfo.join(', ')}`
          : 'Request additional victim details required for processing.',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedTo: input.assignedAgency ?? undefined,
    });
  }

  if (input.workflowStatus === 'ROUTED' || input.workflowStatus === 'FOLLOW_UP_PENDING') {
    tasks.push({
      dedupeKey: 'routed:agency_handover',
      title: 'Confirm agency handover',
      description: `Confirm routing handover with ${input.assignedAgency ?? 'assigned authority unit'}.`,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedTo: input.assignedAgency ?? undefined,
    });
  }

  return tasks;
}

export async function generateFollowUpTasksForCase(input: {
  caseId: string;
  workflowStatus: string;
  assignedAgency?: string | null;
  summary?: string | null;
  missingInfo?: unknown;
  actorType?: WorkflowActorType;
  actorId?: string;
}) {
  const taskTemplates = buildCoreTaskTemplates(input);

  for (const task of taskTemplates) {
    try {
      const existingTask = await prisma.followUpTask.findFirst({
        where: {
          caseId: input.caseId,
          title: task.title,
        },
      });

      const created = existingTask
        ? await prisma.followUpTask.update({
            where: { id: existingTask.id },
            data: {
              description: task.description,
              dueAt: task.dueAt,
              assignedTo: task.assignedTo,
            },
          })
        : await prisma.followUpTask.create({
            data: {
              caseId: input.caseId,
              title: task.title,
              description: task.description,
              dueAt: task.dueAt,
              assignedTo: task.assignedTo,
            },
          });

      await logWorkflowEvent({
        caseId: input.caseId,
        eventType: 'FOLLOW_UP_TASK_GENERATED',
        message: `Task generated/updated: ${created.title}`,
        actorType: input.actorType ?? 'SYSTEM',
        actorId: input.actorId,
        metadata: { taskId: created.id, dedupeKey: task.dedupeKey },
      });
    } catch (error) {
      console.error('Failed generating follow-up task:', error);
    }
  }
}

export async function generateDraftsForCase(input: {
  caseId: string;
  rawDescription: string;
  scamType?: string | null;
  summary?: string | null;
  suggestedStep?: string | null;
  assignedAgency?: string | null;
  missingInfo?: unknown;
  workflowStatus: string;
  amountLost?: number | null;
  existingDocuments?: unknown;
  actorType?: WorkflowActorType;
  actorId?: string;
}) {
  const missingInfo = toArray(input.missingInfo);
  const now = new Date().toISOString();
  const existingDrafts = normalizeDrafts(input.existingDocuments);
  const fallbackSignal = detectManualReviewSignals({
    scamType: input.scamType,
    summary: input.summary,
    assignedAgency: input.assignedAgency,
  });

  const nextDrafts: DraftDoc[] = [];
  nextDrafts.push({
    type: 'incident_brief',
    title: 'Incident Brief',
    content: `Case ${input.caseId}\nType: ${input.scamType ?? 'UNKNOWN'}\nUrgency path: ${input.workflowStatus}\nSummary: ${input.summary ?? 'Pending analysis'}\nManual review: ${fallbackSignal.requiresManualReview ? 'YES' : 'NO'}`,
    generatedAt: now,
  });
  nextDrafts.push({
    type: 'authority_summary',
    title: 'Authority Summary',
    content: `Assigned Agency: ${input.assignedAgency ?? 'Unassigned'}\nSuggested Step: ${input.suggestedStep ?? 'Review manually'}\nAmount Lost: RM ${input.amountLost ?? 0}\nMissing Info: ${missingInfo.join(', ') || 'None'}`,
    generatedAt: now,
  });
  nextDrafts.push({
    type: 'request_more_info_draft',
    title: 'Request For More Information Draft',
    content: `Please provide the following details to proceed with your case:\n${missingInfo.length ? `- ${missingInfo.join('\n- ')}` : '- Transaction details\n- Contact evidence'}`,
    generatedAt: now,
  });
  nextDrafts.push({
    type: 'bank_dispute_draft',
    title: 'Bank Dispute Draft',
    content: `Subject: Dispute Request for Suspected Scam Transaction\nCase Reference: ${input.caseId}\nClaimed amount: RM ${input.amountLost ?? 0}\nIncident summary: ${input.summary ?? input.rawDescription.slice(0, 240)}`,
    generatedAt: now,
  });
  nextDrafts.push({
    type: 'police_report_draft',
    title: 'Police Report Draft',
    content: `Police Report Draft\nCase: ${input.caseId}\nType: ${input.scamType ?? 'UNKNOWN'}\nStatement:\n${input.rawDescription}`,
    generatedAt: now,
  });

  let merged = existingDrafts;
  for (const draft of nextDrafts) {
    merged = setDraftByType(merged, draft);
    await logWorkflowEvent({
      caseId: input.caseId,
      eventType: 'DRAFT_GENERATED',
      message: `Draft generated/updated: ${draft.title}`,
      actorType: input.actorType ?? 'SYSTEM',
      actorId: input.actorId,
      metadata: { draftType: draft.type },
    });
  }

  await prisma.case.update({
    where: { id: input.caseId },
    data: { documents: merged as unknown as object },
  });

  return merged;
}
