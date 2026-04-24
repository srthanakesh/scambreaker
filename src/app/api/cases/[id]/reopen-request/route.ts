import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX: get id properly
    const { id } = await context.params;

    const session = await getCurrentUser();

    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await request.json();

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // ✅ FIX: use id (not params.id)
    const caseRecord = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // ✅ FIX: use session.userId (not session.id)
    if (caseRecord.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (caseRecord.workflowStatus !== 'RESOLVED') {
      return NextResponse.json(
        { error: 'Only resolved cases can request reopen' },
        { status: 400 }
      );
    }

    // use updatedAt as resolved time
    const resolvedAt = caseRecord.updatedAt;

    const reopenDeadline = new Date(
      resolvedAt.getTime() + 3 * 24 * 60 * 60 * 1000
    );

    if (new Date() > reopenDeadline) {
      return NextResponse.json(
        { error: 'Reopen request window has expired' },
        { status: 400 }
      );
    }

    // create message for authority
    await prisma.message.create({
      data: {
        caseId: caseRecord.id,
        role: 'user',
        content: `Reopen request from victim:\n\n${reason.trim()}`,
      },
    });

    // update case status
    await prisma.case.update({
      where: { id },
      data: {
        workflowStatus: 'FOLLOW_UP_PENDING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to submit reopen request:', error);

    return NextResponse.json(
      { error: 'Failed to submit reopen request' },
      { status: 500 }
    );
  }
}