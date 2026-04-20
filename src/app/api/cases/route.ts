import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeCase } from '@/services/glm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawDescription } = await request.json();

    if (!rawDescription) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // 1. Run Real GLM analysis
    const analysis = await analyzeCase(rawDescription);

    // 2. Create the case with full analysis and documents
    const newCase = await prisma.case.create({
      data: {
        userId: session.userId,
        rawDescription,
        detectedLanguage: analysis.detectedLanguage,
        scamType: analysis.scamType,
        amountLost: analysis.amountLost,
        urgency: analysis.urgency,
        summary: analysis.summary,
        missingInfo: analysis.missingInfo,
        suggestedStep: analysis.suggestedStep,
        suggestedRouting: analysis.suggestedRouting,
        assignedAgency: analysis.assignedAgency,
        priority: analysis.priority,
        workflowStatus: analysis.workflowStatus,
        documents: analysis.documents,
        // Create follow-up tasks
        followUpTasks: {
          create: analysis.tasks.map(t => ({
            title: t.title,
            description: t.description,
            dueAt: new Date(Date.now() + t.dueDays * 24 * 60 * 60 * 1000)
          }))
        },
        // Create authority ticket
        ticket: {
          create: {
            priority: analysis.priority,
            assignedAgency: analysis.assignedAgency,
            status: 'OPEN',
          }
        }
      },
    });

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      include: {
        ticket: true,
        followUpTasks: true
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}
