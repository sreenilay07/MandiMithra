import React, { useState } from 'react';
import { X, Bot, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../locales/translations';

interface PresetQuestion {
  id: string;
  category: string;
  q: { en: string; te: string; hi: string };
  a: { en: string; te: string; hi: string };
}

const PRESET_FAQ: PresetQuestion[] = [
  {
    id: 'leave',
    category: 'Departure',
    q: {
      en: 'When should I leave for the centre?',
      te: 'నేను ఎప్పుడు బయలుదేరాలి?',
      hi: 'मुझे केंद्र के लिए कब निकलना चाहिए?'
    },
    a: {
      en: 'Your recommended departure time is calculated by subtracting travel time and safety buffer from your estimated turn time. Check your dashboard card for the live recommended departure timestamp.',
      te: 'మీ అంచనా తంతు సమయం నుండి ప్రయాణ సమయాన్ని మరియు భద్రతా సమయాన్ని తగ్గించడం ద్వారా మీ బయలుదేరే సమయం లెక్కించబడుతుంది. మీ డాష్‌బోర్డ్ కార్డ్‌ని పరిశీలించండి.',
      hi: 'आपकी अनुशंसित प्रस्थान समय की गणना आपके अनुमानित मोड़ समय से यात्रा के समय को घटाकर की जाती है। कृपया अपने डैशबोर्ड पर देखें।'
    }
  },
  {
    id: 'wait_time',
    category: 'Queue',
    q: {
      en: 'How is my estimated wait time calculated?',
      te: 'నా వేచి ఉండే సమయం ఎలా లెక్కించబడుతుంది?',
      hi: 'मेरे प्रतीक्षा समय की गणना कैसे की जाती है?'
    },
    a: {
      en: 'Wait time is calculated as (Total Workload Ahead in KG) divided by (Effective Processing Capacity in KG/hr). It updates live on every stage completion or capacity change.',
      te: 'వేచి ఉండే సమయం = (ముందున్న మొత్తం పనిభారం కేజీలలో) / (కేంద్ర సమర్థ సామర్థ్యం). ఇది క్యూ నవీకరించబడిన ప్రతిసారీ ప్రత్యక్షంగా నవీకరించబడుతుంది.',
      hi: 'प्रतीक्षा समय की गणना (आगे का कुल कार्यभार किलो में) / (केंद्र की प्रसंस्करण क्षमता) के रूप में की जाती है।'
    }
  },
  {
    id: 'documents',
    category: 'Documents',
    q: {
      en: 'What documents do I need to bring?',
      te: 'నేను ఏ పత్రాలను తీసుకురావాలి?',
      hi: 'मुझे कौन से दस्तावेज़ लाने की आवश्यकता है?'
    },
    a: {
      en: 'Please carry: 1) Original Aadhaar Card, 2) Bank Passbook, 3) Pattadar Passbook / Land Reference, 4) Procurement Booking Token.',
      te: 'దయచేసి వీటిని తీసుకురండి: 1) ఆధార్ కార్డ్, 2) బ్యాంక్ పాస్‌బుక్, 3) పట్టాదారు పాస్‌బుక్, 4) సేకరణ బుకింగ్ టోకెన్.',
      hi: 'कृपया लाएं: 1) मूल आधार कार्ड, 2) बैंक पासबुक, 3) भूमि पासबुक, 4) खरीद बुकिंग टोकन।'
    }
  },
  {
    id: 'stages',
    category: 'Stages',
    q: {
      en: 'What are the 7 procurement stages?',
      te: '7 సేకరణ దశలు ఏమిటి?',
      hi: '7 खरीद चरण क्या हैं?'
    },
    a: {
      en: 'The 7 sequential stages are: 1. Maturity Test, 2. Bags Allocation, 3. Bags Filling, 4. Bags Stitching, 5. Weight, 6. Loading to Lorry, 7. Documents Submission.',
      te: '7 క్రమానుగత దశలు: 1. పరిపక్వత పరీక్ష, 2. సంచుల కేటాయింపు, 3. నింపడం, 4. కుట్టడం, 5. తూకం, 6. లోడింగ్, 7. పత్రాల సమర్పణ.',
      hi: '7 क्रमिक चरण हैं: 1. परिपक्वता परीक्षण, 2. बोरी आवंटन, 3. भराई, 4. सिलाई, 5. तौल, 6. लोडिंग, 7. दस्तावेज़ जमा।'
    }
  },
  {
    id: 'booking',
    category: 'Booking',
    q: {
      en: 'How do I book a procurement slot?',
      te: 'నేను స్లాట్‌ను ఎలా బుక్ చేయాలి?',
      hi: 'मैं स्लॉट कैसे बुक करूं?'
    },
    a: {
      en: 'Click on "Book Procurement Slot" from your dashboard, select your crop, enter expected quantity in KG, choose procurement centre & preferred date.',
      te: 'మీ డాష్‌బోర్డ్ నుండి "స్లాట్ బుక్ చేయండి" క్లిక్ చేయండి, పంటను ఎంచుకోండి, పరిమాణాన్ని కేజీలలో నమోదు చేయండి.',
      hi: 'अपने डैशबोर्ड से "स्लॉट बुक करें" पर क्लिक करें, अपनी फसल चुनें, और मात्रा दर्ज करें।'
    }
  }
];

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useTranslation();

  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: t('chatbotSubtitle') || 'Hello! Welcome to MandiMithra Help Desk. Select a topic or question below.'
    }
  ]);

  const handleSelectQuestion = (item: PresetQuestion) => {
    const lang = (language as 'en' | 'te' | 'hi') || 'en';
    const userQ = item.q[lang] || item.q.en;
    const botA = item.a[lang] || item.a.en;

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userQ },
      { sender: 'bot', text: botA }
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 bg-emerald-800 hover:bg-emerald-900 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 border-2 border-emerald-400 cursor-pointer transition-transform hover:scale-105"
        title="MandiMithra Help Assistant"
      >
        <Bot size={22} />
        <span className="text-xs font-black hidden sm:inline">MandiMithra Help</span>
      </button>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[520px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-emerald-900 text-white p-3.5 flex items-center justify-between border-b border-emerald-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-sm border border-emerald-400">
                🤖
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-none">{t('chatbotTitle')}</h4>
                <p className="text-[10px] text-emerald-300 font-medium mt-0.5">Rule-Based Deterministic Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-300 hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl font-medium leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-800 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Preset Questions Selector */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <HelpCircle size={12} className="text-emerald-700" /> Frequently Asked Questions:
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {PRESET_FAQ.map((item) => {
                const lang = (language as 'en' | 'te' | 'hi') || 'en';
                const questionText = item.q[lang] || item.q.en;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectQuestion(item)}
                    className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors truncate"
                  >
                    💡 {questionText}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
