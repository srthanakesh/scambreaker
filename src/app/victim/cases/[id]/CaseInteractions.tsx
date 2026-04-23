'use client';

import { useState, useEffect, useMemo } from 'react';
import { updateTaskStatus, submitMissingInfo } from '@/app/actions/victim';
import { Check, Phone } from 'lucide-react';

function formatDateSafe(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${h}:${m}`;
}

const ACTION_STEPS = [
  { id: 'bank', title: "1. Call Your Bank's Fraud Hotline", priority: 'IMMEDIATE', priorityColor: 'bg-red-100 text-red-700', desc: "Call your bank's fraud hotline immediately to freeze your account." },
  { id: 'nsrc', title: "2. Call NSRC (997)", priority: 'IMMEDIATE', priorityColor: 'bg-red-100 text-red-700', desc: "Report to the National Scam Response Centre. They can coordinate with multiple banks." },
  { id: 'evidence', title: "3. Preserve All Evidence", priority: 'URGENT', priorityColor: 'bg-orange-100 text-orange-700', desc: "Screenshot every message, transaction receipt, and the scammer's profile before they disappear." },
  { id: 'police', title: "4. File Police Report", priority: 'WITHIN 24 HOURS', priorityColor: 'bg-slate-100 text-slate-800', desc: "Bring your IC, bank statements, and screenshots to the nearest police station." }
];

export default function CaseInteractions({ caseRecord }: { caseRecord: any }) {
  const [missingInfoText, setMissingInfoText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // Load saved completed steps from DB
  useEffect(() => {
    fetch(`/api/cases/${caseRecord.id}/steps`)
      .then(res => res.json())
      .then(data => {
        if (data.completedSteps) setCheckedSteps(data.completedSteps);
      })
      .catch(() => {});
  }, [caseRecord.id]);

  const toggleStep = (id: string) => {
    const updated = { ...checkedSteps, [id]: !checkedSteps[id] };
    setCheckedSteps(updated);
    // Persist to DB
    fetch(`/api/cases/${caseRecord.id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedSteps: updated }),
    }).catch(() => {});
  };

  const { bankNumber, isNsrcOnly } = useMemo(() => {
    const text = ((caseRecord.summary || '') + ' ' + (caseRecord.rawDescription || '')).toLowerCase();
    if (text.includes('maybank')) return { bankNumber: '1-300-88-6688', isNsrcOnly: false };
    if (text.includes('cimb')) return { bankNumber: '1300-880-900', isNsrcOnly: false };
    if (text.includes('public bank') || text.includes('pbb')) return { bankNumber: '1-800-22-5555', isNsrcOnly: false };
    if (text.includes('rhb')) return { bankNumber: '1-800-88-9878', isNsrcOnly: false };
    if (text.includes('hong leong') || text.includes('hlb')) return { bankNumber: '1-300-88-1234', isNsrcOnly: false };
    return { bankNumber: '997', isNsrcOnly: true };
  }, [caseRecord.summary, caseRecord.rawDescription]);

  // Dynamic suggested next step based on remaining steps
  const remainingSteps = useMemo(() => ACTION_STEPS.filter(s => !checkedSteps[s.id]), [checkedSteps]);
  const dynamicNextStep = useMemo(() => {
    if (remainingSteps.length === 0) return 'All action steps completed. Await authority follow-up.';
    return remainingSteps[0].desc;
  }, [remainingSteps]);
  const dynamicRouting = useMemo(() => {
    if (remainingSteps.length === 0) return 'All steps completed — case is fully submitted.';
    return remainingSteps.map((s, i) => `${i + 1}. ${s.title.replace(/^\d+\.\s*/, '')}`).join(' → ');
  }, [remainingSteps]);

  const missingInfoItems = Array.isArray(caseRecord.missingInfo)
    ? caseRecord.missingInfo
    : typeof caseRecord.missingInfo === 'string' && caseRecord.missingInfo.trim()
      ? [caseRecord.missingInfo]
      : [];

  const assistantMessages = Array.isArray(caseRecord.messages)
    ? caseRecord.messages.filter((msg: any) => msg.role === 'assistant')
    : [];

  const userMessages = Array.isArray(caseRecord.messages)
    ? caseRecord.messages.filter((msg: any) => msg.role === 'user')
    : [];

  const handleCompleteTask = async (taskId: string) => {
    setUpdatingTask(taskId);
    try {
      await updateTaskStatus(taskId, 'COMPLETED');
    } catch {
      alert('Failed to update task');
    } finally {
      setUpdatingTask(null);
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleSubmitInfo = async () => {
    if (!missingInfoText.trim() && !selectedFile) return;

    setIsSubmitting(true);
    try {
      if (missingInfoText.trim()) {
        await submitMissingInfo(caseRecord.id, missingInfoText);
      }

      if (selectedFile) {
        const fileUrl = await fileToBase64(selectedFile);
        const res = await fetch(`/api/cases/${caseRecord.id}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl }),
        });
        if (!res.ok) {
          throw new Error('Failed to upload evidence');
        }
      }

      setMissingInfoText('');
      setSelectedFile(null);
      setSubmitted(true);
    } catch {
      alert('Failed to submit information');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Your Action Plan</h3>
          <p className="mt-1 text-sm text-slate-500">
            Please complete these steps immediately to help with the investigation.
          </p>
        </div>
        <div className="border-t border-slate-200">
          <ul className="divide-y divide-slate-200">
            {ACTION_STEPS.map(step => (
              <li 
                key={step.id} 
                className={`px-4 py-4 sm:px-6 cursor-pointer transition-colors hover:bg-slate-50 ${checkedSteps[step.id] ? 'bg-slate-50/50' : ''}`}
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 flex-shrink-0 border rounded flex items-center justify-center transition-colors ${checkedSteps[step.id] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                      {checkedSteps[step.id] && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className={`text-sm font-medium ${checkedSteps[step.id] ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{step.title}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${step.priorityColor} ${checkedSteps[step.id] ? 'opacity-50' : ''}`}>
                    {step.priority}
                  </span>
                </div>
                <div className="mt-1 pl-8">
                  <p className={`text-sm ${checkedSteps[step.id] ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                  
                  {!checkedSteps[step.id] && (
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
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dynamic Suggested Next Step & Routing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">Suggested Next Step</p>
          <p className="mt-1 text-sm text-yellow-900">{dynamicNextStep}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200">
          <p className="text-sm font-medium text-indigo-800">Suggested Routing</p>
          <p className="mt-1 text-sm text-indigo-900">{dynamicRouting}</p>
        </div>
      </div>

      {(caseRecord.workflowStatus === 'NEEDS_INFO' || caseRecord.messages.length > 0) && (
        <div className="bg-white shadow sm:rounded-lg border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-orange-900">
              Information Request
            </h3>
            <p className="mt-1 text-sm text-orange-700">
              The authority requires more details to proceed with your case.
            </p>

            {missingInfoItems.length > 0 && (
              <div className="mt-4 rounded-md border border-orange-200 bg-white/70 p-4">
                <h4 className="text-sm font-semibold text-orange-900">
                  Missing information requested
                </h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-orange-900 space-y-1">
                  {missingInfoItems.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-5 sm:px-6 space-y-6">
            {assistantMessages.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-900 border-b pb-2">
                  Requests from Authority
                </h4>

                {assistantMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className="bg-blue-50 p-3 rounded-md text-sm text-blue-900 border border-blue-200"
                  >
                    <div className="font-semibold mb-1 text-xs text-blue-700">
                      Authority • {formatDateSafe(msg.createdAt)}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            {userMessages.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-900 border-b pb-2">
                  Your Previous Replies
                </h4>

                {userMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 border border-slate-200"
                  >
                    <div className="font-semibold mb-1 text-xs text-slate-500">
                      You • {formatDateSafe(msg.createdAt)}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800 font-medium">
                  Information submitted successfully. The authority will review your response.
                </div>
              ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="missingInfo"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Provide Additional Details
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    You can paste the missing information below and optionally upload
                    a supporting file.
                  </p>
                  <textarea
                    id="missingInfo"
                    rows={4}
                    value={missingInfoText}
                    onChange={(e) => setMissingInfoText(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm p-3 transition"
                    placeholder="Enter the missing information requested by the authority..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="evidenceFile"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Upload Supporting Evidence
                  </label>
                  <input
                    id="evidenceFile"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-slate-500">
                      Selected file: {selectedFile.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmitInfo}
                  disabled={isSubmitting || (!missingInfoText.trim() && !selectedFile)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Information'}
                </button>
              </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}