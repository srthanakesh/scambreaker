'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  HelpCircle, 
  X, 
  ShoppingCart, 
  TrendingUp, 
  UserSquare2, 
  Mail, 
  MoreHorizontal,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const incidentTypes = [
  {
    id: 'online-purchase',
    icon: ShoppingCart,
    title: 'Online Purchase',
    description: 'Non-delivery of goods, counterfeit items, or fake storefronts.',
  },
  {
    id: 'investment-scam',
    icon: TrendingUp,
    title: 'Investment Scam',
    description: 'Cryptocurrency fraud, Ponzi schemes, or fake investment platforms.',
  },
  {
    id: 'identity-theft',
    icon: UserSquare2,
    title: 'Identity Theft',
    description: 'Unauthorized use of personal information, fake accounts.',
  },
  {
    id: 'phishing-email',
    icon: Mail,
    title: 'Phishing / Email',
    description: 'Deceptive emails requesting sensitive info or containing malware.',
  }
];

export default function InteractiveReportFlow({ user }: { user: any }) {
  const [selectedType, setSelectedType] = useState<string | null>('online-purchase');

  return (
    <div className="fixed inset-0 z-50 flex bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      
      {/* Left Sidebar Steps */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-transparent">
          <Shield className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-[1.15rem] font-bold text-blue-600 tracking-tight">ScamBreaker</span>
        </div>

        <div className="px-6 pt-8 pb-4">
          <h2 className="text-[1.35rem] font-medium text-slate-900 leading-tight">Report Incident</h2>
          <p className="text-[13px] text-slate-500 mt-1">Process tracking</p>
        </div>

        <div className="flex-grow py-4">
          <div className="relative">
            {/* Step 1 - Active */}
            <div className="relative z-10 flex items-center px-6 py-3 bg-[#e0e7ff] mr-4 rounded-r-full cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium border-2 border-transparent">
                1
              </div>
              <span className="ml-3 text-sm font-semibold text-blue-800">Incident Type</span>
            </div>

            {/* Step Connector Line */}
            <div className="absolute left-[35px] top-6 bottom-[-200px] w-px bg-slate-200 z-0"></div>

            {/* Future Steps */}
            {[
              { num: 2, label: 'Victim Details' },
              { num: 3, label: 'Evidence' },
              { num: 4, label: 'Suspect Info' },
              { num: 5, label: 'Review' },
            ].map(step => (
              <div key={step.num} className="relative z-10 flex items-center px-6 py-4 cursor-not-allowed opacity-70">
                <div className="w-6 h-6 rounded-full bg-white text-slate-500 flex items-center justify-center text-xs font-medium border-2 border-slate-300">
                  {step.num}
                </div>
                <span className="ml-3 text-sm font-medium text-slate-600">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full bg-[#f8fafc] overflow-y-auto">
        
        {/* Top Navbar */}
        <div className="h-[72px] flex justify-end items-center px-8 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <HelpCircle className="w-5 h-5 fill-slate-500 text-white" />
            </button>
            <Link href="/victim/dashboard" className="flex items-center text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Cancel Report <X className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-12 px-12 md:px-20 max-w-[1000px]">
          
          <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 mb-4">
            What kind of incident are you reporting?
          </h1>
          <p className="text-[1.05rem] text-slate-600 mb-10 max-w-3xl leading-relaxed">
            Select the category that best describes the situation to help us route your report to the correct department.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {incidentTypes.map((type) => {
              const isActive = selectedType === type.id;
              const Icon = type.icon;
              
              return (
                <div 
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'border-blue-500 bg-[#e0e7ff] shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Select indicator */}
                  {isActive && (
                    <div className="absolute top-4 right-4 text-blue-500">
                      <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white" />
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded shadow-sm flex items-center justify-center mb-5 ${isActive ? 'bg-white' : 'bg-slate-50'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  
                  <h3 className={`text-xl font-medium mb-2 tracking-tight ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                    {type.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isActive ? 'text-blue-800/80' : 'text-slate-500'}`}>
                    {type.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Full Width Others */}
          <div 
            onClick={() => setSelectedType('other')}
            className={`relative w-full p-6 pb-7 rounded-xl border-2 transition-all cursor-pointer mb-20 ${
              selectedType === 'other' 
                ? 'border-blue-500 bg-[#e0e7ff] shadow-sm' 
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {selectedType === 'other' && (
              <div className="absolute top-4 right-4 text-blue-500">
                <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white" />
              </div>
            )}
            
            <div className={`w-10 h-10 rounded shadow-sm flex items-center justify-center mb-5 ${selectedType === 'other' ? 'bg-white' : 'bg-slate-50'}`}>
              <MoreHorizontal className={`w-5 h-5 ${selectedType === 'other' ? 'text-blue-600' : 'text-slate-600'}`} />
            </div>
            
            <h3 className={`text-xl font-medium mb-1 tracking-tight ${selectedType === 'other' ? 'text-blue-900' : 'text-slate-900'}`}>
              Other Incident Type
            </h3>
            <p className={`text-sm leading-relaxed ${selectedType === 'other' ? 'text-blue-800/80' : 'text-slate-500'}`}>
              Romance scams, tech support fraud, or categories not listed above.
            </p>
          </div>

          {/* Bottom Divider */}
          <div className="w-full border-t border-slate-200 py-8 flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-[0.65rem] px-6 rounded shadow-sm hover:shadow-md transition-all flex items-center active:scale-95">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
