import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Send, Bot, User, RefreshCw, Copy, Check, AlertCircle, ArrowUpRight } from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

export const AIAssistantView: React.FC = () => {
  const { gym } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello **${gym?.ownerName || 'Marcus'}**! I am your **GymFlow AI Business & Retention Copilot** 🤖.\n\nI have real-time access to your gym's member database, upcoming expiry schedules, monthly revenue numbers, attendance patterns, and membership plans.\n\nHow can I help you optimize **${gym?.name || 'IronPulse Fitness Club'}** today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'GymFlow Copilot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Who is expiring this week and needs a reminder?',
    'Draft a 10% discount WhatsApp renewal message for expired members',
    'Summarize our revenue, collections and pending balances',
    'What are our peak attendance hours and daily attendance rate?',
    'Give me a 4-day workout & nutrition split for members',
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.askAI(text.trim());
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply || "I've analyzed your gym records and here are the insights.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: (res as any).source || 'GymFlow AI',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.error('AI assistant request failed:', e);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `### ⚠️ Connection Notice\n\nI was unable to connect to the cloud engine, but here is a quick summary for **${gym?.name || 'your gym'}**:\n\n- You can manage expiring memberships directly in the **Members** or **Expiry Calendar** tabs.\n- Review unpaid balances under **Payments**.\n- Check today's check-ins in the **Attendance** section.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'GymFlow Local',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-xl bg-[#141414] border border-[#262626] shadow-sm overflow-hidden font-sans">
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white font-sans">
                GymFlow AI Business & Retention Copilot
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Live Data Connected
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Instant retention intelligence, revenue analysis, WhatsApp copy generation, & workout programming
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: '1',
                sender: 'assistant',
                text: `Chat reset. What would you like to analyze or draft for **${gym?.name || 'IronPulse Fitness'}**?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                source: 'GymFlow Copilot',
              },
            ])
          }
          className="p-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 font-sans bg-[#0a0a0a]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-medium ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#141414] border border-[#262626] text-gray-200 shadow-sm'
              }`}
            >
              {m.sender === 'assistant' ? (
                <div className="space-y-2 prose prose-invert max-w-none text-xs sm:text-sm prose-p:my-1 prose-headings:text-white prose-code:text-indigo-300 prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[#262626]">
                  <Markdown>{m.text}</Markdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#262626]/40 text-[10px] font-mono">
                {m.source ? (
                  <span className="text-indigo-400/80 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                    {m.source}
                  </span>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  {m.sender === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(m.text, m.id)}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                  <span
                    className={
                      m.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
                    }
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl text-xs text-gray-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Analyzing real-time gym database metrics & formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2.5 bg-[#0d0d0d] border-t border-[#262626] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider shrink-0 font-medium">
          Suggested Prompts:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 rounded-md bg-[#141414] border border-[#262626] hover:border-indigo-500 hover:text-white text-gray-300 text-xs shrink-0 transition-colors cursor-pointer font-sans whitespace-nowrap flex items-center gap-1"
          >
            <span>{prompt}</span>
            <ArrowUpRight className="w-3 h-3 text-gray-500" />
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-[#141414] border-t border-[#262626]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about expiring members, draft WhatsApp scripts, analyze revenue, or ask fitness advice..."
            className="flex-1 px-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Send prompt"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
