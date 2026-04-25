'use client';

import { useMemo, useState } from 'react';
import { Check, Phone, X } from 'lucide-react';
import { generateActionPlan } from '@/lib/action-plan-generator';

export default function CaseInteractions({ caseRecord }: { caseRecord: any }) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [reopenReason, setReopenReason] = useState('');
  const [isRequestingReopen, setIsRequestingReopen] = useState(false);
  const [reopenSubmitted, setReopenSubmitted] = useState(false);

  const isReadOnly =
    caseRecord.workflowStatus === 'RESOLVED' ||
    caseRecord.workflowStatus === 'CLOSED';

  const resolvedAt = caseRecord.resolvedAt
    ? new Date(caseRecord.resolvedAt)
    : caseRecord.updatedAt
      ? new Date(caseRecord.updatedAt)
      : null;

  const reopenDeadline = resolvedAt
    ? new Date(resolvedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;

  const canRequestReopen =
    caseRecord.workflowStatus === 'RESOLVED' &&
    reopenDeadline !== null &&
    new Date() <= reopenDeadline;

  const dynamicSteps = useMemo(() => {
    const description = `${caseRecord.summary || ''} ${caseRecord.rawDescription || ''}`;

    return generateActionPlan(description).map((step, index) => ({
      id: step.title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      title: `${index + 1}. ${step.title}`,
      desc: step.description,
      priority:
        step.priority === 'HIGH'
          ? 'IMMEDIATE'
          : step.priority === 'MEDIUM'
            ? 'URGENT'
            : 'STANDARD',
      priorityColor:
        step.priority === 'HIGH'
          ? 'bg-red-100 text-red-700'
          : step.priority === 'MEDIUM'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-slate-100 text-slate-800',
    }));
  }, [caseRecord.summary, caseRecord.rawDescription]);

  const toggleStep = (id: string) => {
    if (isReadOnly) return;

    setCheckedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmitReopenRequest = async () => {
    if (!reopenReason.trim()) return;

    setIsRequestingReopen(true);

    try {
      const res = await fetch(`/api/cases/${caseRecord.id}/reopen-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reopenReason }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit reopen request');
      }

      setReopenSubmitted(true);
      setReopenReason('');
    } catch {
      alert('Failed to submit reopen request');
    } finally {
      setIsRequestingReopen(false);
    }
  };

  const { bankNumber } = useMemo(() => {
    const text = `${caseRecord.summary || ''} ${caseRecord.rawDescription || ''}`.toLowerCase();

    if (text.includes('maybank')) return { bankNumber: '1-300-88-6688' };
    if (text.includes('cimb')) return { bankNumber: '1300-880-900' };
    if (text.includes('public bank') || text.includes('pbb')) {
      return { bankNumber: '1-800-22-5555' };
    }
    if (text.includes('rhb')) return { bankNumber: '1-800-88-9878' };
    if (text.includes('hong leong') || text.includes('hlb')) {
      return { bankNumber: '1-300-88-1234' };
    }

    return { bankNumber: '997' };
  }, [caseRecord.summary, caseRecord.rawDescription]);

  return (
    <div className="space-y-8">
      {isReadOnly && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">
            {caseRecord.workflowStatus === 'RESOLVED'
              ? 'This case has been resolved'
              : 'This case has been closed'}
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            This case is now read-only. You can review everything, but cannot perform actions.
          </p>

          {caseRecord.workflowStatus === 'RESOLVED' && reopenDeadline && (
            <p className="mt-2 text-xs text-slate-500">
              Reopen request window ends on {`${String(reopenDeadline.getDate()).padStart(2, '0')}/${String(
  reopenDeadline.getMonth() + 1
).padStart(2, '0')}/${reopenDeadline.getFullYear()}`}
            </p>
          )}
        </div>
      )}

      {canRequestReopen && (
        <div className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">
            Request to Reopen Case
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            This case was resolved recently. You may request to reopen it within 3 days
            if you have new evidence or disagree with the resolution.
          </p>

          {reopenSubmitted ? (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
              Reopen request submitted successfully. The authority will review your request.
            </div>
          ) : (
            <>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={4}
               className="mt-4 w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-blue-500"
                placeholder="Explain why you want to reopen this case..."
              />

              <button
                type="button"
                onClick={handleSubmitReopenRequest}
                disabled={!reopenReason.trim() || isRequestingReopen}
                className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRequestingReopen ? 'Submitting...' : 'Submit Reopen Request'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-slate-900">Your Action Plan</h3>
          <p className="mt-1 text-sm text-slate-500">
            These steps are selected based on the details found in your report.
          </p>
        </div>

        <ul className="divide-y divide-slate-200">
          {dynamicSteps.map((step) => (
            <li
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`px-4 py-4 sm:px-6 transition ${
                isReadOnly
                  ? 'cursor-not-allowed bg-slate-50 opacity-70'
                  : 'cursor-pointer hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 border rounded flex items-center justify-center ${
                      isReadOnly
                        ? 'bg-red-100 border-red-300'
                        : checkedSteps[step.id]
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300'
                    }`}
                  >
                    {isReadOnly ? (
                      <X className="w-3.5 h-3.5 text-red-500" />
                    ) : checkedSteps[step.id] ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : null}
                  </div>

                  <p
                    className={`text-sm font-medium ${
                      checkedSteps[step.id]
                        ? 'line-through text-slate-500'
                        : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>

                <span className={`text-xs px-2 py-1 rounded ${step.priorityColor}`}>
                  {step.priority}
                </span>
              </div>

              <div className="pl-8 mt-1">
                <p className="text-sm text-slate-500">{step.desc}</p>

                {isReadOnly && (
                  <span className="text-xs text-red-500 font-medium">Locked</span>
                )}

                {!isReadOnly && step.id.includes('bank') && (
                  <a
                    href={`tel:${bankNumber}`}
                    className="inline-flex items-center mt-2 text-xs bg-teal-500 text-white px-3 py-1.5 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Call Now
                  </a>
                )}

                {!isReadOnly && step.id.includes('nsrc') && (
                  <a
                    href="tel:997"
                    className="inline-flex items-center mt-2 text-xs bg-teal-500 text-white px-3 py-1.5 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Call 997
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}