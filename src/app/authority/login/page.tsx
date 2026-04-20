'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AuthorityLogin() {
  const [state, formAction, isPending] = useActionState((state: any, payload: FormData) => login(payload, 'AUTHORITY'), null);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-blue-500" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Authority Portal</h2>
        <p className="mt-2 text-center text-sm text-slate-400">Sign in to manage active cases</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-700">
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
                {state.error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" required className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-white">Return to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
