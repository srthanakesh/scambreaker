import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        messages: true,
        evidence: true,
        ticket: true,
        followUpTasks: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        workflowStatus: body.workflowStatus,
        authorityNotes: body.authorityNotes,
        missingInfo: body.missingInfo,
        documents: body.documents,
        assignedAgency: body.assignedAgency,
        priority: body.priority,
      },
      include: {
        ticket: true,
        followUpTasks: true,
      }
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}
