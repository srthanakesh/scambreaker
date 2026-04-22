'use client';

import { useState } from 'react';
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
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: React.ReactNode}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ms' | 'zh' | 'ta'>('en');

  const t = {
    en: {
      hello: `Hello, ${user.fullName.split(' ')[0]}. I am the ScamBreaker incident intake assistant.`,
      instruction: `Please tell me what happened. Include any details like names, numbers, or websites. This helps me send your report to the right team.`,
      error: `An error occurred while submitting your report. Please try again.`,
    },
    ms: {
      hello: `Helo, ${user.fullName.split(' ')[0]}. Saya ialah pembantu penerimaan insiden ScamBreaker.`,
      instruction: `Sila beritahu saya apa yang berlaku. Sertakan butiran seperti nama, nombor, atau laman web. Ini membantu saya menghantar laporan anda ke pasukan yang betul.`,
      error: `Ralat berlaku semasa menghantar laporan anda. Sila cuba lagi.`,
    },
    zh: {
      hello: `你好，${user.fullName.split(' ')[0]}。我是 ScamBreaker 事件记录助手。`,
      instruction: `请告诉我发生了什么事情。请包含姓名、电话号码或网站等详细信息。这将帮助我将您的报告发送给正确的团队。`,
      error: `提交报告时出错。请重试。`,
    },
    ta: {
      hello: `வணக்கம், ${user.fullName.split(' ')[0]}. நான் ScamBreaker சம்பவ பதிவு உதவியாளர்.`,
      instruction: `என்ன நடந்தது என்று சொல்லுங்கள். பெயர்கள், எண்கள் அல்லது இணையதளங்கள் போன்ற விவரங்களைச் சேர்க்கவும். உங்கள் அறிக்கையை சரியான குழுவிற்கு அனுப்ப இது உதவும்.`,
      error: `உங்கள் அறிக்கையை சமர்ப்பிக்கும் போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.`,
    }
  }[language];

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawDescription: userMsg }),
      });

      if (!res.ok) {
        let errorMsg = t.error;
        try {
          const data = await res.json();
          if (data?.error) errorMsg = data.error;
        } catch (e) {}
        
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: errorMsg }
        ]);
        setIsProcessing(false);
        return;
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

  return (
    <div className="fixed inset-0 z-50 flex bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      
      {/* Left Sidebar Steps */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-transparent cursor-pointer">
          <Link href="/">
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500">ScamBreaker</span>
          </Link>
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
              { num: 2, label: 'Next Steps' },
              { num: 3, label: 'Review' },
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

        {/* Content Body: Chat Interface */}
        <div className="flex-grow flex flex-col relative max-w-4xl w-full mx-auto w-[100%]">
          
          {/* Chat Messages Area */}
          <div className="flex-grow overflow-y-auto px-8 py-8 space-y-8 flex flex-col">
            
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

            {/* Render dynamic chat history */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start ${msg.role === 'user' ? 'justify-end self-end text-right' : ''}`}>
                
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 border border-blue-200">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                )}

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
                    <p className={`text-[1.05rem] leading-relaxed ${msg.role === 'assistant' ? 'font-medium' : ''}`}>
                      {msg.content}
                    </p>
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <span className="text-sm font-bold text-slate-500">{(user.fullName[0] || 'U').toUpperCase()}</span>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
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
            <div className={`relative flex items-center bg-white border rounded-full shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all overflow-hidden p-2 ${isProcessing ? 'border-slate-200 opacity-70' : 'border-slate-300'}`}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Type here..." 
                className="w-full bg-transparent px-5 py-3 text-[1.05rem] outline-none text-slate-800 placeholder-slate-400 disabled:bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                disabled={!input.trim() || isProcessing}
                onClick={handleSend}
                className={`ml-2 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                  input.trim() && !isProcessing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
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
