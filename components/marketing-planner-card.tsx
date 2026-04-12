"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  PenTool,
  Film,
  Sofa,
  Crosshair,
  Globe,
  FileText,
  Calendar,
  Trophy,
  TrendingDown,
  Clock,
  BookOpen,
  Loader2,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface PlannerMessage {
  id: string;
  role: "assistant" | "user";
  type: "text" | "action-card" | "caption" | "score" | "schedule";
  text?: string;
  icon?: string;
  title?: string;
  subtitle?: string;
  actions?: PlannerAction[];
  caption?: string;
  platform?: string;
  property?: any;
  time: Date;
}

interface PlannerAction {
  label: string;
  intent: string;
  property?: any;
  platform?: string;
  contentType?: string;
  href?: string;
}

interface ContentScoreItem {
  label: string;
  done: boolean;
  pts: number;
  action?: string;
  actionHref?: string;
  excluded?: boolean;
  excludeReason?: string;
}

interface PropertyData {
  id: string;
  address: string;
  status: string;
  updated_at: string;
  optimized_photos?: any;
  website_published?: boolean;
}

interface MarketingPlannerCardProps {
  userId: string;
  agentName: string;
  isSubscriber: boolean;
  isTrial?: boolean;
  trialDaysLeft?: number;
}

/* ─────────────────────────────────────────────
   Styles (scoped to planner)
   ───────────────────────────────────────────── */
const plannerStyles = `
  @keyframes planner-fade-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes planner-dots {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-3px); }
  }
  .planner-msg-in {
    opacity: 0;
    animation: planner-fade-up 0.3s ease-out forwards;
  }
  .planner-dot {
    animation: planner-dots 1.2s ease-in-out infinite;
  }
  .planner-scroll::-webkit-scrollbar { width: 4px; }
  .planner-scroll::-webkit-scrollbar-track { background: transparent; }
  .planner-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
`;

/* ─────────────────────────────────────────────
   Caption generation (calls /api/planner/caption)
   Falls back to local templates if API not ready
   ───────────────────────────────────────────── */
