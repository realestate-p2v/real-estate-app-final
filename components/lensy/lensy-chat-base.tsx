"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
  User,
  Bot,
} from "lucide-react";

// ============================================================
// LENSY CHAT BASE
// Shared UI shell used by all three Lensy variants.
// Handles: streaming, message display, input, animations.
// Each variant passes its own config for theming + behavior.
// ============================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  buttons?: string[]; // Parsed from [BUTTONS: a | b | c] in AI response
}

// Parse [BUTTONS: opt1 | opt2 | opt3] from AI response
// Handles: case variations, extra whitespace, newlines, trailing text after tag
function parseButtons(text: string): { clean: string; buttons: string[] } {
  const patterns = [
    /\[BUTTONS:\s*(.+?)\]\s*$/si,   // Standard — end of message (case-insensitive)
    /\[BUTTONS:\s*(.+?)\]/si,       // Anywhere in message
  ];

  for (const pattern of patterns) {
    // Find the LAST match in case there are multiple
    const allMatches = [...text.matchAll(new RegExp(pattern.source, pattern.flags + "g"))];
    const match = allMatches[allMatches.length - 1];
    if (match) {
      const clean = text.replace(match[0], "").trim();
      const buttons = match[1]
        .split("|")
        .map((b) => b.trim())
        .filter((b) => b.length > 0 && b.length < 60);
      if (buttons.length >= 2 && buttons.length <= 6) {
        return { clean, buttons };
      }
    }
  }

  return { clean: text, buttons: [] };
}

