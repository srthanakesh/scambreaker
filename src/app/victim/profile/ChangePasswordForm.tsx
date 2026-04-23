'use client';

import { useActionState, useRef } from 'react';
import { updatePassword } from '@/app/actions/auth';

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="password">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        <p className="text-sm text-slate-500 mt-1">Update your account password. Ensure you use a strong, unique password.</p>
      </div>
      
      <form ref={formRef} action={formAction} className="p-6 space-y-6">
        {state?.error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">
            {state.success}
          </div>
        )}




        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input 
            type="password" 
            name="newPassword" 
            required
            minLength={6}
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input 
            type="password" 
            name="confirmPassword" 
            required
            minLength={6}
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