async function generateCaption(
  propertyAddress: string,
  agentName: string,
  platform: string,
  contentType: string,
  userId: string
): Promise<string> {
  try {
    const res = await fetch("/api/planner/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyAddress, agentName, platform, contentType, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.caption) return data.caption;
    }
  } catch {}

  // Fallback templates
  const name = agentName || "your agent";
  const addr = propertyAddress || "your listing";
  const templates: Record<string, Record<string, string>> = {
    instagram: {
      new_listing: `🏡 Just listed — ${addr}\n\nThis one checks every box. Reach out for pricing and private showings.\n\n#JustListed #RealEstate #NewListing #DreamHome #HomesForSale`,
      just_sold: `🔑 SOLD — ${addr}\n\nAnother successful close. Thank you to my incredible clients for trusting the process.\n\nThinking about selling? Let's talk.\n\n#JustSold #Closed #RealEstate #RealtorLife`,
      staging_reveal: `✨ The power of staging — ${addr}\n\nSwipe to see the transformation. Empty rooms → buyer-ready in hours.\n\n#VirtualStaging #StagedToSell #RealEstateMarketing #BeforeAndAfter`,
      price_reduced: `📉 New price — ${addr}\n\nJust reduced and priced to move. DM for details.\n\n#PriceReduced #RealEstate #HomeBuyers #DealAlert`,
      video_share: `🎬 New video tour — ${addr}\n\nTake a full walkthrough from your couch. Link in bio.\n\n#ListingVideo #VirtualTour #RealEstate #HomeForSale`,
      neighborhood: `📍 Why people love this neighborhood.\n\nWalkable streets, great schools, and a community that actually feels like one. ${addr} puts you right in the heart of it.\n\n#NeighborhoodSpotlight #CommunityLiving #RealEstate`,
    },
    facebook: {
      new_listing: `Excited to share my newest listing — ${addr}! 🏡\n\nThis home has everything today's buyers are looking for. I'll be sharing more photos and a full video tour this week.\n\nKnow someone looking? Tag them below or send me a message to schedule a showing.`,
      just_sold: `Another one closed! 🎉\n\n${addr} is officially SOLD. It was a pleasure working with both the buyers and sellers on this one.\n\nIf you're thinking about making a move, I'm here to help. Drop a comment or message me.`,
      staging_reveal: `Just finished staging ${addr} and the difference is incredible. 🏠\n\nVirtual staging lets buyers see the full potential of every room. If you're curious what staging could do for your home, send me a message.`,
      price_reduced: `Great news for buyers — ${addr} just got a price adjustment.\n\nThis is an excellent opportunity to get into a fantastic home at a great value. Reach out if you'd like to schedule a showing.`,
      video_share: `Just dropped a new video tour of ${addr}! 🎬\n\nWatch the full walkthrough and see every detail of this property. Share with anyone who might be interested!`,
      neighborhood: `Let me tell you why I love this neighborhood.\n\n${addr} is in one of the most sought-after areas — and for good reason. Great restaurants, parks, and a real sense of community.\n\nWant to know more about the area? I'd love to chat.`,
    },
    linkedin: {
      new_listing: `New listing: ${addr}\n\nBringing this property to market with a full marketing strategy — professional photography, video tour, and targeted digital campaigns. In today's market, positioning matters as much as pricing.\n\nReal estate professionals: what's working in your market right now?`,
      just_sold: `Closed: ${addr}\n\nAnother successful transaction. Strategic pricing, professional marketing, and clear communication made the difference. Grateful for clients who trust a data-driven approach.`,
      staging_reveal: `Virtual staging continues to be one of the highest-ROI tools in real estate marketing.\n\nCase in point: ${addr}. After digital staging, we saw a measurable increase in showing requests within the first week. The cost? A fraction of traditional staging.`,
      price_reduced: `Strategic price adjustment on ${addr}.\n\nIn a shifting market, proactive pricing adjustments demonstrate market awareness and attract serious buyers. This property now represents exceptional value for the area.`,
      video_share: `Professional video marketing for ${addr}.\n\nIn today's market, 73% of sellers say they'd prefer to list with an agent who uses video. Here's why I make it standard for every listing.`,
      neighborhood: `Market insight: What makes a neighborhood hold its value?\n\nLooking at the area around ${addr}, several key factors stand out — walkability, school ratings, and infrastructure investment. These fundamentals matter more than ever.`,
    },
  };

  return templates[platform]?.[contentType]
    || templates.instagram.new_listing;
}

/* ─────────────────────────────────────────────
   Suggestion engine (runs client-side for v1)
   ───────────────────────────────────────────── */
