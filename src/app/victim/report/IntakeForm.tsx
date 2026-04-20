'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntakeForm({ user }: { user: { fullName: string; icNumber: string | null; phoneNumber: string | null } }) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDescription: description }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/victim/cases/${data.id}`);
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4 border-b pb-2">Complainant Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" disabled value={user.fullName} className="mt-1 block w-full bg-slate-100 border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">IC Number</label>
            <input type="text" disabled value={user.icNumber || 'Not provided'} className="mt-1 block w-full bg-slate-100 border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-600" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <input type="text" disabled value={user.phoneNumber || 'Not provided'} className="mt-1 block w-full bg-slate-100 border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-600" />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">* These details are automatically fetched from your verified registration.</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
        <label htmlFor="description" className="block text-lg font-medium text-slate-900 mb-2 border-b pb-2">
          Scam Details
        </label>
        <p className="text-sm text-slate-600 mb-4">Please describe what happened in as much detail as possible. Include details like bank account numbers, names, or websites involved.</p>
        <textarea
          id="description"
          rows={8}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 border"
          placeholder="E.g. I received a WhatsApp message from someone claiming to be from PosLaju. They asked me to click a link and pay RM50 for a delivery fee..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500">Language:</span>
          <select className="text-sm border-slate-300 rounded-md">
            <option>English</option>
            <option>Bahasa Malaysia</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !description.trim()}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Analyzing & Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
}
