import { ZAI_SYSTEM_PROMPT } from '../lib/prompts/zai-system-prompt';

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type Priority = 'NORMAL' | 'HIGH';
export type WorkflowStatus = 'NEW' | 'ANALYZED' | 'NEEDS_INFO' | 'ROUTED' | 'CLOSED';

export interface GLMAnalysis {
  detectedLanguage: string;
  scamType: string;
  amountLost: number;
  urgency: Urgency;
  priority: Priority;
  summary: string;
  missingInfo: string[];
  suggestedStep: string;
  suggestedRouting: string;
  assignedAgency: string;
  workflowStatus: WorkflowStatus;
  confidence: number;
}

export async function analyzeCase(description: string): Promise<GLMAnalysis> {
  console.log("--- Starting GLM Analysis ---");
  try {
    const analysis = await glmAnalyzeCase(description);
    console.log("GLM Analysis Successful:", analysis.scamType);
    return analysis;
  } catch (error: any) {
    if (error.message === "GLM_API_KEY is not configured in environment variables.") {
      console.warn("⚠️  GLM_API_KEY is missing. Falling back to mock analysis. Please set GLM_API_KEY in your .env file.");
    } else {
      console.error("GLM Analysis Failed:", error.message);
      if (error.response) {
        try {
          const errorText = await error.response.text();
          console.error("API Error Details:", errorText);
        } catch (e) {
          // ignore if we can't read response text
        }
      }
      console.log("GLM failure fallback used.");
    }
    return mockAnalyzeCase(description);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function glmAnalyzeCase(description: string): Promise<GLMAnalysis> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    throw new Error("GLM_API_KEY is not configured in environment variables.");
  }

  const model = process.env.GLM_MODEL || "glm-4-flash"; // updated to a typical fast model or use what was there before
  
  const payload = JSON.stringify({
    model: model,
    messages: [
      {
        role: "system",
        content: ZAI_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `Analyze this scam report: "${description}"`
      }
    ],
    temperature: 0.1,
  });
  const maxAttempts = 3;
  let response: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: payload,
        signal: controller.signal,
      });
      if (response.ok) {
        break;
      }
      lastError = new Error(`GLM API returned status ${response.status}`);
    } catch (err) {
      lastError = err as Error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < maxAttempts) {
      await sleep(300 * Math.pow(2, attempt - 1));
    }
  }

  if (!response || !response.ok) {
    const error: any = lastError || new Error("GLM API request failed.");
    error.response = response;
    throw error;
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  
  // Clean content in case of markdown blocks
  const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
  
  if (!jsonString) {
    throw new Error("Empty response from GLM API");
  }

  const analysis = JSON.parse(jsonString);

  return normalizeAnalysis(analysis);
}

function normalizeAnalysis(raw: any): GLMAnalysis {
  let fallbackUsed = false;

  const safeNumber = (val: any, defaultVal: number) => {
    const num = Number(val);
    if (isNaN(num)) {
      fallbackUsed = true;
      return defaultVal;
    }
    return num;
  };

  const safeString = (val: any, defaultVal: string) => {
    if (typeof val !== 'string' || val.trim() === '') {
      fallbackUsed = true;
      return defaultVal;
    }
    return val.trim();
  };

  const safeArray = (val: any) => {
    if (!Array.isArray(val)) {
      fallbackUsed = true;
      return [];
    }
    return val;
  };

  const amountLost = safeNumber(raw.amountLost, 0);
  const missingInfo = safeArray(raw.missingInfo);
  
  // Enums coercions
  const validUrgencies = ['LOW', 'MEDIUM', 'HIGH'];
  let urgency: Urgency = 'MEDIUM';
  if (validUrgencies.includes(raw.urgency)) {
    urgency = raw.urgency as Urgency;
  } else if (raw.urgency) {
    fallbackUsed = true;
  }

  const validPriorities = ['NORMAL', 'HIGH'];
  let priority: Priority = 'NORMAL';
  if (validPriorities.includes(raw.priority)) {
    priority = raw.priority as Priority;
  } else if (raw.priority) {
    fallbackUsed = true;
  }

  let workflowStatus: WorkflowStatus = missingInfo.length > 0 ? "NEEDS_INFO" : "ROUTED";

  if (fallbackUsed) {
    console.log("Normalization fallback used for some missing or invalid fields.");
  }

  return {
    detectedLanguage: safeString(raw.detectedLanguage, "English"),
    scamType: safeString(raw.scamType, "UNKNOWN"),
    amountLost,
    urgency,
    priority,
    summary: safeString(raw.summary, "Analysis incomplete. Manual review required."),
    missingInfo,
    suggestedStep: safeString(raw.suggestedStep, "Contact authorities."),
    suggestedRouting: safeString(raw.suggestedRouting, "General Triage"),
    assignedAgency: safeString(raw.assignedAgency, "PDRM CCID"),
    workflowStatus,
    confidence: safeNumber(raw.confidence, 0.5)
  };
}

export function mockAnalyzeCase(description: string): GLMAnalysis {
  return {
    detectedLanguage: "English (Fallback)",
    scamType: "UNKNOWN",
    amountLost: 0,
    urgency: "MEDIUM",
    priority: "NORMAL",
    summary: "System used fallback analysis due to API connectivity issues.",
    missingInfo: ["Full transaction details"],
    suggestedStep: "Call 997 (NSRC) immediately.",
    suggestedRouting: "General Triage",
    assignedAgency: "Manual Review Unit",
    workflowStatus: "NEEDS_INFO",
    confidence: 0
  };
}
