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
  documents: Array<{ title: string; content: string }>;
  tasks: Array<{ title: string; description: string; dueDays: number }>;
  confidence: number;
}

export async function analyzeCase(description: string): Promise<GLMAnalysis> {
  console.log("--- Starting GLM Analysis ---");
  try {
    const analysis = await glmAnalyzeCase(description);
    console.log("GLM Analysis Successful:", analysis.scamType);
    return analysis;
  } catch (error: any) {
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
    return mockAnalyzeCase(description);
  }
}

async function glmAnalyzeCase(description: string): Promise<GLMAnalysis> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    throw new Error("GLM_API_KEY is not configured in environment variables.");
  }

  const model = process.env.GLM_MODEL || "glm-4-flash"; // updated to a typical fast model or use what was there before
  
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an expert Cybercrime Investigator in Malaysia. 
          Analyze the victim's scam report and return a JSON object.
          
          Required JSON structure:
          {
            "detectedLanguage": "string",
            "scamType": "string",
            "amountLost": number,
            "urgency": "LOW|MEDIUM|HIGH",
            "priority": "NORMAL|HIGH",
            "summary": "string",
            "missingInfo": ["string"],
            "suggestedStep": "string",
            "suggestedRouting": "string",
            "assignedAgency": "string",
            "confidence": number
          }
          
          Malaysian Agencies to use for assignedAgency: [PDRM CCID, MCMC, Bank Negara Malaysia, NSRC, KPDN].`
        },
        {
          role: "user",
          content: `Analyze this scam report: "${description}"`
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    // We attach the response to the error object so the catch block can log it
    const error: any = new Error(`GLM API returned status ${response.status}`);
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

  return normalizeAnalysis(analysis, description);
}

function normalizeAnalysis(raw: any, description: string): GLMAnalysis {
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

  // Standard Malaysian Task Templates
  const tasks = [
    { title: "Contact NSRC", description: "Call 997 immediately to block the mule account.", dueDays: 0 }
  ];
  if (amountLost > 500) {
    tasks.push({ title: "Lodge Police Report", description: "Visit the nearest station with all evidence.", dueDays: 1 });
  }
  if (missingInfo.length > 0) {
    tasks.push({ title: "Upload Evidence", description: `Please provide: ${missingInfo.join(", ")}`, dueDays: 2 });
  }

  // Standard Document Templates
  const documents = [
    {
      title: "Draft Police Report",
      content: `PDRM REPORT DRAFT\n\nIncident: ${safeString(raw.scamType, "UNKNOWN")}\nSummary: ${safeString(raw.summary, "Analysis incomplete. Manual review required.")}\nAmount: RM ${amountLost}\nDetails: ${description.substring(0, 100)}...`
    }
  ];

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
    documents,
    tasks,
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
    documents: [{ title: "Incident Brief", content: description }],
    tasks: [{ title: "Manual Verification", description: "An officer needs to verify this case.", dueDays: 1 }],
    confidence: 0
  };
}
