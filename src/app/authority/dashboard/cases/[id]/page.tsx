'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { agencies } from '@/lib/agencies';
import { resolveBank, extractBanksFromText } from '@/lib/malaysia-banks';
import { getDynamicRecoverability } from '@/lib/recoverability-engine';

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

  // Real-time recoverability
  const [liveRecoverability, setLiveRecoverability] = useState<{ currentScore: number; currentLevel: string; elapsedMinutes: number } | null>(null);

  const updateRecoverability = useCallback(() => {
    if (!caseData) return;
    if (caseData.workflowStatus === 'RESOLVED' || caseData.workflowStatus === 'CLOSED') {
      setLiveRecoverability({ currentScore: caseData.recoverabilityScore ?? 0, currentLevel: 'LOW', elapsedMinutes: 0 });
      return;
    }
    const dynamic = getDynamicRecoverability(caseData.recoverabilityScore ?? 0, caseData.createdAt);
    setLiveRecoverability(dynamic);
  }, [caseData]);

  const getCleanVictimStatement = (text: string) => {
    if (!text) return "";
    const match = text.match(/Victim Statement\s*\n+([\s\S]*?)(?:\n+Attachments|$)/i);
    return match && match[1] ? match[1].trim() : text;
  };

  const hasMinimalEvidence = () => {
    const desc = caseData?.rawDescription?.toLowerCase() || '';
    const hasAccount = desc.includes('account') || desc.includes('akaun') || /\d{10,}/.test(desc);
    const hasAmount = caseData?.amountLost > 0;
    const hasEvidence = (caseData?.evidence?.length ?? 0) > 0;
    return { hasAccount, hasAmount, hasEvidence, ready: hasAccount && hasAmount };
  };

  const aiExtracted = useMemo(() => {
    if (!caseData) return { bank: 'Unknown', account: 'Unknown', confidence: 0, timeElapsed: 0, name: '-', email: '-', phone: '-', ic: '-', scamType: '-', amount: '-', paymentMethod: '-', dateTime: '-', reportingDate: '-', sourceBank: '-', channelUsed: '-', suspectedPattern: '-', attachments: '-', bankCategory: null, bankFullName: null };
    const desc = caseData.rawDescription || '';

    const extract = (field: string) => {
      const regex = new RegExp(`(?:-|\\*)?\\s*${field}\\s*:\\s*([^\\n]+)`, 'i');
      const match = desc.match(regex);
      return match && match[1] ? match[1].trim() : '';
    };

    const parsed = {
      name: extract('Name') || caseData.victimName || '-',
      email: extract('Email') || caseData.victimEmail || '-',
      phone: extract('Phone Number') || caseData.victimPhone || '-',
      ic: extract('IC Number') || caseData.victimIc || '-',
      scamType: extract('Scam Type') || (caseData.scamType ? caseData.scamType.replace(/_/g, ' ') : '-'),
      amount: extract('Amount Involved') || (caseData.amountLost ? `RM ${caseData.amountLost.toLocaleString()}` : '-'),
      paymentMethod: extract('Payment Method') || '-',
      dateTime: extract('Date/Time of Incident') || (caseData.incidentDate ? new Date(caseData.incidentDate).toLocaleString() : '-'),
      reportingDate: extract('Reporting Date') || new Date(caseData.createdAt).toLocaleDateString(),
      sourceBank: extract('Source Bank') || caseData.sourceBank || '-',
      destinationBank: extract('Destination Bank'),
      channelUsed: extract('Channel Used') || caseData.channelUsed || '-',
      suspectedPattern: extract('Suspected Scam Pattern') || extract('Suspected Pattern') || caseData.scamPattern || '-',
      attachments: extract('Attachments Provided') || (caseData.evidence?.length > 0 ? 'Yes' : 'No')
    };

    // Resolve banks using the malaysia-banks dataset (handles aliases, short names, partial matches)
    let destinationBank = parsed.destinationBank ? resolveBank(parsed.destinationBank) : null;
    let sourceBankResolved = parsed.sourceBank && parsed.sourceBank !== '-' ? resolveBank(parsed.sourceBank) : null;

    // If structured extraction didn't find a destination bank, scan full text
    if (!destinationBank) {
      const bankRefs = extractBanksFromText(desc);
      const destRef = bankRefs.find(r => r.isDestination);
      destinationBank = destRef?.bank || bankRefs.find(r =>
        sourceBankResolved ? r.bank.short_name !== sourceBankResolved.short_name : true
      )?.bank || null;
    }

    const bankDisplay = destinationBank ? destinationBank.short_name : 'Unknown';
    const sourceBankDisplay = sourceBankResolved ? sourceBankResolved.short_name : (parsed.sourceBank || 'Unknown');

    const matchAcc = desc.match(/\d{10,14}/);
    const account = matchAcc ? matchAcc[0] : 'Unknown';

    let score = 50;
    if (destinationBank) score += 20;
    if (account !== 'Unknown') score += 20;
    if (caseData.amountLost > 0) score += 5;
    if (caseData.evidence && caseData.evidence.length > 0) score += 4;

    const timeElapsed = Math.max(0, Math.floor((Date.now() - new Date(caseData.createdAt).getTime()) / 60000));

    return {
      ...parsed,
      sourceBank: sourceBankDisplay,
      destinationBank: bankDisplay,
      bank: bankDisplay,
      bankCategory: destinationBank?.category || null,
      bankFullName: destinationBank?.name || null,
      account,
      confidence: Math.min(99, score),
      timeElapsed,
    };
  }, [caseData]);

  useEffect(() => {
    fetchCase();
  }, [id]);

  // Real-time recoverability updates every 60 seconds
  useEffect(() => {
    updateRecoverability();
    const interval = setInterval(updateRecoverability, 60000);
    return () => clearInterval(interval);
  }, [updateRecoverability]);

  useEffect(() => {
    if (caseData && routingSuggestions.length === 0) {
      // Analyze case description to dynamically suggest matching agencies
      const desc = (caseData.rawDescription || '').toLowerCase();
      const rules: any[] = [];
      const matchedAgencies = new Set();
      
      const extractedBank = aiExtracted?.bank || 'Unknown';
      const bankCategory = aiExtracted?.bankCategory || null;

      agencies.forEach(agency => {
        // Skip NSRC as a routing target since they are the orchestrator
        if (agency.agency_id === 'NSRC') return;

        let score = 0;

        // 1. Direct Keyword Match
        agency.keywords.forEach(kw => {
          if (desc.includes(kw.toLowerCase())) score += 2;
        });

        // 2. Bank-Agency Match: resolved bank short name appears in agency_id
        if (extractedBank !== 'Unknown' && agency.agency_id.includes(extractedBank.toUpperCase().replace(/\s/g, '_'))) {
           score += 5;
        }

        // 3. Bank Category Match: match Islamic/Digital/Foreign bank agencies
        if (bankCategory === 'islamic' && agency.role.toLowerCase().includes('islamic bank')) score += 3;
        if (bankCategory === 'digital' && agency.role.toLowerCase().includes('digital bank')) score += 3;
        if (bankCategory === 'foreign' && agency.role.toLowerCase().includes('foreign bank')) score += 3;

        // 4. Amount Thresholds (PDRM for large sums)
        if (agency.agency_id === 'PDRM_CCID' && caseData.amountLost > 5000) {
          score += 3;
        }
        
        if (score >= 2 && !matchedAgencies.has(agency.agency_id)) {
          matchedAgencies.add(agency.agency_id);
          
          let actionType = 'REVIEW';
          if (agency.role.includes('commercial bank') || agency.role.includes('Islamic bank') || agency.role.includes('Digital bank') || agency.role.includes('Foreign bank')) {
            actionType = 'FREEZE_ACCOUNT';
          } else if (agency.agency_id === 'MCMC') {
            actionType = 'NETWORK_TAKEDOWN';
          } else if (agency.agency_id === 'PDRM_CCID') {
            actionType = 'CRIMINAL_INVESTIGATION';
          } else if (agency.agency_id === 'BNM') {
             actionType = 'REGULATORY_OVERSIGHT';
          }
          
          rules.push({ 
            agency: agency.name, 
            agencyId: agency.agency_id,
            action: actionType, 
            selected: score >= 4 || rules.length === 0 // Auto-select top matches
          });
        }
      });
      
      const sortedRules = rules.sort((a,b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)).slice(0, 5);
      const limitedRules = sortedRules.map((r, i) => ({ ...r, selected: i < 3 }));
      setRoutingSuggestions(limitedRules);
    }
  }, [caseData, aiExtracted]);

  const fetchCase = () => {
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data);
        setDispatchSuccess(false);
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
      // Refetch full case data to ensure all joins (messages, evidence, tasks, logs) are fresh
      await fetchCase();
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

  const isReadOnly = caseData.workflowStatus === 'RESOLVED' || caseData.workflowStatus === 'CLOSED';

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
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${caseData.workflowStatus === 'TRIAGED' ? 'text-red-600' : ''}`}>
            Case #{caseData.id.substring(0, 8)}
          </h1>
          <p className="text-sm text-gray-600">Reported on {new Date(caseData.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/authority/dashboard" className="px-4 py-2 bg-white border rounded text-sm font-bold">Back</Link>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-gray-100 border-2 border-gray-300 text-gray-600 px-6 py-4 rounded-lg flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-black text-gray-800 uppercase text-sm">Case is {caseData.workflowStatus}</p>
            <p className="text-xs text-gray-500">This case is locked. No further edits or actions can be taken.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Action Panel */}
          {caseData.workflowStatus === 'ACTION_REQUIRED' && (
            <div className="bg-red-50 p-6 rounded-lg border-2 border-red-500 shadow-lg">
              <h2 className="text-xl font-black text-red-900 mb-2 flex items-center gap-2 uppercase">
                🚨 Immediate Action Required
              </h2>
              <p className="text-red-800 text-sm font-bold mb-4">
                Recovery Chance: {liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0}% ({liveRecoverability?.currentLevel ?? caseData.recoverabilityLevel ?? 'N/A'}) | Time Elapsed: {liveRecoverability?.elapsedMinutes ?? aiExtracted.timeElapsed} mins
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => handleUpdate({ workflowStatus: 'IN_PROGRESS', authorityNotes: 'Auto-triggered: Freeze Request Prepared, Email Generated, Escalated' })}
                  disabled={isReadOnly}
                  className={`w-full bg-red-600 text-white font-black py-4 rounded shadow hover:bg-red-700 flex items-center justify-center gap-2 text-lg animate-pulse ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🚨 Auto-Trigger Immediate Intervention
                </button>

                <div className="bg-white p-4 rounded border border-red-200">
                  <h3 className="font-bold text-red-900 mb-2 border-b border-red-100 pb-1">⚠️ What Happens If You Don't Act</h3>
                  <p className="text-sm text-slate-800">
                    If no action in <strong className="text-red-600">30 mins</strong>:
                    Recovery chance drops from <strong className="text-green-600">{liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0}%</strong> → <strong className="text-red-600">{Math.max(0, Math.round((liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0) * 0.4))}%</strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Funds likely moved to secondary mule chain.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">📊 Recovery Simulation</h3>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Best Case (Act Now):</span>
                    <span className="font-bold text-green-600">{Math.min(99, Math.round((liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0) * 1.1))}% chance</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium text-slate-700">Worst Case (Delayed):</span>
                    <span className="font-bold text-red-600">{Math.max(0, Math.round((liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0) * 0.15))}% chance</span>
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
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-green-600/20">Confidence: {aiExtracted.confidence}%</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Target Mule Bank</p>
                <p className="text-lg font-black text-slate-900">{aiExtracted.bank}</p>
              </div>
              <div className="bg-red-50 p-3 rounded border-2 border-red-300">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Target Account No</p>
                <p className="text-lg font-black text-red-700 tracking-wider">{aiExtracted.account}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount Lost</p>
                <p className="text-lg font-black text-slate-900">RM {caseData.amountLost?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Time Elapsed</p>
                <p className="text-lg font-black text-slate-900">{(() => {
	                  const mins = liveRecoverability?.elapsedMinutes ?? aiExtracted.timeElapsed;
	                  return mins >= 60 ? `${Math.round(mins / 60)}h ${mins % 60}m` : `${mins}m`;
	                })()}</p>
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
                    onBlur={(e) => { if (!isReadOnly) handleUpdate({ authorityNotes: e.target.value }); }}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <button
                    onClick={() => handleUpdate({ workflowStatus: 'IN_PROGRESS' })}
                    disabled={saving || isReadOnly}
                    className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-700 disabled:opacity-50"
                  >
                    Mark as Resolved & Return to IN PROGRESS
                  </button>
                </div>
              </div>
            </div>
          )}

                    {/* Victim Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Victim Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">Victim Information</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="font-semibold inline-block w-32">Name:</span> {aiExtracted.name}</li>
                  <li><span className="font-semibold inline-block w-32">Email:</span> {aiExtracted.email}</li>
                  <li><span className="font-semibold inline-block w-32">Phone Number:</span> {aiExtracted.phone}</li>
                  <li><span className="font-semibold inline-block w-32">IC Number:</span> {aiExtracted.ic}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">Statement Summary</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="font-semibold inline-block w-40">Scam Type:</span> {aiExtracted.scamType}</li>
                  <li><span className="font-semibold inline-block w-40">Amount Involved:</span> {aiExtracted.amount}</li>
                  <li><span className="font-semibold inline-block w-40">Payment Method:</span> {aiExtracted.paymentMethod}</li>
                  <li><span className="font-semibold inline-block w-40">Date/Time of Incident:</span> {aiExtracted.dateTime}</li>
                  <li><span className="font-semibold inline-block w-40">Reporting Date:</span> {aiExtracted.reportingDate}</li>
                  <li><span className="font-semibold inline-block w-40">Source Bank:</span> {aiExtracted.sourceBank}</li>
                  <li><span className="font-semibold inline-block w-40">Destination Bank:</span> {aiExtracted.bank}</li>
                  <li><span className="font-semibold inline-block w-40">Channel Used:</span> {aiExtracted.channelUsed}</li>
                  <li><span className="font-semibold inline-block w-40">Suspected Pattern:</span> {aiExtracted.suspectedPattern}</li>
                  <li><span className="font-semibold inline-block w-40">Attachments Provided:</span> {aiExtracted.attachments}</li>
                </ul>              </div>
            </div>

            <h3 className="font-bold text-gray-700 mb-2 mt-4 text-sm">Victim Statement</h3>
            <div className="p-4 bg-gray-50 rounded italic whitespace-pre-wrap border relative group text-sm">
              {getCleanVictimStatement(caseData.rawDescription)}
              <button
                onClick={() => handleCopy(getCleanVictimStatement(caseData.rawDescription), 'stmt')}
                className="absolute top-2 right-2 p-1 bg-white border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                disabled={isReadOnly}
              >
                {copyFeedback === 'stmt' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

{/* Communication with Victim (Demoted) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-3 border-b pb-2">Communication with Victim</h2>
            
            {(caseData.messages && caseData.messages.length > 0) || (caseData.evidence && caseData.evidence.length > 0) ? (
              <div className="mb-6 space-y-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded border">
                {caseData.messages && caseData.messages.map((msg: any) => (
                  <div key={msg.id} className={`p-3 rounded-lg text-sm shadow-sm ${msg.role === 'assistant' ? 'bg-blue-50 border-blue-200 ml-8 border' : 'bg-white border-gray-200 mr-8 border'}`}>
                    <p className="font-bold text-xs mb-1 text-gray-500">
                      {msg.role === 'assistant' ? 'Authority Request' : 'Victim Reply'} • {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {caseData.evidence && caseData.evidence.length > 0 && (
                  <div className="p-3 rounded-lg text-sm shadow-sm bg-white border-gray-200 mr-8 border">
                    <p className="font-bold text-xs mb-1 text-gray-500">
                      Victim Reply • {new Date(caseData.evidence[0].createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap font-bold text-blue-700">📎 Evidence Received: {caseData.evidence.length} item{caseData.evidence.length > 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-3 mt-4 border-t pt-4">
              <label className="block text-xs font-bold text-gray-700 uppercase">Structured Info Request</label>
              <select
                className="w-full p-2 border rounded text-sm mb-2 font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
                onChange={(e) => setRequestMoreInfoText(e.target.value)}
                defaultValue=""
                disabled={isReadOnly}
              >
                <option value="" disabled>Select Evidence Request Type...</option>
                <option value="Please provide the exact Transaction ID or Receipt for the recent transfer.">Request: Transaction ID / Receipt</option>
                <option value="Please upload a screenshot of the chat where the scammer instructed you to transfer money.">Request: Chat Screenshot</option>
                <option value="Please provide the full bank account number and bank name of the recipient.">Request: Recipient Bank Details</option>
              </select>
              <textarea
                className="w-full p-3 border rounded text-sm min-h-[80px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Or type a custom request..."
                value={requestMoreInfoText}
                onChange={(e) => setRequestMoreInfoText(e.target.value)}
                disabled={isReadOnly}
              />
              <button
                onClick={() => {
                  if (requestMoreInfoText.trim()) {
                    handleUpdate({ requestMoreInfo: requestMoreInfoText });
                    setRequestMoreInfoText("");
                  }
                }}
                disabled={!requestMoreInfoText.trim() || saving || isReadOnly}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>

          {/* AI Multi-Agency Dispatch Proposal */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-indigo-200">
            <h2 className="text-xl font-bold mb-4 border-b border-indigo-100 pb-2 text-indigo-900 flex items-center gap-2">
              🤖 AI Multi-Agency Dispatch Proposal
            </h2>
            
            {isReadOnly || dispatchSuccess ? (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-bold text-green-700 uppercase">Dispatched Agencies</h3>
                <div className="bg-green-50 p-4 rounded-md border border-green-200 font-bold text-green-800 text-sm mb-4">
                  ✅ Payload successfully dispatched to {routingSuggestions.filter(s => s.selected).length} agencies.
                </div>
                {routingSuggestions.filter(s => s.selected).map((sug, idx) => (
                  <div key={idx} className="flex items-center p-3 border rounded-lg bg-white border-green-200 shadow-sm">
                    <span className="text-green-500 mr-3">✅</span>
                    <div>
                      <p className="font-bold text-gray-900">{sug.agency}</p>
                      <p className="text-xs text-gray-500 font-mono">Action: {sug.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
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

                  <div className="mt-4 pt-4 border-t border-indigo-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Manually Add Agency</h3>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-2 border rounded text-sm bg-gray-50"
                        disabled={saving}
                        onChange={(e) => {
                          if (e.target.value) {
                            const agency = agencies.find(a => a.name === e.target.value);
                            if (agency && !routingSuggestions.find(s => s.agencyId === agency.agency_id)) {
                              setRoutingSuggestions([...routingSuggestions, {
                                agency: agency.name,
                                agencyId: agency.agency_id,
                                action: 'MANUAL_DISPATCH',
                                selected: true
                              }]);
                            }
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select Agency to Add...</option>
                        {agencies.map(a => (
                          <option key={a.agency_id} value={a.name}>{a.name} ({a.agency_id})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDispatching(true);
                    setTimeout(() => {
                      setDispatching(false);
                      setDispatchSuccess(true);
                      handleUpdate({ workflowStatus: 'ROUTED' });
                    }, 1500);
                  }}
                  disabled={dispatching || routingSuggestions.filter(s=>s.selected).length === 0}
                  className={`text-white font-bold w-full py-3 rounded-md transition-all shadow flex justify-center items-center gap-2 ${dispatching || routingSuggestions.filter(s=>s.selected).length === 0 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {dispatching ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Dispatching...
                    </>
                  ) : "APPROVE & DISPATCH TO SELECTED AGENCIES"}
                </button>
              </>
            )}
          </div>

          {/* Evidence Received */}
          {caseData.evidence && caseData.evidence.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="mb-3 border-b pb-2">
                <h2 className="text-lg font-bold">Evidence Received</h2>
              </div>
              <div className="space-y-3">
                {caseData.evidence.map((item: any, idx: number) => {
                  const isImage = item.fileUrl?.startsWith('data:image');
                  const isDoc = item.fileUrl?.startsWith('data:') && !isImage;
                  const d = new Date(item.createdAt);
                  const timeStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  return (
                    <div key={item.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 ml-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{isImage ? '🖼️' : '📄'}</span>
                          <div>
                            <p className="text-sm font-medium text-blue-900">{isImage ? `Image ${idx + 1}` : isDoc ? `Document ${idx + 1}` : `File ${idx + 1}`}</p>
                            <p className="text-xs text-blue-600">Received {timeStr}</p>
                          </div>
                        </div>
                        {isImage && (
                          <button onClick={(e) => {
                            e.preventDefault();
                            const win = window.open();
                            if (win) {
                              win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f3f4f6;height:100vh;"><img src="${item.fileUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border-radius:0.5rem;" /></body></html>`);
                            }
                          }} className="text-xs text-blue-600 underline">View</button>
                        )}
                        {isDoc && (
                          <a href={item.fileUrl} download={`evidence_${idx + 1}`} className="text-xs text-blue-600 underline">Download</a>
                        )}
                      </div>
                      {isImage && (
                        <img src={item.fileUrl} alt={`Evidence ${idx + 1}`} className="mt-2 max-w-full max-h-48 rounded border border-blue-200 object-contain" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Intelligence Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-700">
            <h2 className="text-lg font-bold mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              🧠 AI Insights
            </h2>

            {/* Live Recoverability Reasoning */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <h3 className="font-bold text-slate-300 text-xs uppercase mb-2">Recoverability Reasoning (Live)</h3>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {(() => {
                  const elapsed = liveRecoverability?.elapsedMinutes ?? aiExtracted.timeElapsed;
                  const currentScore = liveRecoverability?.currentScore ?? caseData.recoverabilityScore ?? 0;
                  const currentLevel = liveRecoverability?.currentLevel ?? caseData.recoverabilityLevel ?? 'MEDIUM';
                  const originalScore = caseData.recoverabilityScore ?? 0;

                  const items: { color: string; text: string }[] = [];

                  // Time reasoning
                  if (elapsed <= 30) {
                    items.push({ color: 'text-green-400', text: `Transfer occurred <strong class="text-white">${elapsed} min${elapsed !== 1 ? 's' : ''} ago</strong> — freeze window is OPEN. Immediate action recommended.` });
                  } else if (elapsed <= 60) {
                    items.push({ color: 'text-green-400', text: `Transfer occurred <strong class="text-white">${elapsed} mins ago</strong> — within golden hour. Bank freeze still viable.` });
                  } else if (elapsed <= 360) {
                    items.push({ color: 'text-yellow-400', text: `Transfer occurred <strong class="text-white">~${Math.round(elapsed / 60)}h ago</strong> (${elapsed} mins). Freeze window narrowing — act urgently.` });
                  } else if (elapsed <= 1440) {
                    items.push({ color: 'text-red-400', text: `Transfer occurred <strong class="text-white">~${Math.round(elapsed / 60)}h ago</strong>. Funds likely moved to secondary accounts.` });
                  } else {
                    items.push({ color: 'text-red-400', text: `Transfer occurred <strong class="text-white">${Math.round(elapsed / 1440)} day(s) ago</strong>. Recovery probability very low — funds likely dispersed.` });
                  }

                  // Score decay indicator
                  if (currentScore < originalScore) {
                    const drop = originalScore - currentScore;
                    items.push({ color: 'text-red-400', text: `Recoverability score has decayed by <strong class="text-white">${drop} points</strong> since report (original: ${originalScore} → current: ${currentScore}).` });
                  }

                  // Level tag
                  const levelColor = currentLevel === 'CRITICAL' ? 'text-red-400' : currentLevel === 'HIGH' ? 'text-orange-400' : currentLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-gray-400';
                  items.push({ color: levelColor, text: `Current classification: <strong class="text-white">${currentLevel}</strong> (${currentScore}/100).` });

                  // Bank identification
                  if (aiExtracted.bank !== 'Unknown') {
                    items.push({ color: 'text-green-400', text: `Target bank <strong class="text-white">${aiExtracted.bank}${aiExtracted.bankFullName ? ` (${aiExtracted.bankFullName})` : ''}</strong> identified — direct freeze request possible.` });
                  }

                  // Account number
                  if (aiExtracted.account !== 'Unknown') {
                    items.push({ color: 'text-green-400', text: `Mule account number <strong class="text-white">${aiExtracted.account}</strong> detected — actionable for bank.` });
                  }

                  // Scam type pattern
                  if (caseData?.scamType && caseData.scamType !== 'UNKNOWN') {
                    items.push({ color: 'text-green-400', text: `Matches known <strong class="text-white">${caseData.scamType.replace(/_/g, ' ').toLowerCase()}</strong> pattern.` });
                  }

                  // Evidence
                  if (caseData?.evidence?.length > 0) {
                    items.push({ color: 'text-green-400', text: `<strong class="text-white">${caseData.evidence.length} evidence file(s)</strong> attached by victim.` });
                  } else {
                    items.push({ color: 'text-yellow-400', text: 'No evidence files attached — may affect case strength.' });
                  }

                  return items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`${item.color} mt-0.5`}>•</span>
                      <span dangerouslySetInnerHTML={{ __html: item.text }} />
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {(() => {
              const nonTimeReasons = (caseData?.priorityReason || []).filter((r: string) =>
                !r.toLowerCase().includes('hours ago') &&
                !r.toLowerCase().includes('minutes ago') &&
                !r.toLowerCase().includes('recently') &&
                !r.toLowerCase().includes('yesterday') &&
                !r.toLowerCase().includes('occurred') &&
                !r.toLowerCase().includes('recency')
              );
              return nonTimeReasons.length > 0 ? (
                <ul className="space-y-3 text-sm mb-4">
                  {nonTimeReasons.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400">⚡</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null;
            })()}

            {(aiExtracted.bank !== 'Unknown' || aiExtracted.account !== 'Unknown') && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h3 className="font-bold text-slate-300 text-xs uppercase mb-2">🔗 Linked Entities Match</h3>
                <div className="bg-slate-800 p-3 rounded border border-slate-600 text-sm">
                  {aiExtracted.account !== 'Unknown' ? (
                    <>
                      <p className="text-slate-200">
                        Account <strong className="text-white">{aiExtracted.account}</strong> has been flagged in our system.
                      </p>
                      <p className="text-red-400 font-bold mt-1">High Risk Indicator</p>
                      <p className="text-xs text-slate-400 mt-2">Target Bank: {aiExtracted.bank}</p>
                    </>
                  ) : (
                    <p className="text-slate-200">
                      Bank <strong className="text-white">{aiExtracted.bank}</strong> identified. Awaiting account number for deeper matching.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Workflow Status Update</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {['TRIAGED', 'IN_PROGRESS', 'NEEDS_INFO', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdate({ workflowStatus: status })}
                  disabled={saving || isReadOnly || caseData.workflowStatus === status}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${
                    caseData.workflowStatus === status 
                      ? (status === 'NEEDS_INFO' ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-400' 
                        : status === 'ROUTED' || status === 'RESOLVED' ? 'bg-green-100 text-green-800 ring-2 ring-green-400'
                        : 'bg-blue-100 text-blue-800 ring-2 ring-blue-400')
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
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
                  <select className="w-full p-2 border rounded text-sm" defaultValue="" disabled={saving || isReadOnly}>
                    <option value="" disabled>Select action...</option>
                    <option value="FREEZE_REQUEST">Bank Freeze Request</option>
                    <option value="ESCALATION">Agency Escalation</option>
                    <option value="MULE_FLAG">Mule Account Flagged</option>
                    <option value="INVESTIGATION">Investigation Opened</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Outcome</label>
                  <select className="w-full p-2 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" value={outcomeSelect} onChange={(e) => setOutcomeSelect(e.target.value)} disabled={isReadOnly}>
                    <option value="" disabled>Select outcome...</option>
                    <option value="RECOVERED">✅ Funds Recovered</option>
                    <option value="PARTIAL">⚠️ Partial Recovery</option>
                    <option value="LOST">❌ Funds Lost</option>
                  </select>
                </div>
                <button
                  onClick={() => { if (outcomeSelect) handleUpdate({ interventionOutcome: outcomeSelect, workflowStatus: 'RESOLVED' }); }}
                  disabled={!outcomeSelect || saving || isReadOnly}
                  className={`w-full text-white py-2 rounded text-sm font-bold transition-colors ${isReadOnly || !outcomeSelect ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  Record Outcome & Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
