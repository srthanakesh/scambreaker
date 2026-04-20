import Link from 'next/link';
import { Shield, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <Shield className="mx-auto h-20 w-20 text-blue-500" />
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-white">
            Scam<span className="text-blue-500">Breaker</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            The national reporting and intelligence platform for cybercrime in Malaysia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mt-12">
          {/* Victim Portal */}
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-colors flex flex-col h-full text-left group">
            <FileText className="h-10 w-10 text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">I am a Victim</h2>
            <p className="text-slate-400 mb-8 flex-grow">
              Report a scam, track your case status, and securely communicate with assigned authorities.
            </p>
            <Link 
              href="/victim/login" 
              className="inline-flex items-center text-blue-400 font-semibold group-hover:text-blue-300"
            >
              Enter Victim Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Authority Portal */}
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-red-500 transition-colors flex flex-col h-full text-left group">
            <ShieldAlert className="h-10 w-10 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">I am an Authority</h2>
            <p className="text-slate-400 mb-8 flex-grow">
              Review scam reports, assign investigations, and access AI-driven case analysis.
            </p>
            <Link 
              href="/authority/login" 
              className="inline-flex items-center text-red-400 font-semibold group-hover:text-red-300"
            >
              Enter Authority Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
