'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthorityCaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
  const [tempDocContent, setTempDocContent] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [requestMoreInfoText, setRequestMoreInfoText] = useState("");
  const [outcomeSelect, setOutcomeSelect] = useState("");
  const [activeDocTab, setActiveDocTab] = useState(0);

  const [routingSuggestions, setRoutingSuggestions] = useState<any[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const hasMinimalEvidence = () => {
    const desc = caseData?.rawDescription?.toLowerCase() || '';
    const hasAccount = desc.includes('account') || desc.includes('akaun') || /\d{10,}/.test(desc);
    const hasAmount = caseData?.amountLost > 0;
    const hasEvidence = (caseData?.evidence?.length ?? 0) > 0;
    return { hasAccount, hasAmount, hasEvidence, ready: hasAccount && hasAmount };
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (caseData && routingSuggestions.length === 0) {
      const enriched = {
        ...caseData,
        targetBank: "Maybank",
        suspectPhone: "+60123456789"
      };
      const rules = [];
      if (enriched.targetBank) rules.push({ agency: "Maybank Fraud Unit", action: "FREEZE", selected: true });
      if (enriched.suspectPhone) rules.push({ agency: "MCMC", action: "NETWORK_TAKEDOWN", selected: true });
      if (enriched.amountLost > 5000) rules.push({ agency: "PDRM CCID", action: "CRIMINAL_INVESTIGATION", selected: true });
      setRoutingSuggestions(rules);
    }
  }, [caseData]);

  const fetchCase = () => {
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
  };

  const handleUpdate = async (updates: any) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update case');
        fetchCase();
        return;
      }
      setCaseData(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred');
      fetchCase();
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const startEditDoc = (index: number) => {
    setEditingDocIndex(index);
    setTempDocContent(caseData.documents[index].content);
  };

  const saveDoc = async () => {
    const newDocs = [...caseData.documents];
    newDocs[editingDocIndex!] = { ...newDocs[editingDocIndex!], content: tempDocContent };
    await handleUpdate({ documents: newDocs });
    setEditingDocIndex(null);
  };

  if (loading) return <div className="text-center py-20 font-bold">Loading case details...</div>;
  if (!caseData) return <div className="text-center py-20 font-bold">Case not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-gray-900">
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMsg}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Case #{caseData.id.substring(0, 8)}
            <span className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-full px-3 py-1 border border-green-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Victim Online (WhatsApp)
            </span>
          </h1>
          <p className="text-sm text-gray-600">Reported on {new Date(caseData.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/authority/dashboard" className="px-4 py-2 bg-white border rounded text-sm font-bold">Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Action Panel */}
          {caseData.workflowStatus === 'ACTION_REQUIRED' && (
            <div className="bg-red-50 p-6 rounded-lg border-2 border-red-500 shadow-lg">
              <h2 className="text-xl font-black text-red-900 mb-2 flex items-center gap-2 uppercase">
                🚨 Immediate Action Required
              </h2>
              <p className="text-red-800 text-sm font-bold mb-4">
                Recovery Chance: {caseData.recoverabilityScore}% | Time Window: {caseData.timeToActMinutes} mins
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => handleUpdate({ workflowStatus: 'IN_PROGRESS', authorityNotes: 'Auto-triggered: Freeze Request Prepared, Email Generated, Escalated' })}
                  className="w-full bg-red-600 text-white font-black py-4 rounded shadow hover:bg-red-700 flex items-center justify-center gap-2 text-lg animate-pulse"
                >
                  🚨 Auto-Trigger Immediate Intervention
                </button>
                
                <div className="bg-white p-4 rounded border border-red-200">
                  <h3 className="font-bold text-red-900 mb-2 border-b border-red-100 pb-1">⚠️ What Happens If You Don't Act</h3>
                  <p className="text-sm text-slate-800">
                    If no action in <strong className="text-red-600">30 mins</strong>: 
                    Recovery chance drops from <strong className="text-green-600">{caseData.recoverabilityScore}%</strong> → <strong className="text-red-600">{(caseData.recoverabilityScore * 0.4).toFixed(0)}%</strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Funds likely moved to secondary mule chain.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">📊 Recovery Simulation</h3>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Best Case (Act Now):</span>
                    <span className="font-bold text-green-600">{(caseData.recoverabilityScore * 1.1).toFixed(0)}% chance</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium text-slate-700">Worst Case (Delayed):</span>
                    <span className="font-bold text-red-600">15% chance</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reason Codes - Explainable AI */}
          {caseData.priorityReason && Array.isArray(caseData.priorityReason) && caseData.priorityReason.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-bold mb-3 border-b pb-2">🔍 Why This Priority?</h2>
              <div className="space-y-2">
                {caseData.priorityReason.map((reason: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="text-slate-800">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Validation Gate */}
          {caseData.workflowStatus === 'ACTION_REQUIRED' && (() => {
            const ev = hasMinimalEvidence();
            return !ev.ready ? (
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <h3 className="font-bold text-amber-900 mb-2">⚠️ Evidence Incomplete — Action Blocked</h3>
                <div className="space-y-1 text-sm">
                  <p className={ev.hasAccount ? 'text-green-700' : 'text-red-700'}>{ev.hasAccount ? '✅' : '❌'} Recipient account number</p>
                  <p className={ev.hasAmount ? 'text-green-700' : 'text-red-700'}>{ev.hasAmount ? '✅' : '❌'} Transaction amount</p>
                  <p className={ev.hasEvidence ? 'text-green-700' : 'text-amber-600'}>{ev.hasEvidence ? '✅' : '⚠️'} Supporting evidence files</p>
                </div>
                <p className="text-xs text-amber-700 mt-2 font-bold">Request missing evidence from victim before triggering intervention.</p>
              </div>
            ) : null;
          })()}

          {/* AI Extracted Entities */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🧠 AI Extracted Entities
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-green-600/20">Confidence: 94%</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Target Mule Bank</p>
                <p className="text-lg font-black text-slate-900">Maybank</p>
              </div>
              <div className="bg-red-50 p-3 rounded border-2 border-red-300">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Target Account No</p>
                <p className="text-lg font-black text-red-700 tracking-wider">1128XXXXXX</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount Lost</p>
                <p className="text-lg font-black text-slate-900">RM {caseData.amountLost?.toLocaleString() || '10,000'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Time Elapsed</p>
                <p className="text-lg font-black text-slate-900">{Math.floor((Date.now() - new Date(caseData.createdAt).getTime()) / 60000)} minutes</p>
              </div>
            </div>
          </div>

          {/* Needs Info Handling */}
          {caseData.workflowStatus === 'NEEDS_INFO' && (
            <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200 shadow-sm">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                ⚠️ Action Required: Information Needed
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Internal Authority Notes</label>
                  <textarea 
                    className="w-full p-3 border rounded text-sm min-h-[100px]"
                    placeholder="Enter notes on what is still missing or findings..."
                    defaultValue={caseData.authorityNotes}
                    onBlur={(e) => handleUpdate({ authorityNotes: e.target.value })}
                  />
                </div>
                <div>
                  <button 
                    onClick={() => handleUpdate({ workflowStatus: 'ROUTED' })}
                    className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-700"
                  >
                    Mark as Resolved & Move to ROUTED
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Multi-Agency Dispatch Proposal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-indigo-200">
            <h2 className="text-xl font-bold mb-4 border-b border-indigo-100 pb-2 text-indigo-900 flex items-center gap-2">
              🤖 AI Multi-Agency Dispatch Proposal
            </h2>
            
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Routing Suggestions</h3>
              {routingSuggestions.map((sug, idx) => (
                <div key={idx} className="flex items-center p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => {
                  const newSug = [...routingSuggestions];
                  newSug[idx].selected = !newSug[idx].selected;
                  setRoutingSuggestions(newSug);
                }}>
                  <input type="checkbox" className="w-5 h-5 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" readOnly checked={sug.selected} />
                  <div>
                    <p className="font-bold text-gray-900">{sug.agency}</p>
                    <p className="text-xs text-gray-500 font-mono">Action: {sug.action}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Dynamic Escalation Payload</h3>
              <div className="bg-gray-950 p-4 rounded-md overflow-x-auto shadow-inner">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
{JSON.stringify({
  case_id: caseData.id,
  action: "MULTI_DISPATCH",
  targets: routingSuggestions.filter(s => s.selected).map(s => s.agency),
  payload: {
    bank_account: "1128XXXXXX",
    phone_to_block: "+60123456789"
  }
}, null, 2)}
                </pre>
              </div>
            </div>

            {dispatchSuccess ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 font-bold text-center">
                ✅ Payload successfully dispatched to {routingSuggestions.filter(s => s.selected).length} agencies.
              </div>
            ) : (
              <button
                onClick={() => {
                  setDispatching(true);
                  setTimeout(() => {
                    setDispatching(false);
                    setDispatchSuccess(true);
                    handleUpdate({ workflowStatus: 'AWAITING_EXTERNAL' });
                  }, 1500);
                }}
                disabled={dispatching || routingSuggestions.filter(s=>s.selected).length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full py-3 rounded-md transition-all shadow disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {dispatching ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Dispatching...
                  </>
                ) : "APPROVE & DISPATCH TO SELECTED AGENCIES"}
              </button>
            )}
          </div>

          {/* Communication with Victim (Demoted) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Communication with Victim</h2>
            
            {caseData.messages && caseData.messages.length > 0 && (
              <div className="mb-6 space-y-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded border">
                {caseData.messages.map((msg: any) => (
                  <div key={msg.id} className={`p-3 rounded-lg text-sm shadow-sm ${msg.role === 'assistant' ? 'bg-blue-50 border-blue-200 ml-8 border' : 'bg-white border-gray-200 mr-8 border'}`}>
                    <p className="font-bold text-xs mb-1 text-gray-500">
                      {msg.role === 'assistant' ? 'Authority Request' : 'Victim Reply'} • {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 mt-4 border-t pt-4">
              <label className="block text-xs font-bold text-gray-700 uppercase">Structured Info Request</label>
              <select
                className="w-full p-2 border rounded text-sm mb-2 font-bold"
                onChange={(e) => setRequestMoreInfoText(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select Evidence Request Type...</option>
                <option value="Please provide the exact Transaction ID or Receipt for the recent transfer.">Request: Transaction ID / Receipt</option>
                <option value="Please upload a screenshot of the chat where the scammer instructed you to transfer money.">Request: Chat Screenshot</option>
                <option value="Please provide the full bank account number and bank name of the recipient.">Request: Recipient Bank Details</option>
              </select>
              <textarea
                className="w-full p-3 border rounded text-sm min-h-[80px]"
                placeholder="Or type a custom request..."
                value={requestMoreInfoText}
                onChange={(e) => setRequestMoreInfoText(e.target.value)}
              />
              <button
                onClick={() => {
                  if (requestMoreInfoText.trim()) {
                    handleUpdate({ requestMoreInfo: requestMoreInfoText });
                    setRequestMoreInfoText("");
                  }
                }}
                disabled={!requestMoreInfoText.trim() || saving}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>

          {/* Victim Statement (Demoted) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Victim Statement</h2>
            <div className="p-4 bg-gray-50 rounded italic whitespace-pre-wrap border relative group">
              {caseData.rawDescription}
              <button 
                onClick={() => handleCopy(caseData.rawDescription, 'stmt')}
                className="absolute top-2 right-2 p-1 bg-white border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copyFeedback === 'stmt' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Intelligence Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-700">
            <h2 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              🧠 AI Insights
            </h2>

            {/* Recoverability Reasoning */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <h3 className="font-bold text-slate-300 text-xs uppercase mb-2">Recoverability Reasoning</h3>
              <ul className="space-y-1.5 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Transfer occurred <strong className="text-white">&lt; 60 mins</strong> ago.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>High-confidence <strong className="text-white">target bank identified</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Matches known <strong className="text-white">active loan scam cluster</strong>.</span>
                </li>
              </ul>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">⚡</span>
                <span><strong>7 similar cases</strong> in the last 24h</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">🚨</span>
                <span>Same receiving account flagged <strong>3 times</strong> today</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">🔍</span>
                <span>Pattern match: <strong>Loan scam via WhatsApp</strong> targeting elderly</span>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <h3 className="font-bold text-slate-300 text-xs uppercase mb-2">🔗 Linked Case Cluster</h3>
              <div className="bg-slate-800 p-3 rounded border border-slate-600 text-sm">
                <p className="text-slate-200">
                  This case is part of a cluster affecting <strong className="text-white">12 victims</strong>
                </p>
                <p className="text-red-400 font-bold mt-1">RM 120,000 total loss</p>
                <p className="text-xs text-slate-400 mt-2">Common vector: Same bank account</p>
                <button className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1.5 rounded transition">
                  Escalate Cluster Automatically
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Workflow Status</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                caseData.workflowStatus === 'NEEDS_INFO' ? 'bg-orange-100 text-orange-800' :
                caseData.workflowStatus === 'ROUTED' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {caseData.workflowStatus}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Agency</label>
                <select 
                  className="w-full p-2 border rounded text-sm bg-gray-50 font-bold"
                  value={caseData.assignedAgency?.split('|')[0]?.trim() || ''}
                  onChange={(e) => {
                    const secondary = caseData.assignedAgency?.split('|')[1]?.trim() || '';
                    handleUpdate({ assignedAgency: `${e.target.value}${secondary ? ` | ${secondary}` : ''}` });
                  }}
                  disabled={saving}
                >
                  <option value="" disabled>Select Primary...</option>
                  <option value="NSRC">NSRC</option>
                  <option value="PDRM CCID">PDRM CCID</option>
                  <option value="MCMC">MCMC</option>
                  <option value="Bank Negara">Bank Negara</option>
                  <option value="KPDN">KPDN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Secondary Agency (Optional)</label>
                <select 
                  className="w-full p-2 border rounded text-sm bg-gray-50"
                  value={caseData.assignedAgency?.split('|')[1]?.trim() || ''}
                  onChange={(e) => {
                    const primary = caseData.assignedAgency?.split('|')[0]?.trim() || '';
                    handleUpdate({ assignedAgency: `${primary} | ${e.target.value}` });
                  }}
                  disabled={saving || !caseData.assignedAgency?.split('|')[0]}
                >
                  <option value="">None</option>
                  <option value="NSRC">NSRC</option>
                  <option value="PDRM CCID">PDRM CCID</option>
                  <option value="MCMC">MCMC</option>
                  <option value="Bank Negara">Bank Negara</option>
                  <option value="KPDN">KPDN</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Follow-Up Tasks</h2>
            <div className="space-y-3">
              {(caseData.followUpTasks?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500">No outstanding tasks.</p>
              ) : (
                caseData.followUpTasks.map((task: any) => (
                  <div key={task.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-gray-900">{task.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                      <span>Assigned to: {task.assignedTo || 'Unassigned'}</span>
                      {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Case Timeline</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {caseData.workflowLogs?.map((log: any) => (
                <div key={log.id} className="text-sm border-l-2 border-blue-200 pl-3 py-1 relative">
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-2"></div>
                  <p className="font-bold text-gray-800">{log.eventType}</p>
                  <p className="text-gray-600 text-xs mt-1">{log.message}</p>
                  <p className="text-gray-400 text-[10px] mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {(!caseData.workflowLogs || caseData.workflowLogs.length === 0) && (
                <p className="text-xs text-gray-500 italic">No workflow events logged yet.</p>
              )}
            </div>
          </div>

          {/* Intervention Outcome Tracking */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">📋 Outcome Tracking</h2>
            {caseData.interventionOutcome ? (
              <div className="space-y-2">
                <p className="text-sm">Action: <span className="font-bold">{caseData.interventionAction || '—'}</span></p>
                <p className="text-sm">Time Taken: <span className="font-bold">{caseData.interventionTimeMins ?? '—'} mins</span></p>
                <p className="text-sm">Outcome: <span className={`font-bold ${caseData.interventionOutcome === 'RECOVERED' ? 'text-green-700' : caseData.interventionOutcome === 'PARTIAL' ? 'text-orange-600' : 'text-red-600'}`}>
                  {caseData.interventionOutcome === 'RECOVERED' ? '✅ Funds Recovered' : caseData.interventionOutcome === 'PARTIAL' ? '⚠️ Partial Recovery' : '❌ Funds Lost'}
                </span></p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Action Taken</label>
                  <select className="w-full p-2 border rounded text-sm" defaultValue="">
                    <option value="" disabled>Select action...</option>
                    <option value="FREEZE_REQUEST">Bank Freeze Request</option>
                    <option value="ESCALATION">Agency Escalation</option>
                    <option value="MULE_FLAG">Mule Account Flagged</option>
                    <option value="INVESTIGATION">Investigation Opened</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Outcome</label>
                  <select className="w-full p-2 border rounded text-sm" value={outcomeSelect} onChange={(e) => setOutcomeSelect(e.target.value)}>
                    <option value="" disabled>Select outcome...</option>
                    <option value="RECOVERED">✅ Funds Recovered</option>
                    <option value="PARTIAL">⚠️ Partial Recovery</option>
                    <option value="LOST">❌ Funds Lost</option>
                  </select>
                </div>
                <button
                  onClick={() => { if (outcomeSelect) handleUpdate({ interventionOutcome: outcomeSelect, workflowStatus: 'RESOLVED' }); }}
                  disabled={!outcomeSelect || saving}
                  className="w-full bg-slate-900 text-white py-2 rounded text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  Record Outcome & Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Console (Sticky Footer) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-500">Case ID: {caseData.id.substring(0,8)}</p>
            <p className="text-xs text-gray-400">Status: <span className="font-bold text-gray-700">{caseData.workflowStatus}</span></p>
          </div>
          <div className="flex-1 flex justify-end items-center gap-3">
            <button 
              onClick={() => handleUpdate({ workflowStatus: 'NEEDS_INFO' })}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold text-sm rounded shadow-sm hover:bg-gray-50 transition-colors"
            >
              REQUEST MORE EVIDENCE
            </button>
            <button 
              onClick={() => handleUpdate({ assignedAgency: 'PDRM CCID', workflowStatus: 'ROUTED' })}
              className="px-6 py-3 bg-orange-500 text-white font-bold text-sm rounded shadow hover:bg-orange-600 transition-colors"
            >
              ESCALATE TO PDRM
            </button>
            <button 
              onClick={() => handleUpdate({ workflowStatus: 'IN_PROGRESS', authorityNotes: 'Initiated Bank Freeze' })}
              className="px-8 py-3 bg-red-600 text-white font-black text-sm rounded shadow-md hover:bg-red-700 transition-colors"
            >
              INITIATE BANK FREEZE
            </button>
          </div>
        </div>
      </div>
      <div className="h-16"></div> {/* Spacer for sticky footer */}
    </div>
  );
}
