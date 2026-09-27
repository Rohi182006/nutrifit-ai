import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../api/client';
import {
  MessageSquare, Sparkles, Search, Send, ShieldAlert,
  Bot, User as UserIcon, CheckCircle2, Award, ArrowRight
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  recommendedFoods?: any[];
  disclaimer?: string;
  time: string;
}

export const AssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'nlp_search'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I'm your NutriFit AI Assistant. I can help recommend verified protein foods based on your dietary boundaries and regional cuisine preferences. How can I assist your nutrition routine today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      disclaimer: "NutriFit AI is a general wellness platform and does not provide medical diagnoses or prescriptions."
    }
  ]);

  // NLP Semantic Search state
  const [nlpQuery, setNlpQuery] = useState('high protein vegetarian food');
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState<any>(null);

  const { showToast } = useStore();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: nowTime }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data } = await api.post('/assistant/chat', {
        message: userMsg,
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
          recommendedFoods: data.recommended_foods,
          disclaimer: data.disclaimer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err: any) {
      showToast('Assistant unavailable', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleNlpSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery || nlpQuery;
    if (!query.trim()) return;

    setNlpLoading(true);
    try {
      const { data } = await api.post('/assistant/search', {
        query,
        limit: 8
      });
      setNlpResult(data);
    } catch (err) {
      showToast('Semantic search failed', 'error');
    } finally {
      setNlpLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Verified RAG &amp; NLP Search Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Nutrition <span className="text-gradient">Assistant &amp; NLP</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Retrieve verified nutritional data from IFCT/USDA, extract conversational food intents, and search with cosine similarity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            RAG Chatbot
          </button>
          <button
            onClick={() => { setActiveTab('nlp_search'); if (!nlpResult) handleNlpSearch(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'nlp_search'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NLP Semantic Search
          </button>
        </div>
      </div>

      {/* Medical Boundary Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300/90 leading-relaxed">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong className="text-amber-200">Clinical Boundary:</strong> NutriFit AI strictly respects medical safety guardrails. When condition-specific or clinical treatment topics (such as diabetes, cure, hypertension) are detected, the assistant safely redirects queries to qualified physicians or registered dietitians.
        </div>
      </div>

      {activeTab === 'chat' ? (
        /* CHATBOT INTERFACE */
        <div className="glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-white rounded-2xl rounded-tr-none p-4'
                    : 'glass-card border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none p-5'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {/* Grounded Food Cards from DB */}
                  {m.recommendedFoods && m.recommendedFoods.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      {m.recommendedFoods.map((f: any) => (
                        <div key={f.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                          <span className="font-bold text-white block">{f.name}</span>
                          <span className="text-emerald-400 font-bold block">{f.protein_g}g Protein</span>
                          <span className="text-[11px] text-slate-400 block">{f.calories} kcal • {f.serving_description}</span>
                          <span className="text-[10px] text-cyan-400 block">Source: {f.source}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.disclaimer && (
                    <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 italic">
                      {m.disclaimer}
                    </p>
                  )}

                  <span className="text-[10px] text-slate-500 block text-right">{m.time}</span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Retrieving verified nutrition database &amp; formulating advice...</span>
              </div>
            )}
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about vegetarian protein options, lentils, or post-workout recovery foods..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      ) : (
        /* NLP SEMANTIC FOOD SEARCH (Section 12 & 30) */
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                Natural Language Intent &amp; Cosine Similarity Search
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Type queries naturally such as <em>"South Indian protein sources"</em>, <em>"high protein vegetarian food"</em>, or <em>"protein foods without dairy"</em>.
              </p>
            </div>

            <form onSubmit={(e) => handleNlpSearch(e)} className="flex gap-2">
              <input
                type="text"
                value={nlpQuery}
                onChange={(e) => setNlpQuery(e.target.value)}
                placeholder="e.g. high protein vegetarian food without dairy"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={nlpLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-xs shadow-md shadow-cyan-500/20"
              >
                {nlpLoading ? 'Analyzing...' : 'Analyze & Search'}
              </button>
            </form>

            {/* Quick Preset Queries */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Try queries:</span>
              {[
                "high protein vegetarian food",
                "South Indian protein sources",
                "protein foods without dairy",
                "vegan snacks high in fiber"
              ].map(q => (
                <button
                  type="button"
                  key={q}
                  onClick={() => { setNlpQuery(q); handleNlpSearch(undefined, q); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] transition-colors"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* NLP Analysis Breakdown */}
          {nlpResult && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  NLP Extracted Features:
                </span>
                <span className="text-xs font-bold text-cyan-400">
                  {nlpResult.results_count} semantically matched foods
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {nlpResult.nlp_analysis?.diet && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                    Diet: {nlpResult.nlp_analysis.diet}
                  </span>
                )}
                {nlpResult.nlp_analysis?.cuisine && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold">
                    Cuisine: {nlpResult.nlp_analysis.cuisine}
                  </span>
                )}
                {nlpResult.nlp_analysis?.exclude_category && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold">
                    Exclude: {nlpResult.nlp_analysis.exclude_category}
                  </span>
                )}
                {nlpResult.nlp_analysis?.min_protein && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold">
                    Min Protein: {nlpResult.nlp_analysis.min_protein}g
                  </span>
                )}
              </div>

              {/* Matched Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {nlpResult.results.map((f: any) => (
                  <div key={f.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">{f.category}</span>
                      <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {f.similarity_score}% Cosine Similarity
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">{f.name}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-emerald-400">{f.protein_g}g Protein</span>
                      <span className="text-slate-400">• {f.calories} kcal</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      {f.diet_type} • {f.cuisine} cuisine • Source: {f.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
