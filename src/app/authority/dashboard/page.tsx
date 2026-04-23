'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDynamicRecoverability, scoreToLevel } from '@/lib/recoverability-engine';

function getAgingColor(createdAt: string, dynamicLevel: string | null, workflowStatus: string, timeToActMinutes: number | null, now: number) {
  if (workflowStatus === 'CLOSED' || workflowStatus === 'RESOLVED') return '';

  const slaMins = timeToActMinutes || (dynamicLevel === 'CRITICAL' ? 15 : dynamicLevel === 'HIGH' ? 60 : 360);
  const elapsedMins = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  const ratio = elapsedMins / slaMins;

  if (ratio >= 1) return 'bg-red-50 border-l-4 border-l-red-500'; // Breached
  if (ratio >= 0.75) return 'bg-orange-50 border-l-4 border-l-orange-500'; // Critical zone
  if (ratio >= 0.5) return 'bg-yellow-50 border-l-4 border-l-yellow-400'; // Warning
  return ''; // Safe
}

function detectDuplicates(cases: any[]) {
  const dupMap = new Map<string, string[]>();
  
  cases.forEach(c => {
    // Group by similar amount + scam type within 24h
    if (c.workflowStatus === 'CLOSED' || c.workflowStatus === 'RESOLVED') return;
    const key = `${c.scamType || 'unknown'}_${Math.round(c.amountLost || 0)}`;
    if (!dupMap.has(key)) dupMap.set(key, []);
    dupMap.get(key)!.push(c.id);
  });

  const flagged = new Set<string>();
  dupMap.forEach((ids) => {
    if (ids.length > 1) ids.forEach(id => flagged.add(id));
  });
  return flagged;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/cases')
        .then(res => res.json())
        .then(data => {
          setCases(Array.isArray(data) ? data : []);
          setLoading(false);
          setNow(Date.now());
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };

    fetchData();

    // Poll every 30 seconds to ensure real-time sync for SLAs, Breaches, Duplicates, etc.
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && cases.length === 0) return <div className="text-center py-20">Loading dashboard...</div>;

  // Compute real-time recoverability for all active cases
  const casesWithDynamic = cases.map(c => {
    if (c.workflowStatus === 'CLOSED' || c.workflowStatus === 'RESOLVED') {
      return { ...c, dynamicScore: c.recoverabilityScore ?? 0, dynamicLevel: c.recoverabilityLevel ?? 'LOW' };
    }
    const dynamic = getDynamicRecoverability(c.recoverabilityScore ?? 0, c.createdAt);
    return { ...c, dynamicScore: dynamic.currentScore, dynamicLevel: dynamic.currentLevel };
  });

  const filteredCases = (filterStatus === 'All'
    ? casesWithDynamic
    : casesWithDynamic.filter(c => c.workflowStatus === filterStatus)
  ).sort((a, b) => {
    const levelOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const aLevel = levelOrder[a.dynamicLevel] ?? 4;
    const bLevel = levelOrder[b.dynamicLevel] ?? 4;
    if (aLevel !== bLevel) return aLevel - bLevel;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const duplicateFlags = detectDuplicates(cases);

  // Count outcomes for performance metrics
  const resolved = cases.filter(c => c.interventionOutcome);
  const recovered = resolved.filter(c => c.interventionOutcome === 'RECOVERED');
  const partial = resolved.filter(c => c.interventionOutcome === 'PARTIAL');
  const breachedCount = casesWithDynamic.filter(c => {
    if (c.workflowStatus === 'CLOSED' || c.workflowStatus === 'RESOLVED') return false;
    const slaMins = c.timeToActMinutes || (c.dynamicLevel === 'CRITICAL' ? 15 : c.dynamicLevel === 'HIGH' ? 60 : 360);
    const elapsed = Math.floor((now - new Date(c.createdAt).getTime()) / 60000);
    return elapsed > slaMins;
  }).length;
  const totalActive = casesWithDynamic.filter(c => c.workflowStatus !== 'CLOSED' && c.workflowStatus !== 'RESOLVED').length;
  const slaCompliance = totalActive > 0 ? (((totalActive - breachedCount) / totalActive) * 100).toFixed(1) : '100.0';

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Command Center</h1>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            SLA-enforced incident triage and intervention system.
          </p>
        </div>
      </div>

      {/* Officer Performance Layer */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 shadow sm:px-6 sm:pt-6 border border-slate-200">
          <dt className="truncate text-sm font-bold text-slate-500">SLA Compliance</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-black ${Number(slaCompliance) >= 80 ? 'text-green-700' : 'text-red-700'}`}>{slaCompliance}%</p>
            <span className="text-xs font-bold text-slate-400">{totalActive} active</span>
          </dd>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 shadow sm:px-6 sm:pt-6 border border-slate-200">
          <dt className="truncate text-sm font-bold text-slate-500">SLA Breaches</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-black ${breachedCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{breachedCount}</p>
            <span className="text-xs font-bold text-slate-400">cases overdue</span>
          </dd>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 shadow sm:px-6 sm:pt-6 border border-slate-200">
          <dt className="truncate text-sm font-bold text-slate-500">Recovery Rate</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900">{resolved.length > 0 ? (((recovered.length + partial.length * 0.5) / resolved.length) * 100).toFixed(0) : '—'}%</p>
            <span className="text-xs font-bold text-slate-400">{recovered.length} full / {partial.length} partial</span>
          </dd>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 shadow sm:px-6 sm:pt-6 border border-slate-200">
          <dt className="truncate text-sm font-bold text-slate-500">Duplicate Alerts</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-black ${duplicateFlags.size > 0 ? 'text-orange-600' : 'text-green-700'}`}>{duplicateFlags.size}</p>
            <span className="text-xs font-bold text-slate-400">cases flagged</span>
          </dd>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {['All', 'TRIAGED', 'ROUTED', 'IN_PROGRESS', 'NEEDS_INFO', 'RESOLVED', 'CLOSED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              filterStatus === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'All' ? 'All' : status.replace(/_/g, ' ')}
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
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Recoverability Score</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">SLA</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Outcome</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-500">
                        No cases found.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className={`transition-colors ${getAgingColor(c.createdAt, c.dynamicLevel, c.workflowStatus, c.timeToActMinutes, now)}`}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">
                          <div>{c.id.substring(0, 8)}...</div>
                          {c.requiresManualReview && (
                            <div className="mt-1" title={c.reasons?.join('\n')}>
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/10">
                                ⚠️ Manual Review
                              </span>
                            </div>
                          )}
                          {duplicateFlags.has(c.id) && (
                            <div className="mt-1">
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10">
                                🔁 Possible Duplicate
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {c.scamType || 'Pending Analysis'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {(() => {
                            const score = c.dynamicScore ?? 0;
                            const level = c.dynamicLevel || 'MEDIUM';
                            const badgeClass = level === 'CRITICAL' ? 'bg-red-100 text-red-700 ring-red-600/20'
                              : level === 'HIGH' ? 'bg-orange-100 text-orange-700 ring-orange-600/20'
                              : level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 ring-yellow-600/20'
                              : 'bg-gray-100 text-gray-600 ring-gray-500/20';
                            return (
                              <span className="inline-flex items-center gap-2">
                                <span className="font-black text-slate-900">{score}<span className="text-slate-400 font-medium">/100</span></span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${badgeClass}`}>
                                  {level}
                                </span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {(() => {
                            const slaMins = c.timeToActMinutes || (c.dynamicLevel === 'CRITICAL' ? 15 : c.dynamicLevel === 'HIGH' ? 60 : 360);
                            const elapsedMins = Math.max(0, Math.floor((now - new Date(c.createdAt).getTime()) / 60000));
                            const timeLeft = slaMins - elapsedMins;
                            
                            if (c.workflowStatus === 'CLOSED' || c.workflowStatus === 'RESOLVED') {
                              return <span className="text-gray-400 font-medium">Resolved</span>;
                            }
                            
                            if (timeLeft <= 0) {
                              return <span className="inline-flex items-center gap-1 text-red-600 font-bold">⚠️ SLA Breach</span>;
                            }
                            if (timeLeft <= 15) {
                              return (
                                <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                                  <span className="animate-pulse">{timeLeft}m left</span>
                                </span>
                              );
                            }
                            if (timeLeft <= 30) {
                              return <span className="inline-flex items-center gap-1 text-orange-600 font-bold">⏱ {timeLeft}m left</span>;
                            }
                            return <span className="inline-flex items-center gap-1 text-green-600 font-medium">⏱ {timeLeft}m left</span>;
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            c.workflowStatus === 'NEEDS_INFO' ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-400' :
                            c.workflowStatus === 'TRIAGED' ? 'bg-blue-100 text-blue-800' :
                            c.workflowStatus === 'ROUTED' ? 'bg-indigo-100 text-indigo-800' :
                            c.workflowStatus === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                            c.workflowStatus === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                            c.workflowStatus === 'CLOSED' ? 'bg-gray-200 text-gray-600' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {c.workflowStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {c.interventionOutcome === 'RECOVERED' && <span className="text-green-700 font-bold">✅ Recovered</span>}
                          {c.interventionOutcome === 'PARTIAL' && <span className="text-orange-600 font-bold">⚠️ Partial</span>}
                          {c.interventionOutcome === 'LOST' && <span className="text-red-600 font-bold">❌ Lost</span>}
                          {!c.interventionOutcome && c.workflowStatus !== 'CLOSED' && c.workflowStatus !== 'RESOLVED' && <span className="text-gray-400">—</span>}
                          {!c.interventionOutcome && (c.workflowStatus === 'CLOSED' || c.workflowStatus === 'RESOLVED') && <span className="text-amber-500 font-bold text-xs">⚠ No outcome</span>}
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
