'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
} from 'lucide-react';
import ReadyStateCard from './ReadyStateCard';
import EvidenceUploader from '@/components/EvidenceUploader';
import { motion, AnimatePresence } from 'framer-motion';

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
  },
];

type ChatMessage = {
  role: 'user' | 'assistant' | 'system_reasoning' | 'ready_card';
  content: string | React.ReactNode;
  actionSteps?: any[];
  riskLevel?: string;
  analysisJson?: any;
  fullReply?: string;
};

// Part 4: Formatted message component
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let listItems: React.ReactNode[] = [];
  let listType: 'ol' | 'ul' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      const listClass = listType === 'ol' ? 'list-decimal' : 'list-disc';
      elements.push(
        <ListTag key={`list-${elements.length}`} className={`${listClass} ml-6 space-y-1 mb-3`}>
          {listItems}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '' && !listType) {
      flushList();
      return;
    }

    // Check for lists
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    const ulMatch = trimmed.match(/^- \s*(.*)/);

    const content = olMatch ? olMatch[2] : (ulMatch ? ulMatch[1] : trimmed);
    
    // Check for bold text in the content
    const parts = content.split(/(\*\*.*?\*\*)/g);
    const formattedContent = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`strong-${i}-${j}`} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (olMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(<li key={`li-${i}`}>{formattedContent}</li>);
    } else if (ulMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(<li key={`li-${i}`}>{formattedContent}</li>);
    } else {
      flushList();
      if (trimmed !== '') {
        elements.push(<p key={`p-${i}`} className="mb-3 last:mb-0">{formattedContent}</p>);
      }
    }
  });

  flushList();
  return <div className="formatted-message">{elements}</div>;
}

