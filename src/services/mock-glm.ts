export interface GLMAnalysisResult {
  detectedLanguage: string;
  scamType: string;
  amountLost: number | null;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  missingInfo: string[];
  suggestedStep: string;
  suggestedRouting: {
    department: string;
    reason: string;
  };
}

export async function analyzeScamDescription(description: string): Promise<GLMAnalysisResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowerDesc = description.toLowerCase();
  
  // Simple deterministic mocking logic
  let scamType = "Unknown Scam";
  let urgency: GLMAnalysisResult['urgency'] = "LOW";
  let amountLost = null;
  
  if (lowerDesc.includes("bank") || lowerDesc.includes("account")) {
    scamType = "Financial Phishing";
    urgency = "HIGH";
  } else if (lowerDesc.includes("parcel") || lowerDesc.includes("delivery") || lowerDesc.includes("poslaju")) {
    scamType = "Parcel Delivery Scam";
    urgency = "MEDIUM";
  } else if (lowerDesc.includes("love") || lowerDesc.includes("friend") || lowerDesc.includes("tinder")) {
    scamType = "Romance Scam";
    urgency = "MEDIUM";
  } else if (lowerDesc.includes("job") || lowerDesc.includes("work from home") || lowerDesc.includes("part time")) {
    scamType = "Job Opportunity Scam";
    urgency = "HIGH";
  }

  // Extract amount if mentions RM or $
  const amountMatch = description.match(/(RM|MYR|\$)\s?(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (amountMatch) {
    amountLost = parseFloat(amountMatch[2].replace(/,/g, ''));
    if (amountLost > 5000) urgency = "CRITICAL";
  }

  return {
    detectedLanguage: lowerDesc.match(/[a-z]/) ? "English" : "Unknown",
    scamType,
    amountLost,
    urgency,
    summary: `The victim reported a potential ${scamType} involving a description of: "${description.substring(0, 50)}..."`,
    missingInfo: [
      "Bank transaction statement",
      "Phone number of the suspect",
      "Screenshot of the conversation"
    ],
    suggestedStep: "Immediately contact your bank's 24/7 hotline or the National Scam Response Centre (NSRC) at 997.",
    suggestedRouting: {
      department: "Commercial Crime Investigation Department (CCID)",
      reason: `Matches patterns of ${scamType}`
    }
  };
}
