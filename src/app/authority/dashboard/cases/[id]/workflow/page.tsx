'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function WorkflowPage() {
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

  if (loading) return <div className="text-center py-20 font-bold">Loading workflow...</div>;
  if (!caseData) return <div className="text-center py-20 font-bold">Case not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/cases/${id}`} className="text-blue-600 font-bold">&larr; Back to Case</Link>
        <h1 className="text-2xl font-bold">Official Workflow: {caseData.assignedAgency}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Agency Checklist</h2>
            <div className="space-y-3">
              {[
                "Verify Victim Identity",
                "Cross-reference Bank Accounts",
                "Flag Transaction in NSRC Database",
                "Initiate Communication with Recipient Bank",
                "Update Police Investigation File"
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Next Required Step</h2>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded">
              <p className="text-sm font-bold text-blue-900">Inter-agency Handover</p>
              <p className="text-xs text-blue-800 mt-1">Pending response from CCID regarding suspect's mule account history.</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold w-full">Request Agency Update</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Ticket Summary</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Ticket ID</dt>
                <dd className="text-sm font-mono bg-gray-100 p-1 rounded mt-1">{caseData.ticket?.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Assigned Officer</dt>
                <dd className="text-sm font-bold">Officer #A1024 (Pending)</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Priority Level</dt>
                <dd className="text-sm font-bold text-red-600">{caseData.priority}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Target Resolution</dt>
                <dd className="text-sm">Within 48 Hours</dd>
              </div>
            </dl>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">System Logs</h2>
            <div className="space-y-2 font-mono text-[10px] opacity-80">
              <p>[{new Date().toISOString()}] - Case Analyzed by GLM</p>
              <p>[{new Date().toISOString()}] - Routed to {caseData.assignedAgency}</p>
              <p>[{new Date().toISOString()}] - Official Workflow Initialized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