export default function InteractiveReportFlow({ user }: { user: any }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ms' | 'zh' | 'ta'>('en');
  const [ocrContext, setOcrContext] = useState<string>('');

  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isConversationReady, setIsConversationReady] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<any | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, dataUrl: string}>>([]);

  const t = useMemo(() => ({
    en: {
      hello: `Hello, ${user.fullName.split(' ')[0]}. I am the ScamBreaker incident intake assistant.`,
      instruction: `Please tell me what happened. Include any details like names, numbers, or websites. This helps me send your report to the right team.`,
      error: `An error occurred while submitting your report. Please try again.`,
      readyMessage: `I have enough information to create your report. Click the button below to submit.`,
      submitBtn: `Submit Report`,
      keepChattingReply: `Sure! Tell me anything else and I can update the report.`
    },
    ms: {
      hello: `Helo, ${user.fullName.split(' ')[0]}. Saya ialah pembantu penerimaan insiden ScamBreaker.`,
      instruction: `Sila beritahu saya apa yang berlaku. Sertakan butiran seperti nama, nombor, atau laman web. Ini membantu saya menghantar laporan anda ke pasukan yang betul.`,
      error: `Ralat berlaku semasa menghantar laporan anda. Sila cuba lagi.`,
      readyMessage: `Saya mempunyai maklumat yang mencukupi untuk membuat laporan anda. Klik butang di bawah untuk menghantar.`,
      submitBtn: `Hantar Laporan`,
      keepChattingReply: `Tentu! Beritahu saya apa-apa lagi dan saya boleh mengemas kini laporan itu.`
    },
    zh: {
      hello: `你好，${user.fullName.split(' ')[0]}。我是 ScamBreaker 事件记录助手。`,
      instruction: `请告诉我发生了什么事情。请包含姓名、电话号码或网站等详细信息。这将帮助我将您的报告发送给正确的团队。`,
      error: `提交报告时出错。请重试。`,
      readyMessage: `我有足够的信息来创建您的报告。点击下面的按钮提交。`,
      submitBtn: `提交报告`,
      keepChattingReply: `当然可以！告诉我更多信息，我会更新报告。`
    },
    ta: {
      hello: `வணக்கம், ${user.fullName.split(' ')[0]}. நான் ScamBreaker சம்பவ பதிவு உதவியாளர்.`,
      instruction: `என்ன நடந்தது என்று சொல்லுங்கள். பெயர்கள், எண்கள் அல்லது இணையதளங்கள் போன்ற விவரங்களைச் சேர்க்கவும். உங்கள் அறிக்கையை சரியான குழுவிற்கு அனுப்ப இது உதவும்.`,
      error: `உங்கள் அறிக்கையை சமர்ப்பிக்கும் போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.`,
      readyMessage: `உங்கள் அறிக்கையை உருவாக்க என்னிடம் போதுமான தகவல் உள்ளது. சமர்ப்பிக்க கீழே உள்ள பொத்தானைக் கிளிக் செய்யவும்.`,
      submitBtn: `அறிக்கையை சமர்ப்பிக்கவும்`,
      keepChattingReply: `நிச்சயமாக! வேறு எதையும் சொல்லுங்கள், நான் அறிக்கையைப் புதுப்பிக்க முடியும்.`
    }
  }[language]), [language, user.fullName]);

  const handleSend = async () => {
    if ((!input.trim() && !ocrContext) || isProcessing || isConversationReady) return;

    const userMsg = input.trim() || 'Uploaded an evidence file.';
    const payloadContent = ocrContext ? `${userMsg}\n\n${ocrContext}` : userMsg;
    
    const newHistory = [...conversationHistory, { role: 'user' as const, content: payloadContent }];
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setConversationHistory(newHistory);
    setInput('');
    setOcrContext('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newHistory, language }),
      });

      if (!res.ok) {
        throw new Error('Chat API failed');
      }

      const data = await res.json();
      
      setConversationHistory(prev => [...prev, { role: 'assistant' as const, content: data.reply }]);

      if (data.isReady) {
        setPendingAnalysis(data.analysisJson);
        setIsConversationReady(true);
        setMessages(prev => [
          ...prev,
          { 
            role: 'ready_card', 
            content: null,
            analysisJson: data.analysisJson,
            actionSteps: data.actionSteps,
            riskLevel: data.riskLevel,
            fullReply: data.reply
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.reply }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t.error }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitReport = async () => {
    setIsProcessing(true);
    const rawDescription = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rawDescription,
          analysisJson: pendingAnalysis,
          uploadedFiles
        }),
      });

      if (!res.ok) {
        throw new Error('Case creation failed');
      }

      const data = await res.json();
      router.push(`/victim/report/success/${data.id}`);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t.error }
      ]);
      setIsProcessing(false);
    }
  };

  const handleKeepChatting = () => {
    setIsConversationReady(false);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: t.keepChattingReply }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      <div className="h-[72px] flex justify-between items-center px-8 border-b border-slate-200 bg-white flex-shrink-0 z-10">
        <div className="flex items-center">
          <Link href="/">
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500">
              ScamBreaker
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          <Link
            href="/victim/dashboard"
            className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel Report <X className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-y-auto">
        {/* Content Body: Chat Interface */}
        <div className="flex-grow flex flex-col relative max-w-4xl w-full mx-auto w-[100%]">
          
          {/* Chat Messages Area */}
          <div className="flex-grow overflow-y-auto px-8 py-8 space-y-8 flex flex-col pb-32">
            
            {/* Assistant Welcome Message */}
            <div className="flex items-start max-w-[85%]">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 border border-blue-200">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm max-w-2xl">
                <p className="text-[1.05rem] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {t.hello}
                </p>
                <p className="text-[1.05rem] text-slate-700 leading-relaxed mt-2 mb-4">
                  {t.instruction}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setLanguage('en')} className={`text-sm px-4 py-1.5 rounded-full border transition-all ${language === 'en' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>English</button>
                  <button onClick={() => setLanguage('ms')} className={`text-sm px-4 py-1.5 rounded-full border transition-all ${language === 'ms' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Bahasa Melayu</button>
                  <button onClick={() => setLanguage('zh')} className={`text-sm px-4 py-1.5 rounded-full border transition-all ${language === 'zh' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>中文 (Mandarin)</button>
                  <button onClick={() => setLanguage('ta')} className={`text-sm px-4 py-1.5 rounded-full border transition-all ${language === 'ta' ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>தமிழ்</button>
                </div>
              </div>
            </div>

            {messages.map((msg, idx) => (
              <div
                key={`msg-${idx}`}
                className={`flex items-start ${
                  msg.role === 'user' ? 'justify-end self-end text-right' : ''
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 border border-blue-200">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                )}

                {msg.role === 'ready_card' ? (
                  <ReadyStateCard 
                    analysisJson={msg.analysisJson}
                    fullReply={msg.fullReply || ''}
                    riskLevel={msg.riskLevel as any}
                    onSubmitReport={handleSubmitReport}
                    onKeepChatting={handleKeepChatting}
                    isSubmitting={isProcessing}
                  />
                ) : (
                  <>
                    {msg.role === 'system_reasoning' && (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-200">
                        <MoreHorizontal className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    
                    <div className={`mx-4 px-6 py-4 shadow-sm max-w-[85%] ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm text-left' 
                        : msg.role === 'system_reasoning'
                        ? ''
                        : 'bg-white border border-slate-200 rounded-2xl rounded-tl-sm text-slate-800'
                    }`}>
                      {typeof msg.content === 'string' ? (
                        <div className={`text-[1.05rem] leading-relaxed ${msg.role === 'assistant' ? 'font-medium' : ''}`}>
                          <FormattedMessage text={msg.content} />
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                        <span className="text-sm font-bold text-slate-500">{(user.fullName[0] || 'U').toUpperCase()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {isProcessing && !isConversationReady && (
              <div className="flex items-start max-w-[85%]">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 border border-blue-200">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                  <div className="flex space-x-2 items-center h-5">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Chat Input Area */}
          <div className="p-6 bg-[#f8fafc] bg-opacity-95 backdrop-blur sticky bottom-0">
            <AnimatePresence>
              {!isConversationReady && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="relative flex items-center bg-white border rounded-full shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all overflow-hidden p-2 border-slate-300"
                >
                  <EvidenceUploader 
                    onExtractionComplete={(text) => setOcrContext(text)} 
                    onFileUploaded={(name, dataUrl) => setUploadedFiles(prev => [...prev, { name, dataUrl }])}
                    language={language}
                  />
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Type here..." 
                    className="w-full bg-transparent px-3 py-3 text-[1.05rem] outline-none text-slate-800 placeholder-slate-400 disabled:bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button 
                    disabled={(!input.trim() && !ocrContext) || isProcessing}
                    onClick={handleSend}
                    className={`ml-2 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                      (input.trim() || ocrContext) && !isProcessing
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                ScamBreaker Assistant uses AI to interpret and route your initial case parameters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
