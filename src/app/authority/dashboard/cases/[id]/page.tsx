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

  useEffect(() => {
    fetchCase();
  }, [id]);

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
          <h1 className="text-2xl font-bold">Case #{caseData.id.substring(0, 8)}</h1>
          <p className="text-sm text-gray-600">Reported on {new Date(caseData.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/authority/dashboard" className="px-4 py-2 bg-white border rounded text-sm font-bold">Back</Link>
          <div className="relative group">
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold flex items-center gap-2">
              Update Status {saving && "..."}
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow-lg hidden group-hover:block z-10">
              {caseData.allowedTransitions?.map((status: string) => (
                <button 
                  key={status}
                  onClick={() => handleUpdate({ workflowStatus: status })}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 font-bold"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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

          {/* Request More Info from Victim */}
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
              <label className="block text-xs font-bold text-gray-700 uppercase">Request More Info</label>
              <textarea
                className="w-full p-3 border rounded text-sm min-h-[100px]"
                placeholder="What specific information do you need from the victim?"
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

          {/* Victim Statement */}
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

          {/* Generated Documents */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Generated Document Drafts</h2>
            <div className="space-y-4">
              {caseData.documents?.map((doc: any, i: number) => (
                <div key={i} className="border rounded overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-sm font-bold border-b flex justify-between items-center">
                    {doc.title}
                    <div className="space-x-2">
                      <button 
                        onClick={() => handleCopy(doc.content, `doc-${i}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {copyFeedback === `doc-${i}` ? 'Copied!' : 'Copy Text'}
                      </button>
                      <button 
                        onClick={() => startEditDoc(i)}
                        className="text-gray-600 hover:underline text-xs"
                      >
                        Edit Draft
                      </button>
                    </div>
                  </div>
                  {editingDocIndex === i ? (
                    <div className="p-4 bg-white">
                      <textarea 
                        className="w-full h-40 p-2 border rounded font-mono text-xs"
                        value={tempDocContent}
                        onChange={(e) => setTempDocContent(e.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <button onClick={saveDoc} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Save</button>
                        <button onClick={() => setEditingDocIndex(null)} className="bg-gray-200 px-3 py-1 rounded text-xs font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {doc.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
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
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Assigned Agency</label>
              <select 
                className="w-full p-2 border rounded text-sm bg-gray-50"
                value={caseData.assignedAgency || ''}
                onChange={(e) => handleUpdate({ assignedAgency: e.target.value })}
                disabled={saving}
              >
                <option value="" disabled>Select Agency...</option>
                <option value="NSRC">NSRC</option>
                <option value="PDRM CCID">PDRM CCID</option>
                <option value="MCMC">MCMC</option>
                <option value="Bank Negara">Bank Negara</option>
                <option value="KPDN">KPDN</option>
              </select>
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
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Workflow Logs</h2>
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

          <div className="bg-white p-6 rounded-lg shadow-sm border bg-blue-50">
            <h2 className="text-lg font-bold mb-4 border-b border-blue-200 pb-2">Authority Ticket</h2>
            <div className="space-y-2">
              <p className="text-sm">Status: <span className="font-bold text-green-700">ACTIVE</span></p>
              <Link 
                href={`/authority/dashboard/cases/${id}/workflow`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 mt-4"
              >
                Open Official Workflow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
