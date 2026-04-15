// app/dashboard/planner/page.tsx
// Streamlined Marketing Planner — Property → Media → Generate → Share
// Lensy chat sidebar stays visible for agent direction changes

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  MessageSquare,
  ChevronDown,
  Loader2,
  Send,
  ArrowLeft,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Palette,
  Sofa,
  RotateCcw,
  Copy,
  ExternalLink,
} from "lucide-react";

import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  address: string;
  city?: string;
  state?: string;
  status: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  special_features?: string[];
}

interface MediaAsset {
  id: string;
  type: "photo" | "video" | "clip" | "flyer" | "staging" | "remix" | "description" | "drone";
  propertyId?: string;
  propertyAddress: string;
  thumbnailUrl?: string;
  assetUrl?: string;
  content?: string;
  label?: string;
  createdAt?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(n?: number) {
  if (!n) return "";
  return "$" + n.toLocaleString();
}

function getPostType(status: string): string {
  if (status === "sold") return "Just Sold";
  if (status === "price_reduced") return "Price Drop Alert";
  if (status === "coming_soon") return "Coming Soon Preview";
  return "Just Listed";
}

function getContentType(status: string): string {
  if (status === "sold") return "just_sold";
  if (status === "price_reduced") return "price_reduced";
  if (status === "coming_soon") return "coming_soon";
  return "new_listing";
}

// Generate a thumbnail from a Cloudinary video URL
// https://res.cloudinary.com/xxx/video/upload/v123/file.mp4
// → https://res.cloudinary.com/xxx/video/upload/so_0,w_400,h_300,c_fill/v123/file.jpg
function cloudinaryVideoThumb(url: string | undefined): string | null {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return null;
  try {
    return url
      .replace("/video/upload/", "/video/upload/so_0,w_400,h_300,c_fill/")
      .replace(/\.mp4$/i, ".jpg");
  } catch {
    return null;
  }
}

// Get the best thumbnail for any media asset
function getBestThumb(m: MediaAsset): string | null {
  const url = m.thumbnailUrl || "";
  // If thumbnailUrl is a real image (not PDF, not mp4), use it directly
  if (url && !url.endsWith(".pdf") && !url.endsWith(".mp4") && !url.includes("/raw/")) {
    return url;
  }
  // If thumbnailUrl is an mp4 on Cloudinary, generate a thumbnail
  if (url && url.endsWith(".mp4")) {
    return cloudinaryVideoThumb(url);
  }
  // If assetUrl is a Cloudinary video, generate a thumbnail from it
  if (m.assetUrl && m.assetUrl.includes("res.cloudinary.com") && m.assetUrl.endsWith(".mp4")) {
    return cloudinaryVideoThumb(m.assetUrl);
  }
  return null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; text: string }> = {
  active: { bg: "#166534", color: "#4ade80", text: "Active" },
  new: { bg: "#166534", color: "#4ade80", text: "New" },
  coming_soon: { bg: "#713f12", color: "#facc15", text: "Coming Soon" },
  sold: { bg: "#7f1d1d", color: "#f87171", text: "Sold" },
  price_reduced: { bg: "#581c87", color: "#c084fc", text: "Price Reduced" },
  withdrawn: { bg: "#374151", color: "#9ca3af", text: "Withdrawn" },
};

const MEDIA_FILTERS = [
  { key: "all", label: "All", icon: null },
  { key: "photo", label: "Photos", icon: ImageIcon },
  { key: "video", label: "Videos", icon: Video },
  { key: "clip", label: "Clips", icon: Video },
  { key: "flyer", label: "Graphics", icon: Palette },
  { key: "staging", label: "Staging", icon: Sofa },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span
      className="inline-block rounded-md text-[11px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color, padding: "3px 10px" }}
    >
      {s.text}
    </span>
  );
}

// ─── Lensy Chat Component ───────────────────────────────────────────────────

