import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Brain, Trash2, ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { api } from '../api/client';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

export const AiCoachPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Can I substitute barbell bench press with dumbbells?',
    'How should I pace the 1km runs between HYROX stations?',
    'What should I eat 90 minutes before a heavy leg workout?',
    'My shoulder clicks during overhead press. What can I do?',
    'How do I bridge from standard pull-ups to muscle-up?',
    'Explain the double-progression overload rule for calisthenics.',
  ];

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.chat.getHistory();
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        // Welcoming opening message
        setMessages([
          {
            id: 0,
            role: 'assistant',
            content: `Hello ${user?.username || 'Athlete'}! I am **KRIDA AI Coach**, your dedicated sports science and athletic conditioning mentor.\n\nI have access to your saved profile, training history, and evidence-based strength & conditioning literature. Ask me about exercise execution, load progressions, meal timing, or HYROX transition strategies.\n\n*Note: I am designed for educational athletic guidance. For clinical medical diagnosis or acute injuries, please consult a qualified healthcare physician.*`,
            sources: [
              { title: 'KRIDA Sports Science & Exercise Physiology Corpus', category: 'Biomechanics', score: '1.0' },
              { title: 'National Strength & Conditioning Association (NSCA) Guidelines', category: 'Strength', score: '0.95' }
            ],
            created_at: 'Just now',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      sources: [],
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await api.chat.send(text);
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.reply,
        sources: res.sources || [],
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorContent = err.status === 429
        ? 'Rate limit reached: To ensure optimal server performance, please wait a minute before sending your next inquiry.'
        : 'I encountered a brief connection issue. Please verify your connection or try again shortly.';
      
      setErrorMessage(errorContent);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        sources: [],
        created_at: 'Now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your conversation history?')) return;
    try {
      await api.chat.clearHistory();
      setMessages([
        {
          id: Date.now(),
          role: 'assistant',
          content: 'Chat history cleared. How can I assist your athletic preparation today?',
          sources: [],
          created_at: 'Just now',
        },
      ]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pb-12 flex flex-col h-[calc(100vh-130px)]">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D7FF43]/10 border border-[#D7FF43]/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#D7FF43]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#D7FF43] uppercase tracking-wider font-mono">
                10 · RAG SPORTS COACH
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#D7FF43]/15 text-[#D7FF43] border border-[#D7FF43]/30">
                ACTIVE
              </span>
            </div>
            <h1 className="text-xl font-black text-white">AI Fitness & Conditioning Coach</h1>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 bg-[#0e1113] border border-[#1d2327] hover:border-rose-500/30 transition-colors"
          title="Clear Conversation History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* MEDICAL & AI SAFETY DISCLAIMER BANNER */}
      <div className="p-3 rounded-2xl bg-[#0e1113] border border-amber-500/30 flex items-start gap-2.5 text-xs text-zinc-400 shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Safety & Medical Guardrails: </span>
          <span>
            KRIDA AI offers educational sports conditioning and biomechanical advice. It does not provide medical diagnoses, treatment, or injury rehab prescriptions. If you experience severe chest pain, syncope, acute tears, or severe breathlessness, cease training immediately and seek professional emergency medical help.
          </span>
        </div>
      </div>

      {/* CHAT TRANSCRIPT WINDOW */}
      <div className="flex-1 bg-[#0e1113] border border-[#1d2327] rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#D7FF43] border-t-transparent animate-spin" />
            <span>Retrieving private conversation history...</span>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#D7FF43] text-black shadow-md'
                      : 'bg-[#121618] text-[#D7FF43] border border-[#1d2327]'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4 stroke-[2.5]" /> : <Brain className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl space-y-2 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#1a2211] border border-[#3d4f1f] text-white rounded-tr-none'
                      : 'bg-[#121618] border border-[#1d2327] text-zinc-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line text-[13px]">{m.content}</div>

                  {/* RAG Citations badges */}
                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="font-semibold text-zinc-500">Retrieved Evidence Sources:</span>
                      {m.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-black/40 text-[#D7FF43] border border-[#D7FF43]/20 font-mono"
                        >
                          {s.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 text-right font-mono">{m.created_at}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-[#121618] text-[#D7FF43] border border-[#1d2327] flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3 rounded-2xl bg-[#121618] border border-[#D7FF43]/30 text-xs text-[#D7FF43] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7FF43] animate-ping" />
              <span>KRIDA AI Coach is synthesizing biomechanical response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED PROMPTS PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs shrink-0">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-[#0e1113] hover:bg-[#121618] border border-[#1d2327] hover:border-[#D7FF43]/40 text-zinc-400 hover:text-white whitespace-nowrap transition-colors shrink-0 text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* INPUT BAR */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask KRIDA anything about exercise technique, recovery, Indian diet, or 5K pacing..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-[#0e1113] border border-[#1d2327] text-white text-xs focus:outline-none focus:border-[#D7FF43] transition-colors"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isTyping || !inputMessage.trim()}
            className="px-6 py-3.5 rounded-2xl bg-[#D7FF43] hover:bg-[#cbf532] text-black font-black text-xs flex items-center gap-2 disabled:opacity-40 transition-all shrink-0 shadow-md shadow-[#D7FF43]/10"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Ask Coach</span>
          </button>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between px-1">
          <span>🎯 Domain Scope: Gym training, calisthenics, HYROX, sports nutrition & recovery only.</span>
          <span className="hidden sm:inline text-zinc-600">Strictly answers according to given question</span>
        </div>
      </div>
    </div>
  );
};
