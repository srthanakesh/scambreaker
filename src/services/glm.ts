import { ZAI_SYSTEM_PROMPT } from '../lib/prompts/zai-system-prompt';
import { DOCUMENT_GENERATION_PROMPT } from '../lib/prompts/document-generation-prompt';
import { malaysiaBanks } from '../lib/malaysia-banks';

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

export async function restructureStatement(rawDescription: string, userDetails: any, attachments?: Array<{ file_name: string; file_type: string }>, ocrExtractions?: Array<{ source_file: string; ocr_text: string; confidence: number }>): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    console.warn('[GLM] API key not found, skipping statement restructuring');
    return rawDescription;
  }

  const victimName = userDetails.fullName || userDetails.name || "-";
  const victimEmail = userDetails.email || "-";
  const victimPhone = userDetails.phoneNumber || userDetails.phone || "-";
  const victimIC = userDetails.icNumber || "-";

  const attachmentsList = attachments && attachments.length > 0
    ? attachments.map(a => `${a.file_name} (${a.file_type})`).join("; ")
    : "No";

  const ocrContext = ocrExtractions && ocrExtractions.length > 0
    ? `\n\n[INTERNAL OCR DATA — Use this only to improve understanding. Do NOT expose raw OCR text, confidence scores, or extraction markers in the output.]\n${ocrExtractions.map(e => `File: ${e.source_file}\nConfidence: ${e.confidence}\nText: ${e.ocr_text}`).join("\n\n")}`
    : "";

  const bankRefTable = malaysiaBanks.map(b =>
    `${b.short_name} (aliases: ${b.aliases.join(', ')})`
  ).join('\n');

  const systemPrompt = `You are the Victim Statement Structuring Agent for ScamBreaker Malaysia.

Your task is to transform messy, emotional, fragmented, or shorthand scam reports into a professional, structured victim statement for case review by authorities.

STRICT RULES:
1. Do NOT invent facts. Do NOT guess missing information.
2. If a value is missing, unclear, or not provided, output "-".
3. Victim identity details must come from the provided database fields only.
4. Do NOT repeat full victim identity details inside the statement paragraph unless necessary for readability.
5. Rewrite shorthand, broken grammar, slang, and numbering into proper formal English.
6. Convert obvious money values into proper currency format (e.g., rm20k -> RM20,000, rm150k -> RM150,000).
7. Standardize dates and times where obvious, but do not guess.
8. If attachments exist, show them as metadata only — do NOT paste OCR output into the visible statement, do NOT show extraction confidence, do NOT show BEGIN EXTRACTED TEXT / END EXTRACTED TEXT markers.
9. Hidden OCR/extracted text may be used internally to improve understanding only.
10. Only include information from OCR in the final statement if clearly relevant, reliable, and naturally rewritten.
11. Never expose raw extraction text in the final output.
12. Keep the tone professional, neutral, and concise.
13. Write like a cleaned formal case intake record — not like an AI assistant.
14. BANK NAME NORMALIZATION: When the victim mentions any bank name, short name, nickname, or app name (e.g., "m2u", "mae", "cimb clicks", "hlb", "pbb", "gxbank"), you MUST resolve it to the official short_name from the bank reference table below. For example: "m2u" -> "Maybank", "octo" -> "CIMB", "hlb" -> "Hong Leong", "gxbank" -> "GX Bank". Always use the official short_name in the output fields.

FIELD EXTRACTION GUIDELINES:
Extract these carefully from the raw input:
- scam type (e.g., Loan scam, Investment scam, Job scam, Parcel scam, Love scam, Impersonation scam, E-commerce scam, Banking phishing scam, Account takeover scam, Education loan scam, Housing loan scam, Unknown / suspected scam)
- amount
- payment method
- date and time of incident
- reporting date
- source bank
- destination bank
- communication channel / platform / app / site used
- relevant names or entities
- transaction direction
- reason victim believed the transfer/request
- urgency clues

If unclear, use "-".

OUTPUT MUST be valid JSON matching this structure exactly:

{
  "victim_details": {
    "name": "${victimName}",
    "email": "${victimEmail}",
    "phone_number": "${victimPhone}",
    "ic_number": "${victimIC}"
  },
  "structured_statement": {
    "summary": {
      "scam_type": "...",
      "amount_involved": "...",
      "payment_method": "...",
      "date_time_of_incident": "...",
      "reporting_date": "...",
      "source_bank": "...",
      "destination_bank": "...",
      "channel_used": "...",
      "suspected_scam_pattern": "...",
      "attachments_provided": "Yes / No"
    },
    "victim_statement": "Write a clean formal paragraph or short multi-paragraph statement describing what happened. Professional, neutral, concise. No dramatic language, no legal conclusions, no assumptions."
  },
  "attachments": ["file1.jpg (uploaded image)", "file2.pdf (uploaded document)"]
}

Rules:
- Output raw JSON only. No markdown formatting.
- Do not guess missing facts. If unclear, use "-".
- Keep output professional and concise.
- Convert shorthand money values into proper RM format.
- Convert messy numbering into readable format.
- The attachments array should list file names and types. If none, use an empty array [].
- IMPORTANT: source_bank and destination_bank MUST use the official short_name from the bank reference table. Never use nicknames, app names, or aliases as the bank value in the output.

MALAYSIA BANK REFERENCE TABLE (use short_name for output fields):
${bankRefTable}`;

  const basePayload = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `database_victim_details:\n${JSON.stringify({ name: victimName, email: victimEmail, phone_number: victimPhone, ic_number: victimIC })}\n\nraw_user_input:\n"${rawDescription}"\n\nattachments:\n${attachments ? JSON.stringify(attachments) : "[]"}${ocrContext}` }
    ],
    temperature: 0.1,
  };

  try {
    const response = await fetchWithModelFallback(apiKey, basePayload);
    const result = await response.json();
    let content = result.choices?.[0]?.message?.content || "";

    content = content.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim();
    const parsed = JSON.parse(content);

    const attList = Array.isArray(parsed.attachments) && parsed.attachments.length > 0
      ? parsed.attachments.map((a: string) => `- ${a}`).join('\n')
      : '-';

    return `Victim Details
- Name: ${parsed.victim_details?.name || '-'}
- Email: ${parsed.victim_details?.email || '-'}
- Phone Number: ${parsed.victim_details?.phone_number || '-'}
- IC Number: ${parsed.victim_details?.ic_number || '-'}

Statement Summary
- Scam Type: ${parsed.structured_statement?.summary?.scam_type || '-'}
- Amount Involved: ${parsed.structured_statement?.summary?.amount_involved || '-'}
- Payment Method: ${parsed.structured_statement?.summary?.payment_method || '-'}
- Date/Time of Incident: ${parsed.structured_statement?.summary?.date_time_of_incident || '-'}
- Reporting Date: ${parsed.structured_statement?.summary?.reporting_date || '-'}
- Source Bank: ${parsed.structured_statement?.summary?.source_bank || '-'}
- Destination Bank: ${parsed.structured_statement?.summary?.destination_bank || '-'}
- Channel Used: ${parsed.structured_statement?.summary?.channel_used || '-'}
- Suspected Scam Pattern: ${parsed.structured_statement?.summary?.suspected_scam_pattern || '-'}
- Attachments Provided: ${parsed.structured_statement?.summary?.attachments_provided || (attachments && attachments.length > 0 ? 'Yes' : 'No')}

Victim Statement
${parsed.structured_statement?.victim_statement || '-'}

Attachments
${attList}`;
  } catch (error) {
    console.error("Statement Restructuring Failed:", error);
    return rawDescription; // Fallback to original description if it fails
  }
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
