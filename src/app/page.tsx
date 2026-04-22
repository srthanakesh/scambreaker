import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#060a14] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30">
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
            <div className="flex-shrink-0 cursor-pointer">
              <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">ScamBreaker</span>
            </div>
            
            {/* Nav Items - Center - strictly as requested */}
            <div className="hidden md:flex space-x-8 absolute left-1/2 -translate-x-1/2">
              <span className="text-sm font-bold tracking-[0.2em] text-slate-300 hover:text-white transition-colors cursor-pointer uppercase">
                How It Works
              </span>
            </div>

            {/* Nav Items - Right */}
            <div className="flex items-center">
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
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        
        {/* Hero Title */}
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-[1.05] mb-12 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">
          ScamBreaker
        </h1>
        
        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/victim/login"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-10 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 sm:text-lg uppercase tracking-wide"
          >
            Report Case Now
          </Link>
        </div>



        <div className="mt-auto pt-8">
          <ChevronDown className="w-6 h-6 text-slate-600 animate-bounce cursor-pointer hover:text-cyan-400 transition-colors" />
        </div>
      </main>

    </div>
  );
}
