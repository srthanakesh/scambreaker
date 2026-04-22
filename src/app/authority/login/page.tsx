'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import Link from 'next/link';

export default function AuthorityLogin() {
  const [state, formAction, isPending] = useActionState((state: any, payload: FormData) => login(payload, 'AUTHORITY'), null);

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden flex flex-col font-sans selection:bg-amber-500/30 animate-page-enter">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-[url('/bgfrontpage.png')] bg-cover bg-center opacity-70 pointer-events-none grayscale sepia-[.2] hue-rotate-[190deg]"
        style={{ animation: 'floatBg 30s ease-in-out infinite', transform: 'scale(1.05)' }}
      ></div>
      <div className="absolute inset-0 bg-slate-950/80 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.95)_100%)] z-0 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="flex-shrink-0 cursor-pointer">
              <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">ScamBreaker</span>
            </Link>

            <div className="flex items-center">
              <Link
                href="/"
                className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <span>&larr;</span> Return Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2 uppercase drop-shadow-lg">AUTHORITY PORTAL</h2>
          <p className="text-slate-400 text-sm font-mono tracking-widest max-w-2xl mx-auto uppercase">Authorized Personnel Only</p>
        </div>

        <div className="flex justify-center max-w-[420px] w-full">
          <div className="bg-slate-900/60 backdrop-blur-xl border-t-4 border-t-amber-600 border-x border-b border-white/10 p-8 shadow-2xl w-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-amber-500/10 w-12 h-12 flex items-center justify-center border border-amber-500/30">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-white tracking-wide uppercase">Account Login</h3>
                 <p className="text-xs text-amber-500/80 mt-1">Manage active cases and reports</p>
              </div>
            </div>
            
            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className="bg-red-900/30 border-l-4 border-red-500 text-red-200 p-3 text-sm flex items-start shadow-inner">
                  <span className="font-mono">{state.error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input id="email" name="email" type="email" required className="w-full bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono text-sm" />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input id="password" name="password" type="password" required className="w-full bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono text-sm tracking-widest" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isPending} className="w-full bg-amber-600 hover:bg-amber-500 text-[#0b1120] font-bold py-4 px-4 shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] tracking-widest text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  {isPending ? 'AUTHENTICATING...' : 'SIGN IN'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 border-t border-white/5 pt-6 leading-relaxed">
               All actions on the Authority Portal are securely logged.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
