'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  ShieldAlert, 
  ArrowRight, 
  FileText, 
  MessageSquare,
  Check
} from 'lucide-react';

interface ActionStep {
  id: string;
  priority: 'IMMEDIATE' | 'URGENT' | 'STANDARD';
  title: string;
  description: string;
  phoneNumber: string | null;
}

interface ReadyStateCardProps {
  analysisJson: any;
  actionSteps: ActionStep[] | null;
  riskLevel: 'CRITICAL' | 'URGENT' | 'RECOVERY' | null;
  onSubmitReport: () => void;
  onKeepChatting: () => void;
  isSubmitting: boolean;
}

export default function ReadyStateCard({
  analysisJson,
  actionSteps,
  riskLevel,
  onSubmitReport,
  onKeepChatting,
  isSubmitting
}: ReadyStateCardProps) {
  const [tickedSteps, setTickedSteps] = useState<Record<string, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleStep = (id: string) => {
    setTickedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = async () => {
    await onSubmitReport();
    setIsSuccess(true);
  };

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-600';
      case 'URGENT': return 'bg-orange-500';
      case 'RECOVERY': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getRiskBadgeLabel = (level: string | null) => {
    switch (level) {
      case 'CRITICAL': return '🔴 CRITICAL — Act within 60 minutes';
      case 'URGENT': return '🟠 URGENT — High priority response';
      case 'RECOVERY': return '🔵 RECOVERY — Systematic resolution';
      default: return 'ANALYZING...';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'IMMEDIATE': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">IMMEDIATE</span>;
      case 'URGENT': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">URGENT</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">STANDARD</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      {/* SECTION A: Situation Summary */}
      <div className={`px-8 py-6 text-white ${getRiskColor(riskLevel)} transition-colors duration-500`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wider mb-3">
              {getRiskBadgeLabel(riskLevel)}
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-none mb-1">
              {analysisJson?.scamType || 'Scam Incident'}
            </h3>
            <p className="text-white/80 font-medium">
              Loss: RM {analysisJson?.amountLost?.toLocaleString() || '0'} • {analysisJson?.assignedAgency || 'PDRM CCID'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* SECTION B: Action Checklist */}
      <div className="px-8 py-8 bg-slate-50/50">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-6 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Immediate Action Plan
        </h4>

        <div className="space-y-4">
          {actionSteps ? actionSteps.map((step) => (
            <div 
              key={step.id}
              className={`group relative flex items-start p-4 rounded-2xl border transition-all duration-300 ${
                tickedSteps[step.id] 
                  ? 'bg-green-50/50 border-green-200 opacity-75' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5 mr-4">
                <button 
                  onClick={() => toggleStep(step.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    tickedSteps[step.id]
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {tickedSteps[step.id] && <Check className="w-4 h-4 stroke-[3px]" />}
                </button>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className={`font-bold text-[1.05rem] leading-tight truncate ${tickedSteps[step.id] ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {step.title}
                  </div>
                  {getPriorityBadge(step.priority)}
                </div>
                <p className={`text-sm leading-relaxed ${tickedSteps[step.id] ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step.description}
                </p>

                {step.phoneNumber && (
                  <a 
                    href={`tel:${step.phoneNumber}`}
                    className="mt-3 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call {step.phoneNumber}</span>
                  </a>
                )}
              </div>

              {tickedSteps[step.id] && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-6 h-6 text-green-500 opacity-20" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-slate-500 italic text-center py-4">No specific action steps detected. Please proceed with the official report.</p>
          )}
        </div>
      </div>

      {/* SECTION C: Action Buttons */}
      <div className="p-8 bg-white border-t border-slate-100">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center space-x-3 text-green-600 font-bold py-3 bg-green-50 rounded-2xl border border-green-100"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Report submitted! Redirecting...</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                ) : (
                  <>
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Generate Official Report</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onKeepChatting}
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Keep Chatting</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium leading-relaxed px-4">
          By generating this report, your case data will be securely transmitted to the {analysisJson?.assignedAgency || 'relevant authority'} for immediate verification and tracking.
        </p>
      </div>
    </motion.div>
  );
}
