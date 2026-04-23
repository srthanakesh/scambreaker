import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logWorkflowEvent } from '@/lib/workflow-log';

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'VICTIM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fileUrl } = body || {};

    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json({ error: 'Evidence file is required' }, { status: 400 });
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!caseRecord || caseRecord.userId !== session.userId) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const evidence = await prisma.evidence.create({
      data: { caseId: id, fileUrl },
    });

    await logWorkflowEvent({
      caseId: id,
      eventType: 'EVIDENCE_UPLOADED',
      message: 'Victim uploaded supporting evidence.',
      actorType: 'VICTIM',
      actorId: session.userId,
    });

    return NextResponse.json(evidence);
  } catch (error) {
    console.error('Error uploading evidence:', error);
    return NextResponse.json({ error: 'Failed to upload evidence' }, { status: 500 });
  }
}
