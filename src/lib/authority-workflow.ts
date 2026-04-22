export const WORKFLOW_STATUSES = [
  'NEW',
  'ANALYZED',
  'NEEDS_INFO',
  'ROUTED',
  'FOLLOW_UP_PENDING',
  'CLOSED',
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  NEW: ['ANALYZED', 'NEEDS_INFO', 'ROUTED', 'CLOSED'],
  ANALYZED: ['NEEDS_INFO', 'ROUTED', 'FOLLOW_UP_PENDING', 'CLOSED'],
  NEEDS_INFO: ['ROUTED', 'FOLLOW_UP_PENDING', 'CLOSED'],
  ROUTED: ['FOLLOW_UP_PENDING', 'NEEDS_INFO', 'CLOSED'],
  FOLLOW_UP_PENDING: ['ROUTED', 'NEEDS_INFO', 'CLOSED'],
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
