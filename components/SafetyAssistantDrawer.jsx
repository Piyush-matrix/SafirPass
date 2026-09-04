"use client";

import { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  HelpCircle,
  Siren,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const SUGGESTIONS = {
  en: [
    "I need emergency help now",
    "How do I trigger an SOS alert?",
    "Is this area safe for tourists?",
    "Lost my passport in India",
  ],
  hi: [
    "मुझे तुरंत आपातकालीन मदद चाहिए",
    "SOS अलर्ट कैसे चालू करें?",
    "क्या यह क्षेत्र सुरक्षित है?",
    "मेरा पासपोर्ट खो गया है",
  ],
  es: [
    "Necesito ayuda de emergencia ahora",
    "¿Cómo activo una alerta SOS?",
    "¿Es segura esta zona para turistas?",
    "Perdí mi pasaporte",
  ],
  fr: [
    "J'ai besoin d'une aide d'urgence maintenant",
    "Comment déclencher une alerte SOS ?",
    "Cette zone est-elle sûre ?",
    "J'ai perdu mon passeport",
  ],
};

export default function SafetyAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your SafirPass AI Safety Assistant powered by real-time safety services. How can I assist your travels today?",
      intent: "default",
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = { role: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to reach safety assistant.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || data.message || "Safety advisory received.",
          intent: data.intent,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Notice: ${err.message || "Could not connect to FastAPI safety service."} If you are in immediate danger, please dial 112 directly.`,
          intent: "emergency",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentSuggestions = SUGGESTIONS[language] || SUGGESTIONS.en;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            id="safety-assistant-fab"
            className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3.5 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
            aria-label="Open AI Safety Assistant"
          >
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
            </span>
            <ShieldAlert className="size-5 transition-transform group-hover:rotate-12" />
            <span className="text-sm font-semibold tracking-wide">Safety Assistant</span>
          </button>
        )}
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div
          id="safety-assistant-modal"
          className="fixed bottom-6 right-6 z-50 flex w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:w-[420px]"
          style={{ maxHeight: "calc(100vh - 5rem)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600/30 text-blue-400 ring-1 ring-blue-400/30">
                <ShieldAlert className="size-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">SafirPass Assistant</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                    FastAPI
                  </span>
                </div>
                <p className="text-xs text-slate-400">Multilingual Emergency Guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Picker */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs text-slate-200 outline-none hover:bg-slate-800"
                  aria-label="Select Language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                aria-label="Close Assistant"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs max-h-[380px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white shadow-sm"
                      : m.intent === "emergency"
                      ? "border border-red-200 bg-red-50 text-red-900"
                      : "border border-slate-100 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Quick Shortcut when Emergency Intent is Detected */}
                  {m.intent === "emergency" && (
                    <div className="mt-3 pt-2 border-t border-red-200 flex items-center gap-2">
                      <Link
                        href="/dashboard/sos"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 shadow-sm"
                      >
                        <Siren className="size-3.5" /> Trigger SOS Command
                      </Link>
                      <a
                        href="tel:112"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                      >
                        Call 112
                      </a>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 py-2">
                <Loader2 className="size-4 animate-spin text-blue-600" />
                <span className="text-xs">Analyzing safety query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Suggested Safety Prompts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currentSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask safety guidance or emergency steps..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40"
              aria-label="Send Message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
