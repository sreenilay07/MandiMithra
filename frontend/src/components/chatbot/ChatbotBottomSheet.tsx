import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { chatbotApi } from '../../services/api/chatbot.api';
import { useLanguageStore } from '../../store/useLanguageStore';
import { t } from '../../services/i18n';

interface MessageItem {
  sender: 'user' | 'bot';
  text: string;
}

export const ChatbotBottomSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'bot',
      text: 'Namaste! I am your MandiMithra Assistant. How can I help you today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentLang } = useLanguageStore();

  const suggestedQuestions = [
    'What documents should I bring?',
    'When should I leave home?',
    'What is my waiting time?',
    'What stage is my procurement in?'
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const newMessages: MessageItem[] = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await chatbotApi.sendMessage(query, currentLang);
      setMessages([...newMessages, { sender: 'bot', text: res.data?.reply || 'Information unavailable.' }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'bot', text: 'Unable to reach assistant. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-amber-600 hover:bg-amber-700 text-white p-3.5 rounded-full shadow-lg flex items-center space-x-2 border-2 border-white tap-target cursor-pointer transition-transform hover:scale-105"
        title="MandiMithra Help Assistant"
      >
        <MessageSquare size={22} />
        <span className="font-bold text-sm hidden sm:inline">Help / సహాయం</span>
      </button>

      {/* Bottom Sheet / Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px] border border-slate-300 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-600 rounded-lg text-white">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">{t('chatbot_title')}</h3>
                  <p className="text-xs text-slate-300">{t('chatbot_subtitle')}</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2 ${
                    msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      msg.sender === 'user' ? 'bg-blue-900 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold p-2">
                  <Bot size={16} className="animate-spin text-amber-600" />
                  <span>Fetching information...</span>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="p-2.5 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap flex space-x-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-full border border-slate-300 shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ask_question')}
                className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 border border-slate-300"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputMessage.trim()}
                className="p-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white rounded-lg cursor-pointer"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
