'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createGuestSessionAction, loginVictimAction } from '@/app/actions/auth';
import { ArrowRight, UserCircle, UserCheck } from 'lucide-react';

export default function VictimLogin() {
  const [state, formAction, isPending] = useActionState(loginVictimAction, null);

  return (
    <div className="relative min-h-screen bg-[#060a14] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 animate-page-enter">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-[url('/bgfrontpage.png')] bg-cover bg-center opacity-90 pointer-events-none"
        style={{ animation: 'floatBg 25s ease-in-out infinite', transform: 'scale(1.05)' }}
      ></div>
      <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.8)_100%)] z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-transparent backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="flex-shrink-0 cursor-pointer">
              <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">ScamBreaker</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-4 drop-shadow-sm pb-2">Login or Register to continue</h2>
          <p className="text-slate-400 text-lg font-medium tracking-wide max-w-2xl mx-auto">Creating an account is highly recommended as it allows you to securely organize and monitor the real-time status of your report.</p>
        </div>

        <div className="flex justify-center max-w-lg w-full">
          {/* Existing Login */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl w-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <UserCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Account Login</h3>
            </div>
            
            <form action={formAction} className="space-y-5">
              {state?.error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded text-sm mb-4">
                  {state.error}
                </div>
              )}
              
              <div>
                <input id="email" name="email" type="email" required placeholder="Email address" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-medium" />
              </div>

              <div>
                <input id="password" name="password" type="password" required placeholder="Password" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-medium" />
              </div>

              <button type="submit" disabled={isPending} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] uppercase tracking-wider text-sm disabled:opacity-50">
                {isPending ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link href="/victim/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold tracking-wide">
                CREATE ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
