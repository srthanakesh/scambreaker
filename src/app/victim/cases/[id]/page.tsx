import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CaseInteractions from './CaseInteractions';

export default async function VictimCaseDetail({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'VICTIM') {
    redirect('/victim/login');
  }

  // Await the params object before accessing its properties (Next.js 15 requires this)
  const id = (await params).id;

  const caseRecord = await prisma.case.findUnique({
    where: { id: id },
    include: {
      followUpTasks: true,
      messages: true,
    }
  });

  if (!caseRecord || caseRecord.userId !== session.userId) {
    notFound();
  }

  return (
    <>
      <div className="mb-4">
        <Link href="/victim/dashboard" className="inline-flex items-center text-slate-500 hover:text-slate-900 text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-slate-900">Case Reference: {caseRecord.id}</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">Reported on {new Date(caseRecord.createdAt).toLocaleString()}</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {caseRecord.workflowStatus}
            </span>
          </div>
          <div className="border-t border-slate-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Scam Type</dt>
                <dd className="mt-1 text-sm text-slate-900">{caseRecord.scamType || 'Pending Analysis'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Amount Lost</dt>
                <dd className="mt-1 text-sm text-slate-900">RM {caseRecord.amountLost}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500">Description</dt>
                <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{caseRecord.rawDescription}</dd>
              </div>
              
              {caseRecord.suggestedStep && (
                <div className="sm:col-span-2 bg-yellow-50 p-4 rounded-md">
                  <dt className="text-sm font-medium text-yellow-800">Next Step Advice</dt>
                  <dd className="mt-1 text-sm text-yellow-900">{caseRecord.suggestedStep}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        <CaseInteractions caseRecord={caseRecord} />
    </>
  );
}
