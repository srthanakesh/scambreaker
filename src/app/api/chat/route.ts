import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { chatWithGLM, normalizeAnalysis } from '@/services/glm';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, language } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const languageMap: Record<string, string> = {
      'en': 'English',
      'ms': 'Bahasa Melayu',
      'zh': 'Chinese (Mandarin)',
      'ta': 'Tamil'
    };
    const targetLanguage = languageMap[language as string] || 'English';

    const now = new Date();
    const currentDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const chatMessages = [
      { role: 'system', content: `CRITICAL STRICT RULE: You MUST reply entirely in ${targetLanguage}. Do not use any other language to communicate with the user. When asking for missing information, YOU MUST ALWAYS use a concise, bulleted list format. NEVER ask for information using conversational paragraphs. Preserve the STAGE 3 logical flow exactly, but output in ${targetLanguage}. CURRENT DATE: ${currentDate}. CURRENT TIME: ${currentTime}. When the user says "today", use ${currentDate}. When they say "yesterday", calculate the previous day.` },
      ...messages
    ];

    const responseText = await chatWithGLM(chatMessages);

    // Extract JSON block if present
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*"scamType"[\s\S]*\}/);
    
    let isReady = false;
    let analysisJson = null;
    let reply = responseText;
    let actionSteps = null;
    let riskLevel = null;

    if (jsonMatch) {
      try {
        const potentialJson = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(potentialJson.trim());
        if (parsed.scamType) {
          isReady = true;
          analysisJson = normalizeAnalysis(parsed);
          // Remove the JSON block from the reply text
          reply = responseText.replace(jsonMatch[0], '').trim();

          // Extract risk level
          const urgencyMap: Record<string, string> = {
            'HIGH': 'CRITICAL',
            'MEDIUM': 'URGENT',
            'LOW': 'RECOVERY'
          };
          riskLevel = urgencyMap[analysisJson.urgency] || 'RECOVERY';
          
          actionSteps = null; // Removed obsolete text extraction logic
        }
      } catch (e) {
        console.error("Failed to parse GLM JSON block:", e);
      }
    }

    return NextResponse.json({
      reply,
      isReady,
      analysisJson,
      actionSteps,
      riskLevel
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ 
      reply: "I'm having trouble connecting to my analysis system. Let's try again in a moment.",
      isReady: false, 
      analysisJson: null,
      actionSteps: null,
      riskLevel: null
    });
  }
}
