import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CaseInteractions from './CaseInteractions';

export default async function VictimCaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUser();

  if (!session || session.role !== 'VICTIM') {
    redirect('/victim/login');
  }

  const { id } = await params;

  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      followUpTasks: {
        orderBy: { createdAt: 'asc' },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      evidence: true,
    },
  });

  if (!caseRecord || caseRecord.userId !== session.userId) {
    notFound();
  }

  const documents = Array.isArray(caseRecord.documents) ? caseRecord.documents : [];

  return (
    <>
      <div className="mb-4">
        <Link
          href="/victim/dashboard"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Case Reference: {caseRecord.id}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Reported on {new Date(caseRecord.createdAt).toLocaleString()}
            </p>
          </div>

          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {caseRecord.workflowStatus}
          </span>
        </div>

        <div className="border-t border-slate-200 px-4 py-5 sm:px-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Scam Type</p>
            <p className="text-slate-900 font-medium">
              {caseRecord.scamType || 'Pending Analysis'}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Urgency</p>
            <p className="text-slate-900 font-medium">
              {caseRecord.urgency || 'Pending Analysis'}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Amount Lost</p>
            <p className="text-slate-900 font-medium">
              {caseRecord.amountLost ? `RM ${caseRecord.amountLost}` : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Assigned Agency</p>
            <p className="text-slate-900 font-medium">
              {caseRecord.assignedAgency || 'Pending Assignment'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm text-slate-500">Description</p>
            <p className="whitespace-pre-wrap text-slate-900">
              {caseRecord.rawDescription}
            </p>
          </div>

          {caseRecord.summary && (
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500">Case Summary</p>
              <p className="text-slate-900 whitespace-pre-wrap">
                {caseRecord.summary}
              </p>
            </div>
          )}

          {caseRecord.suggestedStep && (
            <div className="sm:col-span-2 bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">Suggested Next Step</p>
              <p className="mt-1 text-sm text-yellow-900">{caseRecord.suggestedStep}</p>
            </div>
          )}

          {caseRecord.suggestedRouting && (
            <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-md border border-indigo-200">
              <p className="text-sm font-medium text-indigo-800">Suggested Routing</p>
              <p className="mt-1 text-sm text-indigo-900 whitespace-pre-wrap">
                {caseRecord.suggestedRouting}
              </p>
            </div>
          )}
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Generated Document Drafts
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Read-only drafts generated for your case.
          </p>

          {documents.map((doc: any, i: number) => (
            <details key={i} className="border border-slate-200 p-3 rounded mb-2">
              <summary className="cursor-pointer font-medium text-slate-900">
                {doc.title || `Draft ${i + 1}`}
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-slate-800">
                {doc.content}
              </p>
            </details>
          ))}
        </div>
      )}

      <div className="mt-8">
        <CaseInteractions caseRecord={caseRecord} />
      </div>

      {caseRecord.evidence.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Evidence</h3>
          <p className="text-sm text-slate-600 mb-3">
            Supporting evidence currently linked to this case.
          </p>

          <div className="space-y-4">
            {caseRecord.evidence.map((item: any) => (
              <div key={item.id}>
                {item.fileUrl.startsWith('data:image') ? (
                  <img
                    src={item.fileUrl}
                    alt="Evidence"
                    className="max-w-xs rounded border border-slate-300"
                  />
                ) : (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Uploaded File
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}