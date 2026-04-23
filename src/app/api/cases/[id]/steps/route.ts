import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({ where: { id }, select: { documents: true } });
  if (!caseRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const docs = Array.isArray(caseRecord.documents) ? caseRecord.documents : [];
  const stepsEntry = (docs as any[]).find((d: any) => d.type === 'completed_action_steps');
  
  return NextResponse.json({ completedSteps: stepsEntry?.steps || {} });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { completedSteps } = await request.json();

  const caseRecord = await prisma.case.findUnique({ where: { id }, select: { documents: true, userId: true } });
  if (!caseRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (caseRecord.userId !== session.userId && session.role !== 'AUTHORITY') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const docs = Array.isArray(caseRecord.documents) ? (caseRecord.documents as any[]) : [];
  
  // Update or insert the completed_action_steps entry
  const existingIdx = docs.findIndex((d: any) => d.type === 'completed_action_steps');
  const stepsEntry = { type: 'completed_action_steps', steps: completedSteps, updatedAt: new Date().toISOString() };
  
  if (existingIdx >= 0) {
    docs[existingIdx] = stepsEntry;
  } else {
    docs.push(stepsEntry);
  }

  await prisma.case.update({
    where: { id },
    data: { documents: docs as any },
  });

  return NextResponse.json({ success: true });
}