function LensyChat({
  property,
  agentName,
  userId,
}: {
  property: Property | null;
  agentName: string;
  userId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPropId = useRef<string | null>(null);

  useEffect(() => {
    if (property?.id === lastPropId.current) return;
    lastPropId.current = property?.id || null;
    if (property) {
      const postType = getPostType(property.status);
      const firstName = agentName.split(" ")[0] || "there";
      setMessages([{
        id: "greeting", role: "assistant",
        text: `Hey ${firstName}! 👋 Working on ${property.address} — great choice! Since it's ${property.status === "active" ? "an active listing" : property.status.replace(/_/g, " ")}, I'll draft "${postType}" style posts.\n\nPick a piece of media and hit Generate, or tell me if you want a different angle!`,
      }]);
    } else {
      setMessages([]);
    }
  }, [property?.id, agentName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { id: "u" + Date.now(), role: "user", text: userText }]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch("/api/planner/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeform: true, message: userText, propertyAddress: property?.address || "", agentName }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { id: "a" + Date.now(), role: "assistant", text: data.caption || data.response || "I can help with that! Select a photo and hit Generate." }]);
      } else {
        setMessages((prev) => [...prev, { id: "a" + Date.now(), role: "assistant", text: "I can help with that! Select a photo and hit Generate, or tell me what kind of post you'd like." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { id: "a" + Date.now(), role: "assistant", text: "I'm here to help! Pick a photo and I'll craft the perfect caption." }]);
    }
    setIsTyping(false);
  }, [input, isTyping, property, agentName]);

  if (!property) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-7 flex flex-col items-center justify-center text-center" style={{ minHeight: 340 }}>
        <div className="w-12 h-12 rounded-xl bg-emerald-900 border border-emerald-700 flex items-center justify-center mb-3">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-base font-extrabold text-white mb-1">Lensy</p>
        <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed">Select a property to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 flex flex-col" style={{ minHeight: 340, maxHeight: 500 }}>
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white">Lensy</p>
          <p className="text-[10px] text-gray-500 font-medium">Marketing Assistant</p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              msg.role === "user" ? "rounded-[14px_14px_4px_14px] bg-blue-600 text-white" : "rounded-[14px_14px_14px_4px] bg-gray-800 text-gray-200 border border-gray-600"
            }`}>{msg.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-[14px_14px_14px_4px] bg-gray-800 border border-gray-600 text-gray-400 text-[13px] flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Lensy is typing...
            </div>
          </div>
        )}
      </div>
      <div className="px-3 py-3 border-t border-gray-700 flex gap-2 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Lensy anything..." className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-[13px] text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 transition-colors" />
        <button onClick={sendMessage} disabled={!input.trim() || isTyping}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg px-4 py-2.5 text-white text-[13px] font-bold transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Planner Page ──────────────────────────────────────────────────────

export default function PlannerPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [agentName, setAgentName] = useState("Agent");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const hasInit = useRef(false);

  // ─── Init ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);
      const [propsRes, profileRes] = await Promise.all([
        supabase.from("agent_properties")
          .select("id, address, city, state, status, price, bedrooms, bathrooms, sqft, special_features")
          .eq("user_id", uid).is("merged_into_id", null)
          .in("status", ["active", "new", "coming_soon", "sold", "price_reduced"])
          .order("updated_at", { ascending: false }),
        supabase.from("lens_usage").select("saved_agent_name, is_subscriber").eq("user_id", uid).single(),
      ]);
      setProperties(propsRes.data || []);
      setAgentName(profileRes.data?.saved_agent_name || "Agent");
      setIsSubscriber(!!profileRes.data?.is_subscriber);
      setLoadingProperties(false);
    };
    init();
  }, []);

  // ─── Load media ─────────────────────────────────────────────────────────

  const loadMedia = useCallback(async (property: Property) => {
    setLoadingMedia(true);
    const assets: MediaAsset[] = [];
    const seen = new Set<string>();

    try {
      const supabase = createClient();
      const addr = property.address || "";
      const streetNum = addr.match(/^\d+/)?.[0] || "";
      const addrWords = addr.replace(/^\d+\s*/, "").split(/[\s,]+/).filter(Boolean);
      const firstWord = addrWords[0] || "";

      const [propRes, ordersRes, exportsRes, stagingRes, descriptionsRes] = await Promise.all([
        supabase.from("agent_properties").select("photos, optimized_photos").eq("id", property.id).single(),
        supabase.from("orders").select("id, property_address, photos, delivery_url, clip_urls, created_at")
          .eq("user_id", userId).in("payment_status", ["paid", "admin_bypass"]),
        supabase.from("design_exports").select("id, property_id, template_type, export_url, export_format, created_at")
          .eq("user_id", userId).eq("property_id", property.id).not("template_type", "eq", "branding_card"),
        supabase.from("lens_staging").select("id, staged_url, room_type, style, created_at")
          .eq("user_id", userId).eq("property_id", property.id),
        supabase.from("lens_descriptions").select("id, property_data, description, style, created_at")
          .eq("user_id", userId),
      ]);

      const normalizeForMatch = (s: string) =>
        (s || "").toLowerCase().replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave")
          .replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr")
          .replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd")
          .replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();

      const propNorm = normalizeForMatch(addr);
      const allOrders = ordersRes.data || [];
      const matchedOrders = allOrders.filter((o: any) => {
        const orderNorm = normalizeForMatch(o.property_address || "");
        if (!orderNorm || !propNorm) return false;
        if (streetNum && orderNorm.includes(streetNum) && firstWord && orderNorm.toLowerCase().includes(firstWord.toLowerCase())) return true;
        const propFirst = propNorm.split(",")[0].trim();
        const orderFirst = orderNorm.split(",")[0].trim();
        return propFirst.length > 5 && orderFirst.length > 5 && (propFirst.includes(orderFirst) || orderFirst.includes(propFirst));
      });

      const addAsset = (a: MediaAsset) => {
        const key = a.assetUrl || a.id;
        if (seen.has(key)) return;
        seen.add(key);
        assets.push(a);
      };

      // Photos from orders
      matchedOrders.forEach((order: any) => {
        const photos = Array.isArray(order.photos) ? order.photos : [];
        photos.forEach((photo: any, idx: number) => {
          const url = typeof photo === "string" ? photo : photo?.secure_url || photo?.url || "";
          const desc = typeof photo === "object" ? photo?.description : "";
          if (url) addAsset({ id: `photo-${order.id}-${idx}`, type: "photo", propertyAddress: order.property_address || addr, thumbnailUrl: url, assetUrl: url, label: desc || `Photo ${idx + 1}`, createdAt: order.created_at });
        });

        // Listing video — generate Cloudinary thumbnail
        if (order.delivery_url) {
          addAsset({
            id: `video-${order.id}`, type: "video", propertyAddress: order.property_address || addr,
            thumbnailUrl: cloudinaryVideoThumb(order.delivery_url) || undefined,
            assetUrl: order.delivery_url, label: "Listing Video", createdAt: order.created_at,
          });
        }

        // Clips — use photo_url as thumbnail
        const clips = Array.isArray(order.clip_urls) ? order.clip_urls : [];
        clips.forEach((clip: any, idx: number) => {
          const clipUrl = clip?.url || clip?.clip_file || clip?.drive_url || "";
          if (!clipUrl) return;
          addAsset({
            id: `clip-${order.id}-${idx}`, type: "clip", propertyAddress: order.property_address || addr,
            thumbnailUrl: clip?.photo_url || cloudinaryVideoThumb(clipUrl) || undefined,
            assetUrl: clipUrl, label: clip?.description || clip?.label || `Clip ${idx + 1}`, createdAt: order.created_at,
          });
        });
      });

      // Optimized photos
      const propData = propRes.data;
      if (propData) {
        const optPhotos = Array.isArray(propData.optimized_photos) ? propData.optimized_photos : [];
        optPhotos.forEach((photo: any, idx: number) => {
          const url = typeof photo === "string" ? photo : photo?.secure_url || photo?.url || "";
          if (url) addAsset({ id: `opt-${idx}`, type: "photo", propertyAddress: addr, thumbnailUrl: url, assetUrl: url, label: `Optimized ${idx + 1}`, createdAt: "" });
        });
        if (assets.filter(a => a.type === "photo").length === 0) {
          const rawPhotos = Array.isArray(propData.photos) ? propData.photos : [];
          rawPhotos.forEach((photo: any, idx: number) => {
            const url = typeof photo === "string" ? photo : photo?.secure_url || photo?.url || "";
            if (url) addAsset({ id: `raw-${idx}`, type: "photo", propertyAddress: addr, thumbnailUrl: url, assetUrl: url, label: `Photo ${idx + 1}`, createdAt: "" });
          });
        }
      }

      // Design exports — generate Cloudinary thumbnails for mp4 flyers
      const FLYER_TYPES = ["just_listed", "just-listed", "open_house", "open-house", "price_reduced", "price-reduced", "just_sold", "just-sold", "yard_sign", "yard-sign", "property_pdf"];
      const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];
      const exports = (exportsRes.data || []).filter((e: any) => e.template_type !== "branding_card");
      exports.forEach((exp: any) => {
        if (!exp.export_url) return;
        const isFlyer = FLYER_TYPES.some(t => exp.template_type?.includes(t));
        const isRemix = exp.template_type?.includes("video_remix");
        const isDrone = exp.template_type?.includes("drone");
        const isImage = IMAGE_FORMATS.includes((exp.export_format || "").toLowerCase());
        // For mp4 exports, generate a Cloudinary thumbnail
        const thumb = isImage ? exp.export_url : cloudinaryVideoThumb(exp.export_url) || undefined;
        addAsset({
          id: `export-${exp.id}`, type: isRemix ? "remix" : isDrone ? "drone" : isFlyer ? "flyer" : "flyer",
          propertyId: exp.property_id, propertyAddress: addr, thumbnailUrl: thumb, assetUrl: exp.export_url,
          label: (exp.template_type || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), createdAt: exp.created_at,
        });
      });

      // Staging
      (stagingRes.data || []).forEach((s: any) => {
        if (s.staged_url) addAsset({ id: `staging-${s.id}`, type: "staging", propertyAddress: addr, thumbnailUrl: s.staged_url, assetUrl: s.staged_url, label: `${s.room_type || "Room"} — ${s.style || "Staged"}`, createdAt: s.created_at });
      });

      // Descriptions
      const addrNorm = addr.toLowerCase().replace(/[^a-z0-9]/g, "");
      (descriptionsRes.data || []).forEach((d: any) => {
        const dAddr = (d.property_data?.address || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (dAddr && addrNorm && (dAddr.includes(addrNorm) || addrNorm.includes(dAddr))) {
          addAsset({ id: `desc-${d.id}`, type: "description", propertyAddress: d.property_data?.address || addr, content: d.description, label: `${d.style || "Description"}`, createdAt: d.created_at });
        }
      });

      assets.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setMedia(assets);
    } catch (err) {
      console.error("Failed to load media:", err);
    }
    setLoadingMedia(false);
  }, [userId]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p); setSelectedMedia([]); setGeneratedCaption(""); setMediaFilter("all"); setStep(2); loadMedia(p);
  };

  const handleSelectMedia = (m: MediaAsset) => {
    setSelectedMedia((prev) => prev.find((s) => s.id === m.id) ? prev.filter((s) => s.id !== m.id) : [...prev, m]);
    setGeneratedCaption("");
  };

  // ─── Caption Templates ──────────────────────────────────────────────────

  const generateLocalCaption = (p: Property): string => {
    const city = p.city || "";
    const cityTag = city.replace(/\s/g, "");
    const details = [p.bedrooms ? `${p.bedrooms} bedrooms` : "", p.bathrooms ? `${p.bathrooms} bathrooms` : "", p.sqft ? `${p.sqft.toLocaleString()} sq ft` : ""].filter(Boolean).join(" · ");
    const price = p.price ? formatPrice(p.price) : "";
    const features = p.special_features?.slice(0, 3).join(", ") || "";
    const firstName = agentName.split(" ")[0] || "";

    const templates: Record<string, string[]> = {
      "Just Listed": [
        `✨ Just Listed in ${city}!\n${p.address}\n${details}\n${price ? `Offered at ${price}` : ""}${features ? `\n${features}` : ""}\nThis is the one you've been waiting for. Schedule your private tour today! 🔑\nListing link in first comment!\n#JustListed #${cityTag}RealEstate #NewListing #DreamHome`,
        `🏡 NEW — ${p.address}\n${details}${price ? ` | ${price}` : ""}${features ? `\n✅ ${p.special_features?.join("\n✅ ") || ""}` : ""}\nLocated in beautiful ${city} — this home is move-in ready and priced to sell.\nDM me to see it before it's gone! 📲\nListing link in first comment!\n#JustListed #RealEstate #HomeGoals #${cityTag}`,
        `Welcome to ${p.address} 🏠\n${details}\n${price ? `Listed at ${price}` : ""}${features ? `\nFeatures: ${features}` : ""}\nThis ${p.bedrooms ? p.bedrooms + "-bedroom" : ""} beauty in ${city} checks every box.\nListing link in first comment! 🔗\n#NewOnTheMarket #${cityTag}Homes #RealEstateAgent`,
        `📣 Fresh on the market!\n${p.address}, ${city}\n${details}\n${price}${features ? `\nHighlights: ${features}` : ""}\nEvery detail of this home was designed for living well.\nCall or DM ${firstName || "me"} today! 📞\nListing link in first comment!\n#JustListed #LuxuryLiving #${cityTag}RealEstate`,
      ],
      "Just Sold": [
        `🎉 SOLD! ${p.address}\nCongrats to my incredible clients on closing this ${p.bedrooms ? p.bedrooms + "-bedroom " : ""}home in ${city}!\nThinking about making a move? Let's talk. 📞\n#JustSold #ClosingDay #${cityTag}RealEstate`,
        `🔑 Keys handed over! ${p.address} is officially SOLD.\nHelping people find their perfect home never gets old.\nYour turn could be next — reach out anytime! 💛\n#Sold #RealEstateLife #${cityTag}`,
      ],
      "Price Drop Alert": [
        `⚡ PRICE IMPROVED — ${p.address}\n${details}\nNow ${price}${features ? `\n${features}` : ""}\nThis ${city} gem just became an even better value!\nDM me to schedule a tour 🏃‍♂️\nListing link in first comment!\n#PriceReduced #${cityTag}Homes #OpportunityKnocks`,
      ],
      "Coming Soon Preview": [
        `👀 COMING SOON to ${city}...\n${p.address}\n${details}\n${price ? `Expected at ${price}` : ""}\nGet on the early access list!\nDM ${firstName || "me"} for details! 🔥\n#ComingSoon #ExclusiveListing #${cityTag}RealEstate`,
      ],
    };
    const postType = getPostType(p.status);
    const options = templates[postType] || templates["Just Listed"];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleGenerateCaption = async () => {
    if (!selectedProperty || selectedMedia.length === 0) return;
    setIsGenerating(true);
    let caption = "";
    try {
      const res = await fetch("/api/planner/caption", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram", contentType: getContentType(selectedProperty.status),
          propertyAddress: selectedProperty.address, agentName,
          propertyDetails: { bedrooms: selectedProperty.bedrooms, bathrooms: selectedProperty.bathrooms, sqft: selectedProperty.sqft, price: selectedProperty.price, city: selectedProperty.city, state: selectedProperty.state, special_features: selectedProperty.special_features },
        }),
      });
      if (res.ok) { const data = await res.json(); caption = data.caption || ""; }
    } catch {}
    if (!caption || caption.includes("[key feature]") || caption.includes("[insert") || caption.includes("[your") || caption.includes("This beautiful home features") || caption.length < 50) {
      caption = generateLocalCaption(selectedProperty);
    }
    setGeneratedCaption(caption); setStep(3); setIsGenerating(false);
    try { fetch("/api/planner/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionType: "caption_generated", propertyId: selectedProperty.id, platform: "instagram", contentType: getContentType(selectedProperty.status), metadata: { mediaCount: selectedMedia.length } }) }); } catch {}
  };

  const handleCopy = (platform: string) => {
    navigator.clipboard.writeText(generatedCaption).then(() => { setCopied(platform); setTimeout(() => setCopied(null), 2500); });
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(generatedCaption);
    handleCopy(platform);
    const urls: Record<string, string | null> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://p2v.homes")}&summary=${text}`,
      instagram: null,
    };
    if (urls[platform]) window.open(urls[platform]!, "_blank", "width=600,height=500");
    try { fetch("/api/planner/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionType: "social_share", propertyId: selectedProperty?.id, platform, contentType: getContentType(selectedProperty?.status || "active"), metadata: { mediaCount: selectedMedia.length } }) }); } catch {}
  };

  const handleStartOver = () => {
    setSelectedProperty(null); setSelectedMedia([]); setGeneratedCaption(""); setMedia([]); setMediaFilter("all"); setStep(1);
  };

  // ─── Derived ────────────────────────────────────────────────────────────

  const filteredMedia = mediaFilter === "all" ? media : media.filter((m) => m.type === mediaFilter);
  const mediaCounts: Record<string, number> = {};
  MEDIA_FILTERS.forEach((f) => { mediaCounts[f.key] = f.key === "all" ? media.length : media.filter((m) => m.type === f.key).length; });

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-colors" title="Back to Dashboard">
              <ArrowLeft className="h-5 w-5 text-gray-300" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Marketing Planner</h1>
              <p className="text-xs text-gray-500 font-medium">Select property → pick media → generate & share</p>
            </div>
          </div>
          {step > 1 && (
            <button onClick={handleStartOver} className="px-4 py-2 rounded-lg text-[13px] font-bold border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Start Over
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[{ n: 1, label: "Choose Property" }, { n: 2, label: "Select Media" }, { n: 3, label: "Share Post" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white border-2 transition-all ${step > s.n ? "bg-green-600 border-green-500" : step === s.n ? "bg-blue-600 border-blue-400" : "bg-gray-800 border-gray-600"}`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-[13px] font-bold ${step >= s.n ? "text-gray-200" : "text-gray-600"}`}>{s.label}</span>
              {i < 2 && <div className={`w-8 h-0.5 rounded ${step > s.n ? "bg-green-600" : "bg-gray-700"}`} />}
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid gap-4" style={{ gridTemplateColumns: step >= 2 ? "300px 1fr" : "1fr", alignItems: "start" }}>
          {step >= 2 && <LensyChat property={selectedProperty} agentName={agentName} userId={userId} />}

          <div>
            {/* STEP 1: Property List */}
            {step === 1 && (
              <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
                <h2 className="text-[17px] font-extrabold text-white mb-4">Your Properties</h2>
                {loadingProperties ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading properties...</div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12"><div className="text-4xl mb-3">🏠</div><p className="text-base font-bold text-white">No properties yet</p><p className="text-sm text-gray-400 mt-1">Add a property to start creating marketing content</p></div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {properties.map((p) => (
                      <button key={p.id} onClick={() => handleSelectProperty(p)} className="w-full bg-gray-800 border border-gray-600 rounded-xl px-5 py-4 flex justify-between items-center hover:border-blue-500 hover:bg-blue-950/30 transition-all text-left group">
                        <div>
                          <div className="text-[16px] font-bold text-white group-hover:text-blue-200 transition-colors">{p.address}</div>
                          <div className="text-[13px] text-gray-400 mt-1 font-medium">
                            {[p.city, p.state].filter(Boolean).join(", ")}{p.bedrooms ? ` · ${p.bedrooms}bd` : ""}{p.bathrooms ? ` / ${p.bathrooms}ba` : ""}{p.sqft ? ` · ${p.sqft.toLocaleString()} sf` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={p.status} />
                          {p.price && <span className="text-[16px] font-extrabold text-white">{formatPrice(p.price)}</span>}
                          <span className="text-gray-500 text-xl group-hover:text-blue-400 transition-colors">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2+: Media Grid */}
            {step >= 2 && selectedProperty && (
              <>
                {/* Property bar */}
                <div className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-3.5 flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={handleStartOver} className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                      <div className="text-[17px] font-extrabold text-white">{selectedProperty.address}</div>
                      <div className="text-[13px] text-gray-400 font-medium">
                        {[selectedProperty.city, selectedProperty.state].filter(Boolean).join(", ")}{selectedProperty.price ? ` · ${formatPrice(selectedProperty.price)}` : ""}
                        <span className="text-blue-400 font-bold ml-1.5">· {getPostType(selectedProperty.status)}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={selectedProperty.status} />
                </div>

                {/* Filters */}
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {MEDIA_FILTERS.map((f) => mediaCounts[f.key] > 0 || f.key === "all" ? (
                    <button key={f.key} onClick={() => setMediaFilter(f.key)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-bold border transition-colors ${mediaFilter === f.key ? "border-blue-500 bg-blue-950/50 text-blue-300" : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"}`}>
                      {f.label}{mediaCounts[f.key] > 0 && <span className="ml-1 opacity-60">({mediaCounts[f.key]})</span>}
                    </button>
                  ) : null)}
                </div>

                {/* Media grid */}
                {loadingMedia ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading media...</div>
                ) : filteredMedia.length === 0 ? (
                  <div className="text-center py-16 rounded-xl border border-gray-700 bg-gray-900 mb-4">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-sm font-bold text-white">No media found</p>
                    <p className="text-xs text-gray-400 mt-1">{mediaFilter !== "all" ? `No ${mediaFilter} assets. Try "All".` : "Order photos or create designs to populate your library."}</p>
                  </div>
                ) : (
                  <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                    {filteredMedia.filter((m) => m.type !== "description").map((m) => {
                      const isSel = selectedMedia.some((s) => s.id === m.id);
                      const selIndex = selectedMedia.findIndex((s) => s.id === m.id);
                      const isVideo = m.type === "video" || m.type === "clip" || m.type === "remix";
                      const thumb = getBestThumb(m);

                      const placeholderConfig: Record<string, { icon: string; bg: string }> = {
                        photo: { icon: "📷", bg: "bg-blue-900/40" }, video: { icon: "🎬", bg: "bg-purple-900/40" },
                        clip: { icon: "🎞️", bg: "bg-purple-900/40" }, flyer: { icon: "📄", bg: "bg-indigo-900/40" },
                        staging: { icon: "🛋️", bg: "bg-teal-900/40" }, remix: { icon: "🎵", bg: "bg-pink-900/40" }, drone: { icon: "🚁", bg: "bg-sky-900/40" },
                      };
                      const placeholder = placeholderConfig[m.type] || placeholderConfig.photo;

                      return (
                        <button key={m.id} onClick={() => handleSelectMedia(m)}
                          className={`rounded-xl overflow-hidden text-left border-2 transition-all relative group ${isSel ? "border-blue-500 bg-blue-950/40" : "border-gray-600 bg-gray-800 hover:border-gray-500"}`}>
                          {thumb ? (
                            <div className="relative w-full h-[115px] bg-gray-700">
                              <img src={thumb} alt={m.label || ""} className="w-full h-full object-cover"
                                onError={(e) => {
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) { (e.target as HTMLImageElement).style.display = "none"; parent.classList.add("flex", "items-center", "justify-center");
                                    const span = document.createElement("span"); span.className = "text-3xl"; span.textContent = placeholder.icon; parent.appendChild(span); }
                                }} />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center">
                                    <div className="ml-1 w-0 h-0 border-l-[12px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`w-full h-[115px] ${placeholder.bg} flex flex-col items-center justify-center gap-1`}>
                              <span className="text-3xl">{placeholder.icon}</span>
                              <span className="text-[10px] text-gray-400 font-semibold uppercase">{m.type}</span>
                            </div>
                          )}
                          <div className="px-3 py-2">
                            <div className="text-[12px] font-bold text-gray-100 truncate">{m.label || m.type}</div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{m.type}</div>
                          </div>
                          {isSel && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 border-2 border-blue-300 flex items-center justify-center text-[11px] font-bold text-white">
                              {selectedMedia.length > 1 ? selIndex + 1 : <Check className="w-3.5 h-3.5" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Generate button */}
                {step === 2 && (
                  <div className="sticky bottom-0 pt-3 pb-1 bg-gray-950">
                    <button disabled={selectedMedia.length === 0 || isGenerating} onClick={handleGenerateCaption}
                      className={`w-full py-4 rounded-xl text-[16px] font-extrabold tracking-tight transition-all ${selectedMedia.length === 0 || isGenerating ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"}`}>
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating your post...</span>
                      ) : selectedMedia.length > 0 ? (
                        <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Generate {getPostType(selectedProperty.status)} Post{selectedMedia.length > 1 && ` (${selectedMedia.length} items)`}</span>
                      ) : "Select media above to generate a post"}
                    </button>
                  </div>
                )}

                {/* STEP 3: Post Preview + Share */}
                {step === 3 && generatedCaption && (
                  <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h2 className="text-[17px] font-extrabold text-white">Your Post</h2>
                        <p className="text-[12px] text-gray-400 mt-0.5">{selectedMedia.length} {selectedMedia.length === 1 ? "item" : "items"} selected · Edit caption below</p>
                      </div>
                      <button onClick={() => { if (selectedProperty) setGeneratedCaption(generateLocalCaption(selectedProperty)); }}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" /> New Version
                      </button>
                    </div>

                    {/* Media preview strip */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {selectedMedia.map((m) => {
                        const thumb = getBestThumb(m);
                        const placeholders: Record<string, string> = { video: "🎬", clip: "🎞️", flyer: "📄", staging: "🛋️", remix: "🎵", drone: "🚁", photo: "📷" };
                        return (
                          <div key={m.id} className="shrink-0 rounded-lg overflow-hidden border border-gray-600 bg-gray-800 relative group" style={{ width: 120, height: 80 }}>
                            {thumb ? (
                              <img src={thumb} alt={m.label || ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center">
                                <span className="text-2xl">{placeholders[m.type] || "📷"}</span>
                                <span className="text-[9px] text-gray-400 font-semibold mt-0.5">{m.type.toUpperCase()}</span>
                              </div>
                            )}
                            <button
                              onClick={() => setSelectedMedia((prev) => prev.filter((s) => s.id !== m.id))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center transition-colors"
                              title="Remove"
                            >
                              <span className="text-white text-[11px] font-bold leading-none">✕</span>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                              <span className="text-[9px] text-white font-semibold truncate block">{m.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <textarea value={generatedCaption} onChange={(e) => setGeneratedCaption(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-gray-100 text-[14px] leading-relaxed resize-y outline-none focus:border-blue-500 transition-colors mb-4"
                      style={{ minHeight: 160, fontFamily: "inherit" }} />

                    {/* Step 1: Copy & Download */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => { navigator.clipboard.writeText(generatedCaption); setCopied("caption"); setTimeout(() => setCopied(null), 2500); }}
                        className={`flex-1 py-3 rounded-xl text-[14px] font-extrabold flex items-center justify-center gap-2 transition-all ${
                          copied === "caption" ? "bg-green-600 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        {copied === "caption" ? <><Check className="w-4 h-4" /> Caption Copied!</> : <><Copy className="w-4 h-4" /> Copy Caption</>}
                      </button>
                      <button
                        onClick={() => { selectedMedia.forEach((m) => { if (m.assetUrl) window.open(m.assetUrl, "_blank"); }); }}
                        className="flex-1 py-3 rounded-xl text-[14px] font-extrabold bg-gray-800 border border-gray-500 text-gray-200 hover:bg-gray-700 flex items-center justify-center gap-2 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Media {selectedMedia.length > 1 ? `(${selectedMedia.length})` : ""}
                      </button>
                    </div>

                    {/* Step 2: Share to platform */}
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Share to</p>
                    <div className="flex gap-2">
                      {[{ key: "facebook", label: "Facebook", color: "#1877F2" }, { key: "instagram", label: "Instagram", color: "#E4405F" }, { key: "linkedin", label: "LinkedIn", color: "#0A66C2" }].map((p) => (
                        <button key={p.key}
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCaption);
                            setCopied(p.key); setTimeout(() => setCopied(null), 2500);
                            const text = encodeURIComponent(generatedCaption);
                            const urls: Record<string, string | null> = {
                              facebook: `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
                              linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://p2v.homes")}&summary=${text}`,
                              instagram: null,
                            };
                            if (urls[p.key]) window.open(urls[p.key]!, "_blank", "width=600,height=500");
                            try { fetch("/api/planner/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionType: "social_share", propertyId: selectedProperty?.id, platform: p.key, contentType: getContentType(selectedProperty?.status || "active"), metadata: { mediaCount: selectedMedia.length } }) }); } catch {}
                          }}
                          className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                          style={{ background: copied === p.key ? "#16a34a" : p.color }}>
                          {copied === p.key ? <><Check className="w-4 h-4" /> Copied!</> : <><ExternalLink className="w-3.5 h-3.5" />{p.label}</>}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 text-center">
                      Caption is auto-copied when you click a platform · Paste it into your post along with the downloaded media
                    </p>

                    <div className="mt-5 pt-5 border-t border-gray-700">
                      <button onClick={() => { setSelectedMedia([]); setGeneratedCaption(""); setStep(2); }}
                        className="w-full py-3 rounded-xl text-[14px] font-bold border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                        Create another post for {selectedProperty.address}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
