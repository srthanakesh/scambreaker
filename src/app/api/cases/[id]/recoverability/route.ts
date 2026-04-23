import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getDynamicRecoverability } from '@/lib/recoverability-engine';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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
    if (caseRecord.workflowStatus === 'RESOLVED' || caseRecord.workflowStatus === 'CLOSED') {
      return NextResponse.json({
        originalScore: caseRecord.recoverabilityScore ?? 0,
        currentScore: caseRecord.recoverabilityScore ?? 0,
        currentLevel: 'LOW',
        elapsedMinutes: Math.floor((Date.now() - new Date(caseRecord.createdAt).getTime()) / 60000),
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
    return NextResponse.json({ error: 'Failed to fetch recoverability' }, { status: 500 });
  }
}
