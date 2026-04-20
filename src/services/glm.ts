export interface GLMAnalysis {
  detectedLanguage: string;
  scamType: string;
  amountLost: number;
  urgency: string;
  priority: string;
  summary: string;
  missingInfo: string[];
  suggestedStep: string;
  suggestedRouting: string;
  assignedAgency: string;
  workflowStatus: string;
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
    // Log the full error if it's an API error
    if (error.response) {
      console.error("API Error Details:", await error.response.text());
    }
    return mockAnalyzeCase(description);
  }
}

async function glmAnalyzeCase(description: string): Promise<GLMAnalysis> {
  const apiKey = process.env.GLM_API_KEY;
  const model = process.env.GLM_MODEL || "glm-5-turbo";
  
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
      // Some versions of GLM might not support response_format: { type: "json_object" } 
      // so we rely on the prompt but keep it as a hint if supported.
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GLM API ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  // Clean content in case of markdown blocks
  const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
  const analysis = JSON.parse(jsonString);

  return normalizeAnalysis(analysis, description);
}

function normalizeAnalysis(raw: any, description: string): GLMAnalysis {
  const amountLost = Number(raw.amountLost) || 0;
  const missingInfo = Array.isArray(raw.missingInfo) ? raw.missingInfo : [];
  const workflowStatus = missingInfo.length > 0 ? "NEEDS_INFO" : "ROUTED";

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
      content: `PDRM REPORT DRAFT\n\nIncident: ${raw.scamType}\nSummary: ${raw.summary}\nAmount: RM ${amountLost}\nDetails: ${description.substring(0, 100)}...`
    }
  ];

  return {
    detectedLanguage: raw.detectedLanguage || "English",
    scamType: raw.scamType || "General Scam",
    amountLost,
    urgency: raw.urgency || "MEDIUM",
    priority: raw.priority || "NORMAL",
    summary: raw.summary || "No summary provided.",
    missingInfo,
    suggestedStep: raw.suggestedStep || "Contact authorities.",
    suggestedRouting: raw.suggestedRouting || "Cyber Crime Division",
    assignedAgency: raw.assignedAgency || "PDRM CCID",
    workflowStatus,
    documents,
    tasks,
    confidence: raw.confidence || 0.5
  };
}

export function mockAnalyzeCase(description: string): GLMAnalysis {
  return {
    detectedLanguage: "English (Fallback)",
    scamType: "Unknown Scam",
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
