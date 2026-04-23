'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Phone } from 'lucide-react';

const ACTION_STEPS = [
  { id: 'bank', num: 1, title: "Call Your Bank's Fraud Hotline", priority: 'Immediate', desc: "Call your bank's fraud hotline immediately to freeze your account.", bg: 'red' },
  { id: 'nsrc', num: 2, title: "Call NSRC (997)", priority: 'Immediate', desc: "Report to the National Scam Response Centre. They can coordinate with multiple banks.", bg: 'red' },
  { id: 'evidence', num: 3, title: "Preserve All Evidence", priority: 'Urgent', desc: "Screenshot every message, transaction receipt, and the scammer's profile before they disappear.", bg: 'orange' },
  { id: 'police', num: 4, title: "File Police Report", priority: 'Within 24 Hours', desc: "Bring your IC, bank statements, and screenshots to the nearest police station.", bg: 'slate' },
];

export default function SuccessPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});



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

  const toggleStep = (stepId: string) => {
    const updated = { ...checkedSteps, [stepId]: !checkedSteps[stepId] };
    setCheckedSteps(updated);
    // Persist to DB
    fetch(`/api/cases/${id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedSteps: updated }),
    }).catch(() => {});
  };

  const { bankNumber } = useMemo(() => {
    if (!caseData) return { bankNumber: '997' };
    const text = ((caseData.summary || '') + ' ' + (caseData.rawDescription || '')).toLowerCase();
    if (text.includes('maybank')) return { bankNumber: '1-300-88-6688' };
    if (text.includes('cimb')) return { bankNumber: '1300-880-900' };
    if (text.includes('public bank') || text.includes('pbb')) return { bankNumber: '1-800-22-5555' };
    if (text.includes('rhb')) return { bankNumber: '1-800-88-9878' };
    if (text.includes('hong leong') || text.includes('hlb')) return { bankNumber: '1-300-88-1234' };
    return { bankNumber: '997' };
  }, [caseData]);

  if (loading) return <div className="text-center py-20">Loading analysis...</div>;
  if (!caseData) return <div className="text-center py-20">Case not found.</div>;

  const colorMap: Record<string, { bg: string; border: string; num: string; title: string; text: string; tag: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-100', num: 'border-red-400 text-red-600', title: 'text-red-900', text: 'text-red-800', tag: 'bg-red-100 text-red-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', num: 'border-orange-400 text-orange-600', title: 'text-orange-900', text: 'text-orange-800', tag: 'bg-orange-100 text-orange-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', num: 'border-slate-400 text-slate-600', title: 'text-slate-900', text: 'text-slate-700', tag: 'bg-slate-200 text-slate-700' },
  };

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

          {/* Interactive Action Plan */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Action Plan</h4>
            <div className="space-y-3">
              {ACTION_STEPS.map((step) => {
                const isDone = checkedSteps[step.id];
                const colors = colorMap[step.bg];
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`flex items-start p-4 rounded-md border cursor-pointer transition-all duration-200 ${
                      isDone 
                        ? 'bg-slate-50/60 border-slate-200 opacity-70' 
                        : `${colors.bg} ${colors.border}`
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isDone 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : `bg-white ${colors.num}`
                      }`}>
                        {isDone ? <Check className="w-3 h-3 stroke-[3px]" /> : step.num}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-bold ${isDone ? 'text-slate-400 line-through' : colors.title}`}>
                        {step.title}{' '}
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                          isDone ? 'bg-slate-100 text-slate-400' : colors.tag
                        }`}>
                          {step.priority}
                        </span>
                      </p>
                      <p className={`text-sm mt-1 ${isDone ? 'text-slate-400' : colors.text}`}>
                        {step.desc}
                      </p>
                      
                      {!isDone && (
                        <div className="mt-3">
                          {step.id === 'bank' && (
                            <a 
                              href={`tel:${bankNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              Call Now
                            </a>
                          )}
                          {step.id === 'nsrc' && (
                            <a 
                              href="tel:997"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              Call 997
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Document Drafts */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Generated Document Drafts</h4>
            <div className="grid grid-cols-1 gap-6">
              {caseData.documents?.filter((doc: any) => doc.type === 'bank_dispute_draft' || doc.type === 'police_report_draft').map((doc: any, i: number) => (
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
          <Link href="/victim/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            &rarr; Go to Dashboard
          </Link>
          <div className="space-x-4">
            <span className="text-xs text-gray-500 italic">Workflow: {caseData.workflowStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
