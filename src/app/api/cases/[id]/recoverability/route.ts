import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // IMPORTANT: prevents build-time execution

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Import inside handler to prevent build-time execution crashes
    const { prisma } = await import('@/lib/prisma');
    const { getCurrentUser } = await import('@/lib/auth');
    const { getDynamicRecoverability } = await import('@/lib/recoverability-engine');

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        recoverabilityScore: true,
        createdAt: true,
        workflowStatus: true,
        evidence: { select: { id: true } },
      },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Don't decay resolved/closed cases
    if (
      caseRecord.workflowStatus === 'RESOLVED' ||
      caseRecord.workflowStatus === 'CLOSED'
    ) {
      return NextResponse.json({
        originalScore: caseRecord.recoverabilityScore ?? 0,
        currentScore: caseRecord.recoverabilityScore ?? 0,
        currentLevel: 'LOW',
        elapsedMinutes: Math.floor(
          (Date.now() - new Date(caseRecord.createdAt).getTime()) / 60000
        ),
        isLocked: true,
      });
    }

    const dynamic = getDynamicRecoverability(
      caseRecord.recoverabilityScore ?? 0,
      caseRecord.createdAt
    );

    return NextResponse.json({
      originalScore: caseRecord.recoverabilityScore ?? 0,
      currentScore: dynamic.currentScore,
      currentLevel: dynamic.currentLevel,
      elapsedMinutes: dynamic.elapsedMinutes,
      isLocked: false,
    });
  } catch (error) {
    console.error('Error fetching recoverability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recoverability' },
      { status: 500 }
    );
  }
}