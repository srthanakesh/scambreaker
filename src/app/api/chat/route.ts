import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { chatWithGLM, normalizeAnalysis } from '@/services/glm';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const responseText = await chatWithGLM(messages);

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

          // Extract action steps
          try {
            const stepsSection = reply.split(/#### 3\. ACTION STEPS/i)[1]?.split(/#### 4\./)[0] || '';
            const stepLines = stepsSection.split('\n').filter(line => line.trim() !== '');
            
            const parsedSteps = [];
            let currentStep: any = null;

            for (const line of stepLines) {
              const match = line.match(/^(\d+)\.\s+(.*)/);
              if (match) {
                if (currentStep) parsedSteps.push(currentStep);
                const stepNum = parseInt(match[1]);
                currentStep = {
                  id: `step-${stepNum}`,
                  title: match[2].trim(),
                  description: '',
                  priority: stepNum === 1 ? 'IMMEDIATE' : stepNum === 2 ? 'URGENT' : 'STANDARD',
                  phoneNumber: null
                };
              } else if (currentStep) {
                const phoneMatch = line.match(/(\d{1,4}-\d{3,4}-\d{4,5}|\d{3})/); // Matches 997 or 1300-880-900
                if (phoneMatch) {
                  currentStep.phoneNumber = phoneMatch[0];
                } else {
                  currentStep.description += (currentStep.description ? ' ' : '') + line.trim();
                }
              }
            }
            if (currentStep) parsedSteps.push(currentStep);
            actionSteps = parsedSteps.length > 0 ? parsedSteps : null;
          } catch (e) {
            console.error("Failed to parse action steps:", e);
            actionSteps = null;
          }
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