// Render message content with clickable links
// NOTE: We avoid using regex.test() with a global regex to prevent lastIndex bugs.
function renderMessageContent(text: string): React.ReactNode {
  // Split on URLs — non-global split avoids the lastIndex gotcha
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    // Check if this part looks like a URL (starts with http)
    if (/^https?:\/\//.test(part)) {
      // Clean trailing punctuation from URL
      const cleanUrl = part.replace(/[.,;:!?)]+$/, "");
      const trailing = part.slice(cleanUrl.length);
      // Show a friendly label instead of the full URL
      let label = "Visit Link";
      if (cleanUrl.includes("/order")) label = "Order a Video";
      else if (cleanUrl.includes("/lens#pricing")) label = "View Pricing";
      else if (cleanUrl.includes("/lens/coach") || cleanUrl.includes("lens/coach")) label = "Open Photo Coach";
      else if (cleanUrl.includes("/lens/descriptions") || cleanUrl.includes("lens/descriptions")) label = "Open Description Writer";
      else if (cleanUrl.includes("/lens/design-studio") || cleanUrl.includes("lens/design-studio")) label = "Open Design Studio";
      else if (cleanUrl.includes("/lens/staging") || cleanUrl.includes("lens/staging")) label = "Open Virtual Staging";
      else if (cleanUrl.includes("/properties")) label = "Open Property Portfolio";
      else if (cleanUrl.includes("/settings")) label = "Account Settings";
      else if (cleanUrl.includes("/lens")) label = "View P2V Lens";

      return (
        <span key={i}>
          <a
            href={cleanUrl}
            target={cleanUrl.includes("realestatephoto2video.com") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-500 underline underline-offset-2 decoration-sky-400/40 hover:decoration-sky-500/60 font-medium transition-colors"
          >
            {label}
            {!cleanUrl.includes("realestatephoto2video.com") && (
              <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export interface LensyChatBaseConfig {
  // Identity
  variant: "sales" | "support" | "agent";
  headerLabel: string;
  greeting: string;
  suggestions: string[];
  placeholder: string;

  // Theming
  bubbleGradient: string;
  headerBg: string;
  accentLight: string;
  accentButton: string;

  // API payload extras (merged into every request)
  apiPayload: Record<string, any>;

  // Footer text (optional, shown below input)
  footerText?: string;

  // Position
  position?: "bottom-right" | "bottom-left";
  initialOpen?: boolean;

  // After-message actions (optional, rendered after assistant messages)
  renderActions?: (messageCount: number, isStreaming: boolean) => React.ReactNode;
}

export function LensyChatBase({ config }: { config: LensyChatBaseConfig }) {
  const [isOpen, setIsOpen] = useState(config.initialOpen || false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setShowSuggestions(false);
      setIsStreaming(true);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortRef.current = new AbortController();

        const response = await fetch("/api/lensy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            conversationId,
            variant: config.variant,
            ...config.apiPayload,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error("Failed to get response");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) continue;
              if (data.conversationId) setConversationId(data.conversationId);
              if (data.text) {
                fullText += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullText,
                  };
                  return updated;
                });
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "I'm having trouble connecting right now. Please try again in a moment.",
          };
          return updated;
        });
      } finally {
        // Parse buttons from the final response
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && last.content) {
            const { clean, buttons } = parseButtons(last.content);
            if (buttons.length > 0) {
              updated[updated.length - 1] = { ...last, content: clean, buttons };
            }
          }
          return updated;
        });
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, conversationId, config]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const positionClass =
    (config.position || "bottom-right") === "bottom-right"
      ? "right-4 sm:right-6"
      : "left-4 sm:left-6";

  const assistantCount = messages.filter((m) => m.role === "assistant").length;

  return (
    <>
      {/* ═══ CHAT WINDOW ═══ */}
      {isOpen && (
        <div
          className={`fixed bottom-20 sm:bottom-24 ${positionClass} z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[85vh] sm:max-h-[840px] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden`}
          style={{ animation: "lensySlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Header */}
          <div className={`${config.headerBg} px-4 py-3 flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{config.headerLabel}</p>
                <p className="text-white/70 text-[11px]">
                  {isStreaming ? (
                    <span className="inline-flex items-center gap-1">
                      Typing
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce inline-block" style={{ animationDelay: "0ms", animationDuration: "1s" }}>.</span>
                        <span className="animate-bounce inline-block" style={{ animationDelay: "200ms", animationDuration: "1s" }}>.</span>
                        <span className="animate-bounce inline-block" style={{ animationDelay: "400ms", animationDuration: "1s" }}>.</span>
                      </span>
                    </span>
                  ) : "Online"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-background/50">
            {/* Greeting */}
            {messages.length === 0 && (
              <div className="flex gap-2.5" style={{ animation: "lensyFadeIn 0.4s ease-out" }}>
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-sm text-foreground leading-relaxed">{config.greeting}</p>
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && !msg.content && isStreaming ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {renderMessageContent(msg.content)}
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Tappable buttons parsed from AI response — staggered fade-in */}
                {msg.buttons && msg.buttons.length > 0 && !isStreaming && (
                  <div className="flex gap-2.5 mt-2.5">
                    <div className="w-7 shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {msg.buttons.map((btn, j) => (
                        <button
                          key={j}
                          onClick={() => sendMessage(btn)}
                          className={`text-sm px-4 py-2.5 rounded-xl border font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.03] active:scale-[0.97] ${config.accentLight} hover:opacity-90`}
                          style={{
                            animation: `lensyButtonIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${j * 80}ms both`,
                          }}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Custom actions from variant */}
            {config.renderActions && !isStreaming && assistantCount > 0 && (
              <div className="flex gap-2.5">
                <div className="w-7 shrink-0" />
                {config.renderActions(assistantCount, isStreaming)}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-border/50 bg-background/50">
              {config.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:shadow-sm ${config.accentLight} hover:opacity-80`}
                  style={{
                    animation: `lensyButtonIn 0.3s ease-out ${i * 50 + 200}ms both`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border bg-card shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={config.placeholder}
                rows={1}
                className="flex-1 resize-none bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent max-h-24 transition-shadow"
                style={{ minHeight: "36px" }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "36px";
                  el.style.height = Math.min(el.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                  input.trim() && !isStreaming
                    ? `${config.accentButton} text-white shadow-md hover:shadow-lg hover:scale-105`
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {config.footerText && (
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">{config.footerText}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══ FLOATING BUBBLE ═══ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 ${positionClass} z-50 h-14 w-14 rounded-full bg-gradient-to-br ${config.bubbleGradient} text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group`}
      >
        {isOpen ? (
          <X className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            {config.variant === "agent" && messages.length === 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      <style jsx global>{`
        @keyframes lensySlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lensyFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lensyButtonIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
