'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading analysis...</div>;
  if (!caseData) return <div className="text-center py-20">Case not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg border">
        <div className="px-4 py-5 sm:px-6 bg-green-50 border-b">
          <h3 className="text-xl font-bold text-green-800">Report Analyzed Successfully</h3>
          <p className="mt-1 text-sm text-green-600">Case ID: {caseData.id}</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-8">
          {/* Analysis Summary */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">GLM Incident Analysis</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500">Scam Type</p>
                <p className="font-bold text-gray-900">{caseData.scamType}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500">Urgency</p>
                <p className={`font-bold ${
                  caseData.urgency === 'HIGH' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {caseData.urgency}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500">Estimated Loss</p>
                <p className="font-bold text-gray-900">
                  {caseData.amountLost ? `RM ${caseData.amountLost.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-700 italic border-l-4 pl-3 py-1 bg-gray-50">"{caseData.summary}"</p>
          </section>

          {/* Follow-up Tasks */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Immediate Actions Required</h4>
            <div className="space-y-3">
              {caseData.followUpTasks?.map((task: any) => (
                <div key={task.id} className="flex items-start p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full border-2 border-blue-400"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-blue-900">{task.title}</p>
                    <p className="text-sm text-blue-800 mt-1">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Document Drafts */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Generated Document Drafts</h4>
            <div className="grid grid-cols-1 gap-6">
              {caseData.documents?.map((doc: any, i: number) => (
                <div key={i} className="border rounded-md">
                  <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{doc.title}</span>
                    <button className="text-xs text-blue-600 hover:underline">Copy Text</button>
                  </div>
                  <div className="p-4 bg-white text-sm text-gray-800 whitespace-pre-wrap font-mono h-40 overflow-y-auto">
                    {doc.content}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Missing Info */}
          {caseData.missingInfo && caseData.missingInfo.length > 0 && (
            <section className="bg-orange-50 p-4 rounded-md border border-orange-100">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">Missing Evidence</h4>
              <ul className="list-disc pl-5 text-sm text-orange-900 space-y-1">
                {caseData.missingInfo.map((info: string, i: number) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t flex justify-between">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            &larr; Back to Home
          </Link>
          <div className="space-x-4">
            <span className="text-xs text-gray-500 italic">Workflow: {caseData.workflowStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
