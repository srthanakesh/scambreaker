export type RecoverabilityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ReasonCode {
  factor: string;
  result: "PASS" | "FAIL" | "NEUTRAL";
  detail: string;
  impact: number;
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
  scamType?: string | null;
  amountLost?: number | null;
  incidentTime?: Date | string | null;
  createdAt?: Date | string | null;
  evidenceCount?: number;
}): RecoverabilityResult {
  let score = 50;
  let timeWindowMinutes = 1440;
  const reasons: string[] = [];
  const reasonCodes: ReasonCode[] = [];

  const rawDescLower = caseData.rawDescription.toLowerCase();

  // 1. Time Factor — use actual elapsed time if available
  const referenceTime = caseData.incidentTime
    ? new Date(caseData.incidentTime)
    : caseData.createdAt
      ? new Date(caseData.createdAt)
      : null;

  const elapsedMinutes = referenceTime
    ? Math.max(0, Math.floor((Date.now() - referenceTime.getTime()) / 60000))
    : null;

  if (elapsedMinutes !== null) {
    if (elapsedMinutes <= 30) {
      score += 30;
      timeWindowMinutes = Math.max(15, 60 - elapsedMinutes);
      reasons.push(`Transaction occurred ${elapsedMinutes === 0 ? '< 1' : elapsedMinutes} min ago — freeze window open`);
      reasonCodes.push({ factor: "Transaction Recency", result: "PASS", detail: `${elapsedMinutes} min elapsed — immediate action viable`, impact: +30 });
    } else if (elapsedMinutes <= 60) {
      score += 25;
      timeWindowMinutes = Math.max(30, 120 - elapsedMinutes);
      reasons.push(`Transaction occurred ${elapsedMinutes} min ago — within golden hour`);
      reasonCodes.push({ factor: "Transaction Recency", result: "PASS", detail: `${elapsedMinutes} min elapsed — golden hour window`, impact: +25 });
    } else if (elapsedMinutes <= 360) {
      score += 10;
      timeWindowMinutes = Math.max(60, 360 - elapsedMinutes);
      reasons.push(`Transaction occurred ~${Math.round(elapsedMinutes / 60)}h ago`);
      reasonCodes.push({ factor: "Transaction Recency", result: "NEUTRAL", detail: `${elapsedMinutes} min elapsed — within 6h window`, impact: +10 });
    } else if (elapsedMinutes <= 1440) {
      score -= 10;
      timeWindowMinutes = Math.max(0, 1440 - elapsedMinutes);
      reasons.push(`Transaction occurred ~${Math.round(elapsedMinutes / 60)}h ago — recovery diminishing`);
      reasonCodes.push({ factor: "Transaction Recency", result: "FAIL", detail: `${elapsedMinutes} min elapsed — past 6h mark`, impact: -10 });
    } else {
      score -= 30;
      timeWindowMinutes = 0;
      const elapsedDays = Math.round(elapsedMinutes / 1440);
      reasons.push(`Transaction occurred ${elapsedDays} day(s) ago — funds likely moved beyond recovery`);
      reasonCodes.push({ factor: "Transaction Recency", result: "FAIL", detail: `${elapsedDays} days elapsed — recovery unlikely`, impact: -30 });
    }
  } else {
    // Fallback: keyword-based estimation
    const isRecent = rawDescLower.includes('just now') || rawDescLower.includes('today') || rawDescLower.includes('minutes ago') || rawDescLower.includes('hours ago') || rawDescLower.includes('baru sahaja') || rawDescLower.includes('hari ini');
    if (isRecent) {
      score += 20;
      timeWindowMinutes = 60;
      reasons.push("Transaction appears recent based on report text");
      reasonCodes.push({ factor: "Transaction Recency", result: "PASS", detail: "Recent based on keywords (no timestamp)", impact: +20 });
    } else if (rawDescLower.includes('yesterday') || rawDescLower.includes('semalam')) {
      score += 5;
      timeWindowMinutes = 240;
      reasons.push("Transaction appears to have occurred yesterday");
      reasonCodes.push({ factor: "Transaction Recency", result: "NEUTRAL", detail: "Yesterday based on keywords", impact: +5 });
    } else {
      score -= 20;
      timeWindowMinutes = 0;
      reasons.push("Transaction timing unclear — assume low recoverability");
      reasonCodes.push({ factor: "Transaction Recency", result: "FAIL", detail: "No timing info available", impact: -20 });
    }
  }

  // 2. Transfer Type Factor
  if (caseData.scamType === 'Mule Account Transfer' || caseData.scamType === 'Bank Transfer Fraud' || rawDescLower.includes('bank transfer') || rawDescLower.includes('online banking') || rawDescLower.includes('fpx') || rawDescLower.includes('duitnow')) {
    score += 15;
    reasons.push("Direct bank transfer involved (traceable)");
    reasonCodes.push({ factor: "Transfer Type", result: "PASS", detail: "Local bank transfer — traceable via bank records", impact: +15 });
  } else if (caseData.scamType === 'CRYPTO_SCAM' || rawDescLower.includes('crypto') || rawDescLower.includes('bitcoin') || rawDescLower.includes('usdt') || rawDescLower.includes('tether')) {
    score -= 30;
    reasons.push("Cryptocurrency involved (near-zero recovery)");
    reasonCodes.push({ factor: "Transfer Type", result: "FAIL", detail: "Cryptocurrency — near-zero recovery chance", impact: -30 });
  } else if (rawDescLower.includes('loan') || rawDescLower.includes('pinjaman')) {
    score += 5;
    reasons.push("Loan scam pattern — likely uses local mule accounts");
    reasonCodes.push({ factor: "Transfer Type", result: "NEUTRAL", detail: "Loan scam — likely mule account transfer", impact: +5 });
  } else {
    reasonCodes.push({ factor: "Transfer Type", result: "NEUTRAL", detail: "Unknown transfer method", impact: 0 });
  }

  // 3. Communication Channel Factor
  const hasMessaging = rawDescLower.includes('whatsapp') || rawDescLower.includes('telegram') || rawDescLower.includes('wechat') || rawDescLower.includes('messenger');
  const hasPhone = rawDescLower.includes('phone call') || rawDescLower.includes('called me') || rawDescLower.includes('panggilan');
  if (hasMessaging) {
    score += 5;
    reasons.push("Contact via instant messaging — platform logs available");
    reasonCodes.push({ factor: "Communication Channel", result: "PASS", detail: "Instant messaging — traceable logs", impact: +5 });
  }
  if (hasPhone) {
    score -= 5;
    reasons.push("Contact via phone call — harder to trace");
    reasonCodes.push({ factor: "Communication Channel", result: "FAIL", detail: "Phone call — limited traceability", impact: -5 });
  }
  if (!hasMessaging && !hasPhone) {
    reasonCodes.push({ factor: "Communication Channel", result: "NEUTRAL", detail: "No communication channel identified", impact: 0 });
  }

  // 4. Financial Severity
  const amount = caseData.amountLost || 0;
  if (amount > 50000) {
    score += 15;
    reasons.push(`High-value loss (RM ${amount.toLocaleString()}) — priority escalation`);
    reasonCodes.push({ factor: "Financial Severity", result: "PASS", detail: `RM ${amount.toLocaleString()} — high-value target for recovery`, impact: +15 });
  } else if (amount > 10000) {
    score += 10;
    reasons.push(`Significant loss (RM ${amount.toLocaleString()})`);
    reasonCodes.push({ factor: "Financial Severity", result: "PASS", detail: `RM ${amount.toLocaleString()} — significant value`, impact: +10 });
  } else if (amount > 0) {
    reasonCodes.push({ factor: "Financial Severity", result: "NEUTRAL", detail: `RM ${amount.toLocaleString()} — standard value`, impact: 0 });
  } else {
    reasonCodes.push({ factor: "Financial Severity", result: "NEUTRAL", detail: "Amount not specified", impact: 0 });
  }

  // 5. Evidence Quality
  const hasAccountInfo = rawDescLower.includes('account') || rawDescLower.includes('akaun') || /\d{10,}/.test(rawDescLower);
  const hasEvidenceFiles = (caseData.evidenceCount ?? 0) > 0;

  if (hasAccountInfo) {
    score += 8;
    reasons.push("Account number identified — direct freeze possible");
    reasonCodes.push({ factor: "Evidence: Account Number", result: "PASS", detail: "Account number in report — actionable", impact: +8 });
  } else {
    reasonCodes.push({ factor: "Evidence: Account Number", result: "FAIL", detail: "No account number detected", impact: 0 });
  }

  if (hasEvidenceFiles) {
    score += 5;
    reasons.push(`${caseData.evidenceCount} evidence file(s) attached`);
    reasonCodes.push({ factor: "Evidence: Attachments", result: "PASS", detail: `${caseData.evidenceCount} file(s) uploaded`, impact: +5 });
  } else {
    reasonCodes.push({ factor: "Evidence: Attachments", result: "NEUTRAL", detail: "No evidence files attached", impact: 0 });
  }

  // 6. Mule Account Detection
  const muleIndicators = rawDescLower.includes('mule') || rawDescLower.includes('different name') || rawDescLower.includes('nama lain') || rawDescLower.includes('not my account');
  if (muleIndicators) {
    score += 3;
    reasonCodes.push({ factor: "Mule Account Indicators", result: "PASS", detail: "Mule account pattern detected", impact: +3 });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Level
  const level = scoreToLevel(score);

  return {
    score,
    level,
    timeWindowMinutes: Math.max(0, timeWindowMinutes),
    reasons,
    reasonCodes,
  };
}

export function scoreToLevel(score: number): RecoverabilityLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate dynamic recoverability decay based on elapsed time.
 * Returns the current effective score and level after time decay.
 */
export function getDynamicRecoverability(
  originalScore: number,
  createdAt: Date | string
): { currentScore: number; currentLevel: RecoverabilityLevel; elapsedMinutes: number } {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));

  // Exponential-style decay: rapid early decay, slowing over time
  let decay = 0;
  if (elapsedMinutes > 15) decay = 5;
  if (elapsedMinutes > 30) decay = 12;
  if (elapsedMinutes > 60) decay = 20;
  if (elapsedMinutes > 120) decay = 35;
  if (elapsedMinutes > 360) decay = 50;
  if (elapsedMinutes > 720) decay = 65;
  if (elapsedMinutes > 1440) decay = 80;

  const currentScore = Math.max(0, Math.round(originalScore - decay));

  return {
    currentScore,
    currentLevel: scoreToLevel(currentScore),
    elapsedMinutes,
  };
}
