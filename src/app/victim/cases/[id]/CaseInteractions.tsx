'use client';

import { useState } from 'react';
import { updateTaskStatus, submitMissingInfo, submitEvidence } from '@/app/actions/victim';
import { CheckCircle } from 'lucide-react';

export default function CaseInteractions({ caseRecord }: { caseRecord: any }) {
  const [missingInfoText, setMissingInfoText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

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
        await submitEvidence(caseRecord.id, fileUrl);
      }

      setMissingInfoText('');
      setSelectedFile(null);
      alert('Information submitted successfully!');
      window.location.reload();
    } catch {
      alert('Failed to submit information');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {caseRecord.followUpTasks.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Action Items</h3>
            <p className="mt-1 text-sm text-slate-500">
              Please complete these steps to help with the investigation.
            </p>
          </div>

          <div className="border-t border-slate-200">
            <ul className="divide-y divide-slate-200">
              {caseRecord.followUpTasks.map((task: any) => (
                <li key={task.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {task.status}
                      </span>

                      {task.status === 'PENDING' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={updatingTask === task.id || caseRecord.workflowStatus === 'NEEDS_INFO'}
                          title={
                            caseRecord.workflowStatus === 'NEEDS_INFO'
                              ? 'Please submit the requested information first'
                              : ''
                          }
                          className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {updatingTask === task.id ? 'Updating...' : 'Mark Done'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">{task.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
                      Authority • {new Date(msg.createdAt).toLocaleString()}
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
                      You • {new Date(msg.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            {caseRecord.workflowStatus === 'NEEDS_INFO' && (
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
                    a supporting file for demo purposes.
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