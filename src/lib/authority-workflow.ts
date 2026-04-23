export const WORKFLOW_STATUSES = [
  'NEW',
  'ANALYZED',
  'ACTION_REQUIRED',
  'TRIAGED',
  'AWAITING_EXTERNAL',
  'NEEDS_INFO',
  'ROUTED',
  'IN_PROGRESS',
  'FOLLOW_UP_PENDING',
  'RESOLVED',
  'CLOSED',
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  NEW: ['ANALYZED', 'ACTION_REQUIRED', 'TRIAGED', 'ROUTED', 'IN_PROGRESS'],
  ANALYZED: ['ACTION_REQUIRED', 'TRIAGED', 'ROUTED', 'IN_PROGRESS'],
  ACTION_REQUIRED: ['TRIAGED', 'ROUTED', 'IN_PROGRESS'],
  TRIAGED: ['ROUTED'],
  AWAITING_EXTERNAL: ['ROUTED', 'IN_PROGRESS'],
  NEEDS_INFO: ['IN_PROGRESS', 'RESOLVED'],
  ROUTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['NEEDS_INFO', 'RESOLVED'],
  FOLLOW_UP_PENDING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export function isWorkflowStatus(value: string): value is WorkflowStatus {
  return WORKFLOW_STATUSES.includes(value as WorkflowStatus);
}

export function canTransitionWorkflow(from: string, to: string): boolean {
  if (!isWorkflowStatus(from) || !isWorkflowStatus(to)) {
    return false;
  }

  if (from === to) {
    return true;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: string): WorkflowStatus[] {
  if (!isWorkflowStatus(from)) {
    return [];
  }

  return ALLOWED_TRANSITIONS[from];
}

export function detectManualReviewSignals(input: {
  scamType?: string | null;
  summary?: string | null;
  assignedAgency?: string | null;
  confidence?: number | null;
}): { requiresManualReview: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!input.scamType || input.scamType === 'UNKNOWN') {
    reasons.push('scam_type_unknown');
  }

  if (!input.summary || /analysis incomplete|fallback/i.test(input.summary)) {
    reasons.push('analysis_incomplete');
  }

  if (!input.assignedAgency || /manual review/i.test(input.assignedAgency)) {
    reasons.push('manual_review_agency');
  }

  if (typeof input.confidence === 'number' && input.confidence < 0.55) {
    reasons.push('low_confidence');
  }

  return {
    requiresManualReview: reasons.length > 0,
    reasons,
  };
}

export function urgencyWeight(value?: string | null): number {
  switch ((value || '').toUpperCase()) {
    case 'CRITICAL':
      return 4;
    case 'HIGH':
      return 3;
    case 'MEDIUM':
      return 2;
    case 'LOW':
      return 1;
    default:
      return 0;
  }
}

export function priorityWeight(value?: string | null): number {
  switch ((value || '').toUpperCase()) {
    case 'CRITICAL':
      return 4;
    case 'HIGH':
      return 3;
    case 'NORMAL':
      return 2;
    case 'LOW':
      return 1;
    default:
      return 0;
  }
}
