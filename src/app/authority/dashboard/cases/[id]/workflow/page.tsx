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
        <Link href={`/authority/dashboard/cases/${id}`} className="text-blue-600 font-bold">&larr; Back to Case</Link>
        <h1 className="text-2xl font-bold">Official Workflow: {caseData.assignedAgency}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Agency Checklist</h2>
            <div className="space-y-3">
              {(caseData.followUpTasks?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500">No workflow tasks available.</p>
              ) : (
                caseData.followUpTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.description}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Next Required Step</h2>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded">
              <p className="text-sm font-bold text-blue-900">{caseData.workflowStatus}</p>
              <p className="text-xs text-blue-800 mt-1">
                {caseData.summary || 'No case summary available.'}
              </p>
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
                <dd className="text-sm font-bold">
                  {caseData.assignedAgency ? `Pending ${caseData.assignedAgency} Agent` : 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Priority Level</dt>
                <dd className={`text-sm font-bold ${
                  caseData.priority === 'HIGH' || caseData.priority === 'CRITICAL' ? 'text-red-600' : 'text-blue-600'
                }`}>{caseData.priority}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">Target Resolution</dt>
                <dd className="text-sm">
                  {caseData.priority === 'CRITICAL' ? 'Immediate' : caseData.priority === 'HIGH' ? 'Within 24 Hours' : 'Within 7 Days'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">System Logs</h2>
            <div className="space-y-2 font-mono text-[10px] opacity-80">
              {(caseData.workflowLogs?.length ?? 0) === 0 ? (
                <p>No workflow logs available.</p>
              ) : (
                caseData.workflowLogs.slice(0, 10).map((log: any) => (
                  <p key={log.id}>
                    [{new Date(log.createdAt).toISOString()}] - {log.eventType}: {log.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
