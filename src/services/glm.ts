import { ZAI_SYSTEM_PROMPT } from '../lib/prompts/zai-system-prompt';
import { DOCUMENT_GENERATION_PROMPT } from '../lib/prompts/document-generation-prompt';

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
      // The warning is already logged where the key is read.
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

const GLM_FALLBACK_MODELS = ['glm-5.1', 'glm-4.6v', 'glm-4.5-air'];

async function fetchWithModelFallback(apiKey: string, basePayload: any, maxRetriesPerModel: number = 2) {
  const baseModel = process.env.GLM_MODEL || "glm-5.1";
  const testModels = [baseModel, ...GLM_FALLBACK_MODELS.filter(m => m !== baseModel)];
  
  let lastError: Error | null = null;
  let response: Response | null = null;

  for (const model of testModels) {
    const payload = JSON.stringify({ ...basePayload, model });
    
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
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
          return response;
        }
        
        if (response.status === 429 || response.status >= 500) {
          console.warn(`[GLM] Model ${model} returned ${response.status}, falling back to next model...`);
          lastError = new Error(`Model ${model} returned status ${response.status}`);
          break; // break retries, move to next model
        }
        lastError = new Error(`GLM API returned status ${response.status}`);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`[GLM] Model ${model} timed out, falling back...`);
          lastError = new Error(`Model ${model} timeout`);
          break; // break retries on timeout, try next model
        }
        lastError = err as Error;
      } finally {
        clearTimeout(timeout);
      }
      
      if (attempt < maxRetriesPerModel) {
        await sleep(300 * Math.pow(2, attempt - 1));
      }
    }
  }

  const error: any = lastError || new Error("All GLM models failed.");
  error.response = response;
  throw error;
}

async function glmAnalyzeCase(description: string): Promise<GLMAnalysis> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    console.warn('[GLM] API key not found — using mock fallback.');
    throw new Error("GLM_API_KEY is not configured.");
  }

  const basePayload = {
    messages: [
      { role: "system", content: ZAI_SYSTEM_PROMPT },
      { role: "user", content: `Analyze this scam report: "${description}"` }
    ],
    temperature: 0.1,
  };

  const response = await fetchWithModelFallback(apiKey, basePayload);
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
  
  if (!jsonString) {
    throw new Error("Empty response from GLM API");
  }

  return normalizeAnalysis(JSON.parse(jsonString));
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithGLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    console.warn('[GLM] API key not found');
    throw new Error("GLM_API_KEY is not configured.");
  }

  const basePayload = {
    messages: [
      { role: "system", content: ZAI_SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.7,
  };

  const response = await fetchWithModelFallback(apiKey, basePayload);
  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

export function normalizeAnalysis(raw: any): GLMAnalysis {
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

export async function generateFormalDocuments(
  caseId: string, 
  rawDescription: string, 
  summary: string,
  victimInfo?: { fullName?: string; icNumber?: string; phoneNumber?: string; email?: string }
): Promise<{ police_report_draft: string, bank_dispute_draft: string } | null> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return null;

  const now = new Date();
  const currentDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const victimBlock = victimInfo ? `
Victim Personal Details (use these to fill in MAKLUMAT PENGADU and letter sender):
- Full Name: ${victimInfo.fullName || '[TIDAK DIKETAHUI]'}
- IC Number: ${victimInfo.icNumber || '[TIDAK DIKETAHUI]'}
- Phone: ${victimInfo.phoneNumber || '[TIDAK DIKETAHUI]'}
- Email: ${victimInfo.email || '[TIDAK DIKETAHUI]'}` : '';

  const basePayload = {
    messages: [
      { role: "system", content: DOCUMENT_GENERATION_PROMPT },
      { role: "user", content: `Case ID: ${caseId}\nCurrent Date: ${currentDate}\nCurrent Time: ${currentTime}\n${victimBlock}\nRaw User Input: "${rawDescription}"\nAI Summary: "${summary}"\n\nIMPORTANT: If the raw input says "today", use ${currentDate}. If it says "yesterday", calculate the previous day. Always resolve relative dates to DD/MM/YYYY format.\n\nPlease generate the two required documents exactly as specified in your system instructions. Fill in ALL fields using the available information. For missing fields, use [TIDAK DIKETAHUI — UNTUK DISAHKAN] in the police report and [UNKNOWN — TO BE VERIFIED] in the bank letter.` }
    ],
    temperature: 0.1,
  };

  try {
    const response = await fetchWithModelFallback(apiKey, basePayload, 1);
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*"police_report_draft"[\s\S]*\}/);
    if (!jsonMatch) return null;
    const jsonString = (jsonMatch[1] || jsonMatch[0]).trim();
    
    if (!jsonString) return null;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Document generation failed:", error);
    return null;
  }
}
