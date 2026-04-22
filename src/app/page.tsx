'use client';

import React, { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { ChevronDown, UserCheck } from 'lucide-react';
import { loginVictimAction } from '@/app/actions/auth';

const CryptoText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    let iteration = 0;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=";
    const interval = setInterval(() => {
      const currentLength = Math.min(Math.ceil(iteration) + 3, text.length);
      
      setDisplayText(
        text
          .substring(0, currentLength)
          .split("")
          .map((letter, index) => {
            if (index < iteration) return text[index];
            if (letter === ' ') return ' ';
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setDone(true);
      }

      iteration += 1.5; // Quick reveal speed
    }, 15); // Fast tick

    return () => clearInterval(interval);
  }, [text, started]);

  return (
    <span className="relative inline-block text-left w-full h-full">
      {displayText}
      {(!done) && (
        <span className="inline-block w-[0.4em] bg-current opacity-80 h-[1.1em] align-middle ml-1 animate-pulse" />
      )}
    </span>
  );
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [state, formAction, isPending] = useActionState(loginVictimAction, null);

  return (
    <div className="relative min-h-screen bg-[#060a14] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 animate-page-enter">
      {/* Background Image using pseudo-element or absolute div */}
      <div 
        className="absolute inset-0 bg-[url('/bgfrontpage.png')] bg-cover bg-center opacity-90 pointer-events-none"
        style={{ animation: 'floatBg 25s ease-in-out infinite', transform: 'scale(1.05)' }}
      ></div>
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.7)_100%)] z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-transparent backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => setShowLogin(false)}>
              <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">ScamBreaker</span>
            </div>
            
            {/* Nav Items - Center */}
            {!showLogin && (
              <div className="hidden md:flex space-x-8 absolute left-1/2 -translate-x-1/2">
                <span className="text-sm font-bold tracking-[0.2em] text-slate-300 hover:text-white transition-colors cursor-pointer uppercase">
                  How It Works
                </span>
              </div>
            )}

            {/* Nav Items - Right */}
            <div className="flex items-center gap-6">
              {showLogin && (
                <button 
                  onClick={() => setShowLogin(false)}
                  className="text-slate-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <span>&larr;</span> Return Home
                </button>
              )}
              <Link
                href="/authority/login"
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0b1120] font-bold py-2.5 px-6 rounded shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:-translate-y-0.5 text-xs sm:text-sm uppercase tracking-wider"
              >
                Authority Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12 w-full">
        
        {!showLogin ? (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 min-h-[40vh]">
            {/* Hero Title */}
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-[1.05] mb-28 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">
              ScamBreaker
            </h1>
            
            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <button
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-10 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 sm:text-lg uppercase tracking-wide cursor-pointer"
              >
                Report Case Now
              </button>
            </div>

            <div className="mt-8">
              <ChevronDown className="w-6 h-6 text-slate-600 animate-bounce cursor-pointer hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center justify-center animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2 drop-shadow-sm">Victim Portal</h2>
              <p className="text-slate-400 font-medium tracking-wide">Login or create an account to initiate a case report.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl w-full text-left">
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

              <div className="mt-8 text-center text-sm text-slate-400 font-medium border-t border-white/5 pt-6">
                Don't have an account?{' '}
                <Link href="/victim/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold tracking-wide">
                  CREATE ACCOUNT
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
