// app/dashboard/planner/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  Send, Sparkles, Loader2, MessageSquare, ChevronDown,
  BarChart3, User, ArrowRight,
} from "lucide-react";
import { AgentBrandScoreCard } from "@/components/content-score";

const CalendarView = dynamic(() => import("@/components/calendar-view"), { ssr: false });
const ContentLibrary = dynamic(() => import("@/components/content-library"), { ssr: false });
const PostCreator = dynamic(() => import("@/components/post-creator"), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  buttons?: string[];
  assetContext?: { type: string; label: string; propertyAddress: string; url?: string };
}

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  buttons?: string[];
  propertyAddress?: string;
}

interface Property {
  id: string;
  address: string;
}

// ─── Planner Page ───────────────────────────────────────────────────────────

export default function PlannerPage() {
  const supabase = createClient();
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [agentName, setAgentName] = useState("Agent");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyFilter, setPropertyFilter] = useState("");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const hasLoadedSuggestions = useRef(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Post creator modal
  const [postCreatorOpen, setPostCreatorOpen] = useState(false);
  const [postCreatorDate, setPostCreatorDate] = useState<string>("");
  const [postCreatorAssetUrl, setPostCreatorAssetUrl] = useState<string>("");
  const [postCreatorPropertyId, setPostCreatorPropertyId] = useState<string>("");

  // Active tab
  const [activeTab, setActiveTab] = useState<"chat" | "plans" | "analytics">("chat");

  // ─── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) return;
      setSession(s);

      const [propsRes, profileRes] = await Promise.all([
        supabase.from("agent_properties").select("id, address").eq("user_id", s.user.id),
        supabase.from("lens_usage").select("saved_agent_name, saved_company, saved_location").eq("user_id", s.user.id).single(),
      ]);

      setProperties(propsRes.data || []);
      const fullName = profileRes.data?.saved_agent_name || "";
      const firstName = fullName ? (fullName.includes(" ") ? fullName.split(" ")[0] : fullName) : "there";
      setAgentName(firstName);

      // Load suggestions once here — after we have both session and name
      if (hasLoadedSuggestions.current) return;
      hasLoadedSuggestions.current = true;

      setIsTyping(true);
      try {
        const res = await fetch("/api/planner/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: firstName }),
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);

          const greeting = data.suggestions.length > 0
            ? `Hey ${firstName}! What are we working on today? I found a few things that need your attention — want me to walk you through them?`
            : `Hey ${firstName}! What are we working on today? Everything looks good on my end — want to plan some posts or create content for a listing?`;

          addMessage({
            role: "assistant",
            text: greeting,
            buttons: data.suggestions.length > 0
              ? ["Show me what's next", "Plan this week", "Write a caption"]
              : ["Plan this week", "Write a post about me", "Generate market update"],
          });
        }
      } catch (err) {
        console.error("Suggestions load error:", err);
        addMessage({
          role: "assistant",
          text: "I had trouble loading your marketing data. Try refreshing the page.",
        });
      } finally {
        setIsTyping(false);
      }
    };
    init();
  }, []);

  // ─── Chat helpers ─────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
    ]);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    addMessage({ role: "user", text });
    setIsTyping(true);

    try {
      const res = await fetch("/api/planner/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeform: text, agentName }),
      });
      if (res.ok) {
        const data = await res.json();
        addMessage({
          role: "assistant",
          text: data.caption || data.response || "Here you go!",
          buttons: ["Copy", "Schedule this", "Try again"],
        });
      } else {
        addMessage({
          role: "assistant",
          text: "I can write captions, suggest posts, and help with your marketing strategy. Try asking me something specific!",
        });
      }
    } catch {
      addMessage({
        role: "assistant",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleButtonClick = (btn: string) => {
    addMessage({ role: "user", text: btn });
    setIsTyping(true);

    setTimeout(async () => {
      const lower = btn.toLowerCase();

      // ── Copy last caption ──
      if (btn === "Copy" && messages.length > 0) {
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant) {
          await navigator.clipboard.writeText(lastAssistant.text);
          addMessage({ role: "assistant", text: "Copied to clipboard!" });
        }

      // ── Schedule ──
      } else if (btn === "Schedule this" || lower.includes("schedule for later")) {
        setPostCreatorOpen(true);
        addMessage({ role: "assistant", text: "Opening the post creator — pick your platform and date." });

      // ── Listing no longer active ──
      } else if (lower.includes("no longer active") || lower.includes("not active")) {
        addMessage({
          role: "assistant",
          text: "Got it — I'll stop nudging you about this one. You can update the listing status on the property page, or mark it as sold to trigger a Just Sold campaign!",
          buttons: ["Mark as Sold", "Go to property page", "Dismiss"],
        });

      // ── Direct tool links ──
      } else if (lower.includes("story reel") || lower.includes("remix")) {
        addMessage({
          role: "assistant",
          text: "Great idea! Head to the Design Studio to create a story reel. Pick the \"Just Listed\" or \"Coming Soon\" template, select your clips, and you'll have a reel ready for Instagram, TikTok, and YouTube Shorts in minutes.",
          buttons: ["Open Design Studio", "Write a caption for it first", "Schedule for later"],
        });

      } else if (lower.includes("photo teaser") || lower.includes("photo carousel")) {
        addMessage({
          role: "assistant",
          text: "A photo teaser is one of the highest-engagement post types. Pick your 5 best photos from the content library on the right, and I'll write you a scroll-stopping caption. Which platform?",
          buttons: ["Instagram carousel", "Facebook post", "Both platforms"],
        });

      } else if (lower.includes("just listed graphic") || lower.includes("just sold graphic") || lower.includes("price update graphic")) {
        addMessage({
          role: "assistant",
          text: "The Design Studio has templates ready for that. Your branding and listing details auto-fill — just pick a style and export.",
          buttons: ["Open Design Studio", "Schedule for later"],
        });

      } else if (lower.includes("listing description")) {
        addMessage({
          role: "assistant",
          text: "The Description Writer will generate a professional listing description using your photos and property details. It matches your writing voice too.",
          buttons: ["Open Description Writer", "Not now"],
        });

      } else if (lower.includes("open design studio")) {
        window.open("/dashboard/lens/design-studio", "_blank");
        addMessage({ role: "assistant", text: "Opened the Design Studio in a new tab. Come back here when your graphic is ready and I'll help you schedule it." });

      } else if (lower.includes("open description writer")) {
        window.open("/dashboard/lens/description-writer", "_blank");
        addMessage({ role: "assistant", text: "Opened the Description Writer in a new tab." });

      } else if (lower.includes("order a listing video")) {
        window.open("/order", "_blank");
        addMessage({ role: "assistant", text: "Opened the video order page. Once your video is delivered, it'll show up in your content library automatically." });

      // ── Platform-specific post ──
      } else if (lower.includes("post to instagram") || lower === "instagram carousel") {
        setPostCreatorDate(new Date().toISOString().split("T")[0]);
        setPostCreatorOpen(true);
        addMessage({ role: "assistant", text: "Opening the post creator for Instagram. I'll generate a caption once you pick the content." });

      } else if (lower.includes("post to facebook") || lower === "facebook post") {
        setPostCreatorDate(new Date().toISOString().split("T")[0]);
        setPostCreatorOpen(true);
        addMessage({ role: "assistant", text: "Opening the post creator for Facebook." });

      } else if (lower.includes("both platforms")) {
        addMessage({
          role: "assistant",
          text: "Smart move — cross-posting maximizes reach. I'll help you create one for each. Let's start with Instagram (shorter, more visual) then adapt it for Facebook.",
          buttons: ["Write Instagram caption", "Write Facebook caption"],
        });

      // ── Self-marketing responses ──
      } else if (lower.includes("about-me post") || lower.includes("about me")) {
        try {
          const res = await fetch("/api/planner/caption", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ freeform: "Write me a personal About Me post for Instagram. Share my story as a real estate agent — why I got into real estate, what I love about it, and what makes me different. Warm and authentic.", agentName }),
          });
          if (res.ok) {
            const data = await res.json();
            addMessage({ role: "assistant", text: data.caption || "Here's your About Me post:", buttons: ["Copy", "Schedule this", "Try again"] });
          }
        } catch { addMessage({ role: "assistant", text: "Let me try that again." }); }

      } else if (lower.includes("market update")) {
        try {
          const res = await fetch("/api/planner/caption", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ freeform: "Write a local real estate market update post for LinkedIn. Reference current trends like inventory, pricing, buyer demand. Position me as a knowledgeable local expert.", agentName }),
          });
          if (res.ok) {
            const data = await res.json();
            addMessage({ role: "assistant", text: data.caption || "Here's your market update:", buttons: ["Copy", "Schedule this", "Try again"] });
          }
        } catch { addMessage({ role: "assistant", text: "Let me try that again." }); }

      } else if (lower.includes("real estate tip")) {
        try {
          const res = await fetch("/api/planner/caption", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ freeform: "Write a quick, actionable real estate tip post for Instagram. Could be for buyers or sellers. Educational, concise, shareable.", agentName }),
          });
          if (res.ok) {
            const data = await res.json();
            addMessage({ role: "assistant", text: data.caption || "Here's your tip post:", buttons: ["Copy", "Schedule this", "Try again"] });
          }
        } catch { addMessage({ role: "assistant", text: "Let me try that again." }); }

      // ── Dismiss / Skip / Not now ──
      } else if (lower === "not now" || lower === "skip" || lower === "dismiss") {
        addMessage({ role: "assistant", text: "No worries — I'll bring it up again later. What else can I help with?" });

      // ── Fallback: send to Claude as freeform ──
      } else {
        try {
          const res = await fetch("/api/planner/caption", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ freeform: btn, agentName }),
          });
          if (res.ok) {
            const data = await res.json();
            addMessage({
              role: "assistant",
              text: data.caption || data.response || "Here's what I came up with:",
              buttons: ["Copy", "Schedule this", "Try again"],
            });
          }
        } catch {
          addMessage({ role: "assistant", text: "Let me try that again in a moment." });
        }
      }
      setIsTyping(false);
    }, 600);
  };

  // ─── Content Library handlers ─────────────────────────────────────────

  const handleSendToChat = (asset: { type: string; label: string; propertyAddress: string; assetUrl?: string; thumbnailUrl?: string }) => {
    const ctx = {
      type: asset.type,
      label: asset.label,
      propertyAddress: asset.propertyAddress,
      url: asset.assetUrl || asset.thumbnailUrl,
    };

    addMessage({
      role: "user",
      text: `[Sent: ${asset.type} — ${asset.label} from ${asset.propertyAddress.split(",")[0]}]`,
      assetContext: ctx,
    });

    setIsTyping(true);
    setTimeout(() => {
      addMessage({
        role: "assistant",
        text: `Great ${asset.type}! What would you like to do with it?`,
        buttons: [
          "Schedule for Instagram",
          "Schedule for Facebook",
          "Write a caption now",
          "Add to this week's plan",
        ],
      });
      setIsTyping(false);
    }, 800);
  };

  const handleUseInPost = (asset: { assetUrl?: string; thumbnailUrl?: string; propertyId?: string }) => {
    setPostCreatorAssetUrl(asset.assetUrl || asset.thumbnailUrl || "");
    setPostCreatorPropertyId(asset.propertyId || "");
    setPostCreatorOpen(true);
  };

  const handleCalendarAddPost = (date: string) => {
    setPostCreatorDate(date);
    setPostCreatorOpen(true);
  };

  const handleCalendarItemAction = (id: string, action: "posted" | "skipped") => {
    // Calendar component handles the API call internally
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white/90">Marketing Planner</h1>
              <p className="text-xs text-white/30">Your complete marketing department</p>
            </div>
          </div>

          {/* Property filter */}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-emerald-400/30"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.address.split(",")[0]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Left — Lensy Chat */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm flex flex-col" style={{ minHeight: 500, maxHeight: 600 }}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">Lensy</p>
                <p className="text-[10px] text-white/30">Your marketing assistant</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-emerald-500/15 border border-emerald-500/20" : "bg-white/[0.05] border border-white/[0.06]"} rounded-2xl px-3.5 py-2.5`}>
                    <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {msg.buttons.map((btn) => (
                          <button
                            key={btn}
                            onClick={() => handleButtonClick(btn)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl px-3.5 py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Lensy anything..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right — Content Library */}
          <div style={{ minHeight: 500, maxHeight: 600 }}>
            <ContentLibrary
              properties={properties}
              onSendToChat={handleSendToChat}
              onUseInPost={handleUseInPost}
            />
          </div>
        </div>

        {/* Agent Brand Score */}
        <div className="mb-5">
          <AgentBrandScoreCard />
        </div>

        {/* Calendar — full width */}
        <CalendarView
          propertyId={propertyFilter || undefined}
          onAddPost={handleCalendarAddPost}
          onItemAction={handleCalendarItemAction}
        />
      </div>

      {/* Post Creator Modal */}
      <PostCreator
        isOpen={postCreatorOpen}
        onClose={() => {
          setPostCreatorOpen(false);
          setPostCreatorDate("");
          setPostCreatorAssetUrl("");
          setPostCreatorPropertyId("");
        }}
        initialDate={postCreatorDate}
        initialAssetUrl={postCreatorAssetUrl}
        initialPropertyId={postCreatorPropertyId}
        properties={properties}
        onScheduled={() => {
          // Trigger calendar refresh by toggling propertyFilter
          setPropertyFilter((prev) => {
            setTimeout(() => setPropertyFilter(prev), 100);
            return prev === "" ? " " : "";
          });
        }}
      />
    </div>
  );
}
