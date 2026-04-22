'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  const filteredCases = filterStatus === 'All' 
    ? cases 
    : cases.filter(c => c.workflowStatus === filterStatus);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Authority Case Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all reported scam cases across Malaysia analyzed by GLM.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['All', 'NEEDS_INFO', 'ROUTED', 'FOLLOW_UP_PENDING', 'CLOSED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              filterStatus === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      
      <div className="mt-6 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Case ID</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Type</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Agency</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Urgency</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Created At</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-500">
                        No cases found.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">
                          <div>{c.id.substring(0, 8)}...</div>
                          {c.requiresManualReview && (
                            <div className="mt-1" title={c.reasons?.join('\n')}>
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/10">
                                ⚠️ Manual Review
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {c.scamType || 'Pending Analysis'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {c.assignedAgency || 'Unassigned'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            c.urgency === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            c.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            c.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {c.urgency}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {c.workflowStatus}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/authority/dashboard/cases/${c.id}`} className="text-blue-600 hover:text-blue-900 font-bold">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