async function loadSuggestions(
  userId: string,
  agentName: string
): Promise<PlannerMessage[]> {
  const supabase = createClient();
  const msgs: PlannerMessage[] = [];
  const firstName = agentName?.split(" ")[0] || "there";

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  })();

  msgs.push({
    id: "welcome",
    role: "assistant",
    type: "text",
    text: `Good ${timeOfDay}, ${firstName}. Let me check your listings and see what you should focus on today.`,
    time: new Date(),
  });

  // Load properties
  const { data: properties } = await supabase
    .from("agent_properties")
    .select("id, address, status, updated_at, optimized_photos, website_published")
    .eq("user_id", userId)
    .is("merged_into_id", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (!properties?.length) {
    msgs.push({
      id: "no-props",
      role: "assistant",
      type: "action-card",
      icon: "🏠",
      title: "No properties yet",
      subtitle: "Add your first listing to get personalized marketing suggestions.",
      actions: [
        { label: "Add a Property", intent: "open-tool", href: "/dashboard/properties" },
      ],
      time: new Date(),
    });
    return msgs;
  }

  // Check for recently sold
  const recentlySold = properties.filter(p => {
    if (p.status !== "sold") return false;
    const updatedAt = new Date(p.updated_at);
    const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 14;
  });

  for (const prop of recentlySold) {
    // Check if Just Sold graphic exists
    const { count } = await supabase
      .from("design_exports")
      .select("*", { count: "exact", head: true })
      .eq("property_id", prop.id)
      .like("template_type", "%sold%");

    if (!count) {
      msgs.push({
        id: `sold-${prop.id}`,
        role: "assistant",
        type: "action-card",
        icon: "🏆",
        title: `${prop.address} just sold!`,
        subtitle: "Celebrate the win — create a Just Sold graphic and share it.",
        actions: [
          { label: "Create Just Sold graphic", intent: "open-tool", href: `/dashboard/lens/design-studio?propertyId=${prop.id}` },
          { label: "Write a caption", intent: "caption", property: prop, contentType: "just_sold" },
          { label: "Skip", intent: "skip" },
        ],
        time: new Date(),
      });
    }
  }

  // Check for price reduced
  const priceReduced = properties.filter(p => {
    if (p.status !== "price_reduced") return false;
    const updatedAt = new Date(p.updated_at);
    const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  for (const prop of priceReduced) {
    const { count } = await supabase
      .from("design_exports")
      .select("*", { count: "exact", head: true })
      .eq("property_id", prop.id)
      .like("template_type", "%reduced%");

    if (!count) {
      msgs.push({
        id: `reduced-${prop.id}`,
        role: "assistant",
        type: "action-card",
        icon: "📉",
        title: `Price reduced on ${prop.address}`,
        subtitle: "Let buyers know about the new price — create a graphic or post.",
        actions: [
          { label: "Create Price Reduced graphic", intent: "open-tool", href: `/dashboard/lens/design-studio?propertyId=${prop.id}` },
          { label: "Write a caption", intent: "caption", property: prop, contentType: "price_reduced" },
          { label: "Skip", intent: "skip" },
        ],
        time: new Date(),
      });
    }
  }

  // Check for unshared staging photos
  const { data: stagingPhotos } = await supabase
    .from("lens_staging")
    .select("id, staged_url, created_at, property_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (stagingPhotos?.length) {
    // Check if any have been shared
    const { count: shareCount } = await supabase
      .from("marketing_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("content_type", "staging")
      .eq("action_type", "social_share");

    if (!shareCount) {
      const stagingProp = properties.find(p => p.id === stagingPhotos[0].property_id) || properties[0];
      const daysAgo = Math.floor((Date.now() - new Date(stagingPhotos[0].created_at).getTime()) / (1000 * 60 * 60 * 24));
      msgs.push({
        id: "share-staging",
        role: "assistant",
        type: "action-card",
        icon: "📸",
        title: `Share your staged photos — ${stagingProp.address}`,
        subtitle: `Created ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago but not posted yet. These are ready to go.`,
        actions: [
          { label: "Instagram caption", intent: "caption", property: stagingProp, platform: "instagram", contentType: "staging_reveal" },
          { label: "Facebook caption", intent: "caption", property: stagingProp, platform: "facebook", contentType: "staging_reveal" },
          { label: "Already posted", intent: "mark-posted", property: stagingProp },
        ],
        time: new Date(),
      });
    }
  }

  // Check for active listings without flyers
  const activeListings = properties.filter(p => p.status === "active");
  for (const prop of activeListings.slice(0, 2)) {
    const { count: flyerCount } = await supabase
      .from("design_exports")
      .select("*", { count: "exact", head: true })
      .eq("property_id", prop.id);

    if (!flyerCount) {
      msgs.push({
        id: `flyer-${prop.id}`,
        role: "assistant",
        type: "action-card",
        icon: "🎨",
        title: `No marketing graphic for ${prop.address}`,
        subtitle: "You have photos — a flyer takes 30 seconds in Design Studio.",
        actions: [
          { label: "Open Design Studio", intent: "open-tool", href: `/dashboard/lens/design-studio?propertyId=${prop.id}` },
          { label: "Later", intent: "skip" },
        ],
        time: new Date(),
      });
    }
  }

  // Check for listings not on website
  const unpublished = activeListings.filter(p => !p.website_published);
  if (unpublished.length > 0) {
    const prop = unpublished[0];
    msgs.push({
      id: `website-${prop.id}`,
      role: "assistant",
      type: "action-card",
      icon: "🌐",
      title: `${prop.address} isn't on your website yet`,
      subtitle: "Publishing it takes one click and gives it a shareable URL.",
      actions: [
        { label: "Publish to website", intent: "open-tool", href: `/dashboard/properties/${prop.id}` },
        { label: "Skip", intent: "skip" },
      ],
      time: new Date(),
    });
  }

  // Blog nudge — check if they have blog posts
  const { count: blogCount } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Only nudge if they've ever written one (means blog is enabled)
  // or if they have 3+ properties (engaged enough to benefit)
  if (properties.length >= 3 || (blogCount && blogCount > 0)) {
    const { data: recentBlog } = await supabase
      .from("blog_posts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastBlogDays = recentBlog?.[0]
      ? Math.floor((Date.now() - new Date(recentBlog[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (lastBlogDays > 14) {
      msgs.push({
        id: "blog-nudge",
        role: "assistant",
        type: "action-card",
        icon: "📝",
        title: lastBlogDays > 100 ? "Start a blog on your website" : `Blog hasn't been updated in ${lastBlogDays} days`,
        subtitle: "A quick market update keeps your site fresh and helps SEO. I can draft one.",
        actions: [
          { label: "Draft a market update", intent: "caption", contentType: "market_update", platform: "blog" },
          { label: "Not now", intent: "skip" },
        ],
        time: new Date(),
      });
    }
  }

  // If we only have the welcome message, add a positive note
  if (msgs.length <= 1) {
    msgs.push({
      id: "all-good",
      role: "assistant",
      type: "text",
      text: "You're in great shape — I don't see any urgent marketing gaps right now. Want me to write a caption for any of your listings?",
      time: new Date(),
    });
  }

  return msgs;
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/25 planner-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function CaptionBubble({
  caption,
  platform,
  onCopy,
  onRegenerate,
}: {
  caption: string;
  platform: string;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const platformLabel: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    blog: "Blog Post",
  };
  const platformIcon: Record<string, string> = {
    instagram: "📱",
    facebook: "📘",
    linkedin: "💼",
    blog: "📝",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption).catch(() => {});
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden max-w-[420px]">
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
        <span className="text-sm">{platformIcon[platform] || "📋"}</span>
        <span className="text-xs font-bold text-white/50">
          {platformLabel[platform] || platform} Caption
        </span>
      </div>
      <div className="px-4 py-3.5 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
        {caption}
      </div>
      <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            copied
              ? "bg-green-400/15 text-green-400"
              : "bg-cyan-500 hover:bg-cyan-400 text-white"
          }`}
        >
          {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.15]"
        >
          <RefreshCw className="h-3 w-3" />Regenerate
        </button>
      </div>
    </div>
  );
}

function ActionCardBubble({
  msg,
  onAction,
}: {
  msg: PlannerMessage;
  onAction: (action: PlannerAction) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 max-w-[420px]">
      <div className="flex gap-3 mb-3">
        <span className="text-xl flex-shrink-0">{msg.icon}</span>
        <div>
          <p className="text-sm font-bold text-white/90 leading-snug">{msg.title}</p>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">{msg.subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {msg.actions?.map((action, i) => (
          <button
            key={i}
            onClick={() => onAction(action)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              i === 0
                ? "bg-cyan-500 hover:bg-cyan-400 text-white font-bold"
                : action.intent === "skip"
                ? "text-white/25 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.12]"
                : "text-white/60 hover:text-white/80 border border-white/[0.08] hover:border-white/[0.15]"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */
export function MarketingPlannerCard({
  userId,
  agentName,
  isSubscriber,
  isTrial,
  trialDaysLeft,
}: MarketingPlannerCardProps) {
  const [messages, setMessages] = useState<PlannerMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setIsTyping(true);
      try {
        const suggestions = await loadSuggestions(userId, agentName);
        if (!cancelled) {
          setMessages(suggestions);
        }
      } catch (err) {
        console.error("Planner load error:", err);
        if (!cancelled) {
          setMessages([{
            id: "error",
            role: "assistant",
            type: "text",
            text: "I had trouble loading your marketing data. Try refreshing the page.",
            time: new Date(),
          }]);
        }
      }
      if (!cancelled) {
        setLoading(false);
        setIsTyping(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId, agentName]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = useCallback((msg: Partial<PlannerMessage>) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      type: "text",
      time: new Date(),
      ...msg,
    } as PlannerMessage]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    addMessage({ role: "user", type: "text", text });
  }, [addMessage]);

  const addAssistantDelayed = useCallback((msg: Partial<PlannerMessage>, delay = 700) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage(msg);
      setIsTyping(false);
    }, delay);
  }, [addMessage]);

  // Record a marketing action
  const recordAction = useCallback(async (
    actionType: string,
    propertyId?: string,
    contentType?: string,
    platform?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await fetch("/api/planner/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, actionType, propertyId, contentType, platform, metadata }),
      });
    } catch {}
  }, [userId]);

  const handleAction = useCallback(async (action: PlannerAction) => {
    if (action.intent === "skip") {
      addUserMessage("Skip this one");
      addAssistantDelayed({ text: "Got it, moving on." }, 400);
      if (action.property?.id) {
        recordAction("planner_item_skipped", action.property.id);
      }
    } else if (action.intent === "mark-posted") {
      addUserMessage("I already posted this");
      addAssistantDelayed({
        text: `Nice — marked ${action.property?.address || "it"} as shared. That counts toward your content score. 👊`,
      }, 500);
      if (action.property?.id) {
        recordAction("social_share", action.property.id, "staging");
      }
    } else if (action.intent === "caption") {
      const platformLabel = action.platform || "social";
      addUserMessage(`Write me a${platformLabel === "instagram" ? "n" : ""} ${platformLabel} caption`);
      setIsTyping(true);
      setGeneratingCaption(true);

      const platform = action.platform || "instagram";
      const contentType = action.contentType || "new_listing";
      const address = action.property?.address || "your listing";

      try {
        const caption = await generateCaption(address, agentName, platform, contentType, userId);
        addMessage({
          type: "caption",
          caption,
          platform,
        });
        recordAction("caption_generated", action.property?.id, contentType, platform);
      } catch {
        addMessage({ text: "Sorry, I couldn't generate a caption right now. Try again in a moment." });
      }
      setIsTyping(false);
      setGeneratingCaption(false);
    } else if (action.intent === "open-tool" && action.href) {
      window.location.href = action.href;
    }
  }, [addUserMessage, addAssistantDelayed, addMessage, agentName, userId, recordAction]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    addUserMessage(text);

    const lower = text.toLowerCase();

    if (lower.includes("caption") || lower.includes("write") || lower.includes("post")) {
      const platform = lower.includes("linkedin") ? "linkedin"
        : lower.includes("facebook") ? "facebook"
        : "instagram";

      // Try to find an active property
      const supabase = createClient();
      supabase
        .from("agent_properties")
        .select("id, address, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .is("merged_into_id", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const prop = data?.[0] || { id: null, address: "your listing" };
          handleAction({ intent: "caption", property: prop, platform, contentType: "new_listing" });
        });
    } else if (lower.includes("help") || lower.includes("what should") || lower.includes("suggest")) {
      addAssistantDelayed({
        text: "Let me check your listings again...",
      }, 400);
      setTimeout(async () => {
        const suggestions = await loadSuggestions(userId, agentName);
        const actionCards = suggestions.filter(m => m.type === "action-card").slice(0, 2);
        if (actionCards.length) {
          actionCards.forEach((m, i) => {
            setTimeout(() => addMessage(m), i * 400);
          });
        } else {
          addMessage({ text: "Everything looks good! No urgent marketing tasks right now." });
        }
        setIsTyping(false);
      }, 1000);
    } else {
      addAssistantDelayed({
        text: "I can write captions for your listings, flag marketing gaps, and suggest what to post next. Try \"write me an Instagram caption\" or \"what should I do today?\"",
      }, 600);
    }
  }, [input, isTyping, addUserMessage, addAssistantDelayed, addMessage, userId, agentName, handleAction]);

  if (!isSubscriber && !isTrial) return null; // Gate: only for subscribers and trial users

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: plannerStyles }} />
      <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden" style={{ animationDelay: "0.19s" }}>
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white/90">Marketing Planner</p>
              <p className="text-[10px] text-white/30">Your daily marketing assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 text-white/20 animate-spin" />}
            {!loading && messages.filter(m => m.type === "action-card").length > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                {messages.filter(m => m.type === "action-card").length} items
              </span>
            )}
            {collapsed
              ? <ChevronDown className="h-4 w-4 text-white/20" />
              : <ChevronUp className="h-4 w-4 text-white/20" />
            }
          </div>
        </button>

        {/* Body */}
        {!collapsed && (
          <div className="border-t border-white/[0.06]">
            {/* Messages */}
            <div
              ref={scrollRef}
              className="planner-scroll overflow-y-auto px-4 py-4 space-y-3"
              style={{ maxHeight: 420, minHeight: 120 }}
            >
              {messages.map(msg => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`planner-msg-in flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {msg.type === "text" && (
                      <div
                        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? "bg-white/[0.08] rounded-2xl rounded-br-md text-white/80"
                            : "bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md text-white/70"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                    {msg.type === "action-card" && (
                      <ActionCardBubble msg={msg} onAction={handleAction} />
                    )}
                    {msg.type === "caption" && msg.caption && (
                      <CaptionBubble
                        caption={msg.caption}
                        platform={msg.platform || "instagram"}
                        onCopy={() => {
                          recordAction("caption_copied", undefined, undefined, msg.platform);
                          addAssistantDelayed({
                            text: "Copied! When you post it, come back and let me know so I can update your content score.",
                          }, 500);
                        }}
                        onRegenerate={() => {
                          addUserMessage("Regenerate that");
                          handleAction({
                            intent: "caption",
                            platform: msg.platform,
                            contentType: "new_listing",
                            property: { address: "your listing" },
                          });
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {isTyping && <TypingDots />}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Ask me to write a caption, suggest next steps..."
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none py-2"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    input.trim() && !isTyping
                      ? "bg-cyan-500 hover:bg-cyan-400 text-white"
                      : "bg-white/[0.04] text-white/15"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Quick chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: "✍️ Write a caption", msg: "Write me an Instagram caption" },
                  { label: "💡 What should I do?", msg: "What should I focus on today?" },
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (isTyping) return;
                      setInput("");
                      addUserMessage(chip.msg);
                      if (chip.msg.includes("caption")) {
                        const supabase = createClient();
                        supabase
                          .from("agent_properties")
                          .select("id, address, status")
                          .eq("user_id", userId)
                          .eq("status", "active")
                          .is("merged_into_id", null)
                          .order("updated_at", { ascending: false })
                          .limit(1)
                          .then(({ data }) => {
                            const prop = data?.[0] || { id: null, address: "your listing" };
                            handleAction({ intent: "caption", property: prop, platform: "instagram", contentType: "new_listing" });
                          });
                      } else {
                        addAssistantDelayed({ text: "Let me check..." }, 400);
                        setTimeout(async () => {
                          const suggestions = await loadSuggestions(userId, agentName);
                          const cards = suggestions.filter(m => m.type === "action-card").slice(0, 2);
                          if (cards.length) {
                            cards.forEach((m, idx) => {
                              setTimeout(() => addMessage(m), idx * 400);
                            });
                          } else {
                            addMessage({ text: "Everything looks good — no urgent marketing gaps right now." });
                          }
                          setIsTyping(false);
                        }, 1000);
                      }
                    }}
                    disabled={isTyping}
                    className="text-[11px] font-semibold text-white/40 hover:text-white/60 px-2.5 py-1 rounded-full border border-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
