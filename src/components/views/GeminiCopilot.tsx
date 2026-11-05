import React, { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../../context/EnergyContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getIdToken } from '../../services/firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundedIn?: string;
}

export const GeminiCopilot: React.FC = () => {
  const { activeFacility, metrics, anomalies } = useEnergy();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **EcoSmartX Gemini Energy Copilot**, connected directly to **${activeFacility.name}** telemetry.

Here is what I observe in your current facility profile:
- **Monthly Power:** ${metrics.facility.monthlyTotalKwh.toLocaleString()} kWh (~${activeFacility.currencySymbol}${metrics.facility.monthlyCost.toFixed(2)}/mo)
- **Grid Carbon Footprint:** ${metrics.facility.annualCo2Tonnes} MT CO₂e/year
- **Active Anomalies:** ${anomalies.filter(a => a.status === 'active').length} detected waste patterns (notably standby draws and peak coincide)

Ask me anything about load shifting, equipment retrofits, tariff optimization, or building standard benchmarks!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundedIn: 'deterministic_engine',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    `How can we shave 15% off our peak power demand during TOU hours?`,
    `Analyze our standby vampire drain and calculate payback for automated cutoff relays.`,
    `Which equipment category represents the largest cost driver in ${activeFacility.name}?`,
    `Recommend 3 high-ROI energy conservation measures for our floor area.`,
  ];

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    setErrorMessage(null);

    // Prepare facility context payload
    const facilityContext = {
      name: activeFacility.name,
      type: activeFacility.type,
      floorAreaSqM: activeFacility.floorAreaSqM,
      occupancy: activeFacility.occupancy,
      currencySymbol: activeFacility.currencySymbol,
      monthlyTotalKwh: metrics.facility.monthlyTotalKwh,
      monthlyCost: metrics.facility.monthlyCost,
      annualCo2Tonnes: metrics.facility.annualCo2Tonnes,
      standbyWasteMonthlyKwh: metrics.facility.standbyWasteMonthlyKwh,
      standbyWasteMonthlyCost: metrics.facility.standbyWasteMonthlyCost,
      categoryBreakdown: metrics.facility.categoryBreakdown,
      activeAnomalies: anomalies
        .filter(a => a.status === 'active')
        .map(a => ({ title: a.title, deviation: a.deviation, cost: a.estimatedMonthlyWasteCost })),
    };

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          facilityId: activeFacility.id,
          facilityContext: {
            ...facilityContext,
            id: activeFacility.id,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply || 'No response returned from Copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundedIn: data.groundedIn,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to chat with copilot:', err);
      setErrorMessage(
        'Could not complete request with Gemini API. Showing deterministic operational guidance.'
      );
      // Fallback offline message
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `**Deterministic Operational Guidance for ${activeFacility.name}:**\n\n- **Peak Demand:** Shifting loads outside 13:00–19:00 can reduce your monthly demand charge by up to ${activeFacility.currencySymbol}${(activeFacility.tariff.demandChargePerKw || 12) * 5}/mo.\n- **Standby Isolation:** Cutting overnight phantom draw can recover ~${metrics.facility.standbyWasteMonthlyKwh} kWh/month.\n\n*Note: To enable live Gemini conversational reasoning, ensure GEMINI_API_KEY is configured in your project secrets.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundedIn: 'deterministic_fallback',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">Gemini Energy Copilot</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded building energy advisor for <strong>{activeFacility.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Server-Side Grounded AI (No Client Secrets)</span>
        </div>
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-inner">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs shadow-md ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-slate-850 border border-slate-750 text-slate-200 rounded-bl-none'
              }`}
            >
              <div className="space-y-1.5 leading-relaxed">
                {msg.content.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-1" />;
                  if (trimmed.startsWith('### ')) {
                    return (
                      <h4 key={idx} className="font-bold text-sm text-emerald-400 mt-2 mb-1">
                        {trimmed.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    const text = trimmed.substring(2);
                    return (
                      <div key={idx} className="flex items-start gap-1.5 pl-1">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>
                          {text.split(/(\*\*.*?\*\*)/g).map((part, pIdx) =>
                            part.startsWith('**') && part.endsWith('**') ? (
                              <strong key={pIdx} className="text-white font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      </div>
                    );
                  }
                  if (/^\d+\.\s/.test(trimmed)) {
                    return (
                      <div key={idx} className="font-semibold text-slate-100 mt-1.5 pl-0.5">
                        {trimmed.split(/(\*\*.*?\*\*)/g).map((part, pIdx) =>
                          part.startsWith('**') && part.endsWith('**') ? (
                            <strong key={pIdx} className="text-emerald-300 font-bold">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            part
                          )
                        )}
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-300">
                      {line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) =>
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={pIdx} className="text-white font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-750/60 text-[10px] opacity-70">
                <span>{msg.timestamp}</span>
                {msg.groundedIn && (
                  <span className="italic">
                    Grounded in: {msg.groundedIn.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-850 border border-slate-750 rounded-2xl rounded-bl-none p-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Gemini is analyzing facility telemetry & evaluating energy equations...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition-colors text-[11px]"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-slate-900 border border-slate-750 rounded-2xl p-2 shrink-0 shadow-xl focus-within:border-indigo-500 transition-colors"
      >
        <input
          type="text"
          placeholder="Ask Copilot about tariffs, load shifting, HVAC setback, equipment retrofits..."
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md"
          aria-label="Send message to Copilot"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
