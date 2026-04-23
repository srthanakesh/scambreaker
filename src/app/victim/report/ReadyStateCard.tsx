'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  ShieldAlert, 
  FileText, 
  MessageSquare,
  Check,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';

interface ReadyStateCardProps {
  analysisJson: any;
  fullReply: string;
  riskLevel: 'CRITICAL' | 'URGENT' | 'RECOVERY' | null;
  onSubmitReport: () => void;
  onKeepChatting: () => void;
  isSubmitting: boolean;
}

export default function ReadyStateCard({
  analysisJson,
  fullReply,
  riskLevel,
  onSubmitReport,
  onKeepChatting,
  isSubmitting
}: ReadyStateCardProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    await onSubmitReport();
    setIsSuccess(true);
  };

  const { bankNumber, isNsrcOnly } = useMemo(() => {
    const text = (fullReply || '').toLowerCase();
    if (text.includes('maybank')) return { bankNumber: '1-300-88-6688', isNsrcOnly: false };
    if (text.includes('cimb')) return { bankNumber: '1300-880-900', isNsrcOnly: false };
    if (text.includes('public bank') || text.includes('pbb')) return { bankNumber: '1-800-22-5555', isNsrcOnly: false };
    if (text.includes('rhb')) return { bankNumber: '1-800-88-9878', isNsrcOnly: false };
    if (text.includes('hong leong') || text.includes('hlb')) return { bankNumber: '1-300-88-1234', isNsrcOnly: false };
    return { bankNumber: '997', isNsrcOnly: true };
  }, [fullReply]);

  const draftMatch = fullReply.match(/---\s*DRAF LAPORAN POLIS\s*---([\s\S]*)/i);
  let policeDraft = draftMatch ? draftMatch[1].trim() : '';
  if (policeDraft && policeDraft.includes('```')) {
    policeDraft = policeDraft.split('```')[0].trim();
  }

  const copyDraft = () => {
    navigator.clipboard.writeText(`--- DRAF LAPORAN POLIS ---\n\n${policeDraft}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let urgencyTheme = {
    bg: 'bg-blue-600',
    title: 'ℹ️ RECOVERY MODE — Follow steps below'
  };

  const urgency = analysisJson?.urgency || 'LOW';
  if (urgency === 'HIGH') {
    urgencyTheme = { bg: 'bg-red-600', title: '🚨 CRITICAL — Act within 60 minutes' };
  } else if (urgency === 'MEDIUM') {
    urgencyTheme = { bg: 'bg-orange-500', title: '⚠️ URGENT — Act within 24 hours' };
  }

  const steps = [
    {
      id: 'step-1',
      title: "Call Your Bank's Fraud Hotline",
      priority: 'IMMEDIATE',
      description: isNsrcOnly 
        ? "We couldn't identify your bank. Please call NSRC immediately at 997." 
        : "Based on your bank, call their fraud hotline immediately to freeze your account.",
      button: { icon: <Phone className="w-4 h-4" />, text: "Call Now", link: `tel:${bankNumber.replace(/-/g, '')}` },
      priorityClass: "bg-red-100 text-red-700 border-red-200"
    },
    {
      id: 'step-2',
      title: "Call NSRC — National Scam Response Centre",
      priority: 'IMMEDIATE',
      description: "Report to the national hotline. They can coordinate with multiple banks simultaneously.",
      button: { icon: <Phone className="w-4 h-4" />, text: "Call 997", link: "tel:997" },
      priorityClass: "bg-red-100 text-red-700 border-red-200"
    },
    {
      id: 'step-3',
      title: "Preserve All Evidence",
      priority: 'URGENT',
      description: "Screenshot every message, transaction receipt, and the scammer's profile before they disappear.",
      priorityClass: "bg-orange-100 text-orange-700 border-orange-200"
    },
    {
      id: 'step-4',
      title: "File Police Report Within 24 Hours",
      priority: 'STANDARD',
      description: "Bring your IC, bank statements, and screenshots to the nearest police station.",
      priorityClass: "bg-slate-100 text-slate-600 border-slate-200"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto bg-white rounded-[1.25rem] shadow-xl border border-slate-200 overflow-hidden mb-6"
    >
      {/* SECTION 1: Risk Banner */}
      <div className={`px-6 py-5 text-white ${urgencyTheme.bg} transition-colors duration-500`}>
        <div className="flex flex-col">
          <div className="font-bold tracking-wide text-sm mb-1 text-white/90">
            {urgencyTheme.title}
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-0.5">
            RM {analysisJson?.amountLost?.toLocaleString() || '0'} • {analysisJson?.scamType || 'Scam Incident'}
          </h3>
          <p className="text-white/80 text-sm font-medium">
            Assigned to {analysisJson?.assignedAgency || 'PDRM CCID'}
          </p>
        </div>
      </div>

      {/* SECTION 2: Action Plan (Read-Only) */}
      <div className="px-6 py-6 bg-slate-50/50">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Your Action Plan
        </h4>
        <p className="text-xs text-slate-400 mb-5 font-medium">Complete these steps after submitting your report</p>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className="group relative flex items-start p-4 rounded-xl border bg-white border-slate-200 shadow-sm"
            >
              <div className="flex-shrink-0 mt-0.5 mr-3 z-10">
                <div className="w-6 h-6 rounded-full border-2 bg-white border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                  {idx + 1}
                </div>
              </div>
              <div className="flex-grow min-w-0 z-10">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-bold text-[0.95rem] leading-tight text-slate-800">
                    {step.title}
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${step.priorityClass}`}>
                    {step.priority}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
                {step.button && (
                  <a 
                    href={step.button.link}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm border bg-teal-500 hover:bg-teal-600 text-white border-teal-600 mt-3"
                  >
                    {step.button.icon}
                    <span>{step.button.text}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Police Report Draft */}
      {policeDraft && (
        <div className="border-t border-slate-200 bg-white">
          <button 
            onClick={() => setIsDraftOpen(!isDraftOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center text-slate-700 font-bold text-sm">
              <FileText className="w-4 h-4 mr-2 text-slate-500" />
              📄 View Police Report Draft
            </div>
            {isDraftOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          
          <AnimatePresence>
            {isDraftOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5">
                  <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {`--- DRAF LAPORAN POLIS ---\n\n${policeDraft}`}
                    </pre>
                    <button 
                      onClick={copyDraft}
                      className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
                      title="Copy Draft"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {copied && (
                      <span className="absolute top-4 right-10 text-[10px] font-bold text-emerald-500">
                        Copied!
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SECTION 4: Action Buttons */}
      <div className="px-6 py-6 bg-white border-t border-slate-100 flex flex-col space-y-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isSuccess}
          className={`flex flex-col items-center justify-center w-full py-3.5 rounded-xl transition-all shadow-sm group border ${
            isSuccess 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default' 
              : 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-blue-200/50'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold text-[0.95rem]">
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>✓ Report Submitted!</span>
              </>
            ) : isSubmitting ? (
              <>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5" />
                <span>Submit Official Report</span>
              </>
            )}
          </div>
          {isSuccess && (
            <span className="text-[11px] mt-0.5 opacity-80">Redirecting to your case...</span>
          )}
        </button>
        
        {!isSuccess && (
          <button
            onClick={onKeepChatting}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 bg-transparent hover:bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Add More Details</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
