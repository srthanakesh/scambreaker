export type RecoverabilityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ReasonCode {
  factor: string;
  result: "PASS" | "FAIL" | "NEUTRAL";
  detail: string;
  impact: number; // Points added or removed
}

export interface RecoverabilityResult {
  score: number; // 0-100
  level: RecoverabilityLevel;
  timeWindowMinutes: number;
  reasons: string[];
  reasonCodes: ReasonCode[];
}

export function calculateRecoverability(caseData: {
  rawDescription: string;
  scamType?: string;
  amountLost?: number;
  incidentTime?: Date | string;
}): RecoverabilityResult {
  let score = 50; // Base score
  let timeWindowMinutes = 1440; // Default 24 hours
  const reasons: string[] = [];
  const reasonCodes: ReasonCode[] = [];

  const rawDescLower = caseData.rawDescription.toLowerCase();

  // 1. Time Factor
  const isRecent = rawDescLower.includes('just now') || rawDescLower.includes('today') || rawDescLower.includes('minutes ago') || rawDescLower.includes('hours ago') || rawDescLower.includes('baru sahaja') || rawDescLower.includes('hari ini');
  if (isRecent) {
    score += 25;
    timeWindowMinutes = 60;
    reasons.push("Transaction occurred very recently (< 24h)");
    reasonCodes.push({ factor: "Transaction Recency", result: "PASS", detail: "Transaction < 24 hours", impact: +25 });
  } else if (rawDescLower.includes('yesterday') || rawDescLower.includes('semalam')) {
    score += 10;
    timeWindowMinutes = 240;
    reasons.push("Transaction occurred yesterday");
    reasonCodes.push({ factor: "Transaction Recency", result: "NEUTRAL", detail: "Transaction within 24-48 hours", impact: +10 });
  } else {
    score -= 20;
    timeWindowMinutes = 0;
    reasons.push("Transaction occurred over 48 hours ago");
    reasonCodes.push({ factor: "Transaction Recency", result: "FAIL", detail: "Transaction > 48 hours ago", impact: -20 });
  }

  // 2. Transfer Type Factor
  if (caseData.scamType === 'Mule Account Transfer' || caseData.scamType === 'Bank Transfer Fraud' || rawDescLower.includes('bank transfer') || rawDescLower.includes('online banking') || rawDescLower.includes('fpx')) {
    score += 15;
    reasons.push("Direct bank transfer involved (Traceable)");
    reasonCodes.push({ factor: "Transfer Type", result: "PASS", detail: "Local bank transfer (traceable)", impact: +15 });
  } else if (caseData.scamType === 'Crypto Scam' || rawDescLower.includes('crypto') || rawDescLower.includes('bitcoin') || rawDescLower.includes('usdt')) {
    score -= 30;
    reasons.push("Cryptocurrency involved (Low recoverability)");
    reasonCodes.push({ factor: "Transfer Type", result: "FAIL", detail: "Cryptocurrency (near-zero recovery)", impact: -30 });
  } else if (caseData.scamType === 'Loan Scam' || rawDescLower.includes('loan') || rawDescLower.includes('pinjaman')) {
    score += 5;
    reasons.push("Loan scam patterns often use local mule accounts");
    reasonCodes.push({ factor: "Transfer Type", result: "NEUTRAL", detail: "Loan scam — likely mule account", impact: +5 });
  } else {
    reasonCodes.push({ factor: "Transfer Type", result: "NEUTRAL", detail: "Unknown transfer method", impact: 0 });
  }

  // 3. Known Scam Pattern Detection
  const knownPatterns = rawDescLower.includes('whatsapp') || rawDescLower.includes('telegram') || rawDescLower.includes('wechat');
  if (knownPatterns) {
    score += 5;
    reasons.push("Contact established via instant messaging");
    reasonCodes.push({ factor: "Known Scam Pattern", result: "PASS", detail: "Instant messaging vector detected", impact: +5 });
  } else {
    reasonCodes.push({ factor: "Known Scam Pattern", result: "NEUTRAL", detail: "No known messaging pattern detected", impact: 0 });
  }

  // 4. Financial Severity
  if (caseData.amountLost && caseData.amountLost > 10000) {
    score += 10;
    reasons.push(`High value loss (RM ${caseData.amountLost})`);
    reasonCodes.push({ factor: "Financial Severity", result: "PASS", detail: `RM ${caseData.amountLost} — high-value target`, impact: +10 });
  } else if (caseData.amountLost && caseData.amountLost > 0) {
    reasonCodes.push({ factor: "Financial Severity", result: "NEUTRAL", detail: `RM ${caseData.amountLost} — standard value`, impact: 0 });
  } else {
    reasonCodes.push({ factor: "Financial Severity", result: "NEUTRAL", detail: "Amount not specified", impact: 0 });
  }

  // 5. Evidence Indicators (heuristic from description)
  const hasAccountInfo = rawDescLower.includes('account') || rawDescLower.includes('akaun') || rawDescLower.match(/\d{10,}/);
  if (hasAccountInfo) {
    score += 5;
    reasonCodes.push({ factor: "Evidence Indicators", result: "PASS", detail: "Account number mentioned in report", impact: +5 });
  } else {
    reasonCodes.push({ factor: "Evidence Indicators", result: "FAIL", detail: "No account number detected in report", impact: 0 });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine Level
  let level: RecoverabilityLevel = "LOW";
  if (score >= 80) level = "CRITICAL";
  else if (score >= 60) level = "HIGH";
  else if (score >= 40) level = "MEDIUM";

  return {
    score,
    level,
    timeWindowMinutes,
    reasons,
    reasonCodes,
  };
}

/**
 * Calculate dynamic priority decay based on elapsed time.
 * Returns the current effective score and level after time decay.
 */
export function getDynamicRecoverability(
  originalScore: number,
  createdAt: Date | string
): { currentScore: number; currentLevel: RecoverabilityLevel } {
  const elapsedMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  let decay = 0;
  if (elapsedMinutes > 60) decay = 15;
  if (elapsedMinutes > 120) decay = 30;
  if (elapsedMinutes > 360) decay = 50;
  if (elapsedMinutes > 1440) decay = 70;

  const currentScore = Math.max(0, originalScore - decay);

  let currentLevel: RecoverabilityLevel = "LOW";
  if (currentScore >= 80) currentLevel = "CRITICAL";
  else if (currentScore >= 60) currentLevel = "HIGH";
  else if (currentScore >= 40) currentLevel = "MEDIUM";

  return { currentScore, currentLevel };
}
