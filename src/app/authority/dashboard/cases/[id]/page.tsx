'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthorityCaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
  const [tempDocContent, setTempDocContent] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      setCaseData(data);
    } catch (err) {
      console.error(err);
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
              {['NEW', 'ANALYZED', 'NEEDS_INFO', 'ROUTED', 'FOLLOW_UP_PENDING', 'CLOSED'].map(status => (
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
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                caseData.workflowStatus === 'NEEDS_INFO' ? 'bg-orange-100 text-orange-800' :
                caseData.workflowStatus === 'ROUTED' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {caseData.workflowStatus}
              </span>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Assigned Agency: <span className="font-bold text-gray-900">{caseData.assignedAgency}</span>
            </p>
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
