"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Home,
  Search,
  Key,
  CheckCircle,
  Circle,
  Loader2,
  RefreshCw,
  Download,
  Sparkles,
  Lock,
  Crown,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────── */
const pageStyles = `
  @keyframes rp-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rp-pulse {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 1; }
  }
  .rp-animate {
    opacity: 0;
    animation: rp-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .rp-pulse {
    animation: rp-pulse 1.5s ease-in-out infinite;
  }
`;

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
type ReportType = "seller" | "buyer" | null;
type Step = 1 | 2 | 3 | 4 | 5;

interface ReportSection {
  title: string;
  content: string;
  status: "pending" | "generating" | "done";
}

interface PropertyOption {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  price: number | null;
  special_features: string[] | null;
  amenities: string[] | null;
  property_type: string | null;
  year_built: string | null;
  lot_size: string | null;
}

interface AgentInfo {
  saved_agent_name: string | null;
  saved_phone: string | null;
  saved_email: string | null;
  saved_company: string | null;
  saved_website: string | null;
  saved_headshot_url: string | null;
  saved_logo_url: string | null;
  saved_branding_cards: { url: string; template?: string }[] | null;
}

const SELLER_SECTIONS = [
  "MARKET SNAPSHOT",
  "PRE-LISTING PREPARATION",
  "PHOTO DAY GUIDE",
  "PRICING STRATEGY",
  "YOUR MARKETING PLAN",
  "TIMELINE TO CLOSE",
];

const BUYER_SECTIONS = [
  "AREA SPOTLIGHT",
  "MARKET CONDITIONS",
  "WHAT YOUR BUDGET GETS YOU",
  "HIDDEN VALUE OPPORTUNITIES",
  "THE BUYING PROCESS",
  "FINANCIAL SNAPSHOT",
  "WHY NOW IS THE RIGHT TIME",
];

/* ═══════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════ */
export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [reportType, setReportType] = useState<ReportType>(null);

  // Form state — seller
  const [sellerName, setSellerName] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerBeds, setSellerBeds] = useState("");
  const [sellerBaths, setSellerBaths] = useState("");
  const [sellerSqft, setSellerSqft] = useState("");
  const [sellerPrice, setSellerPrice] = useState("");
  const [sellerCondition, setSellerCondition] = useState("");
  const [sellerTimeline, setSellerTimeline] = useState("");
  const [sellerIssues, setSellerIssues] = useState("");
  const [sellerTargetBuyer, setSellerTargetBuyer] = useState("");

  // Form state — buyer
  const [buyerName, setBuyerName] = useState("");
  const [buyerBudgetMin, setBuyerBudgetMin] = useState("");
  const [buyerBudgetMax, setBuyerBudgetMax] = useState("");
  const [buyerArea, setBuyerArea] = useState("");
  const [buyerCityState, setBuyerCityState] = useState("");
  const [buyerBedrooms, setBuyerBedrooms] = useState("");
  const [buyerBathrooms, setBuyerBathrooms] = useState("");
  const [buyerMustHaves, setBuyerMustHaves] = useState("");
  const [buyerNiceToHaves, setBuyerNiceToHaves] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [buyerTimeline, setBuyerTimeline] = useState("");
  const [buyerPreApproved, setBuyerPreApproved] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");

  // Generation state
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  const streamRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

    const init = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);
      const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);

      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_headshot_url, saved_logo_url, saved_branding_cards")
        .eq("user_id", user.id)
        .single();

      if (isAdmin) {
        setIsSubscriber(true);
        setIsPro(true);
      } else if (usage?.is_subscriber) {
        setIsSubscriber(true);
        // For now treat all subscribers as Pro-capable for reports
        // Later: check subscription_tier === "pro"
        setIsPro(true);
      }

      if (usage) {
        setAgentInfo({
          saved_agent_name: usage.saved_agent_name,
          saved_phone: usage.saved_phone,
          saved_email: usage.saved_email,
          saved_company: usage.saved_company,
          saved_website: usage.saved_website,
          saved_headshot_url: usage.saved_headshot_url,
          saved_logo_url: usage.saved_logo_url,
          saved_branding_cards: usage.saved_branding_cards,
        });
      }

      // Fetch properties for selector
      const { data: props } = await supabase
        .from("agent_properties")
        .select("id, address, city, state, bedrooms, bathrooms, sqft, price, special_features, amenities, property_type, year_built, lot_size")
        .eq("user_id", user.id)
        .is("merged_into_id", null)
        .order("updated_at", { ascending: false });

      if (props) setProperties(props);

      setIsLoading(false);
    };
    init();
  }, []);

  // Auto-fill seller fields when property selected
  useEffect(() => {
    if (!selectedPropertyId) return;
    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (!prop) return;
    setSellerAddress([prop.address, prop.city, prop.state].filter(Boolean).join(", "));
    if (prop.bedrooms) setSellerBeds(String(prop.bedrooms));
    if (prop.bathrooms) setSellerBaths(String(prop.bathrooms));
    if (prop.sqft) setSellerSqft(String(prop.sqft));
    if (prop.price) setSellerPrice(String(prop.price));
  }, [selectedPropertyId, properties]);

  /* ─── Generation ─── */
  const handleGenerate = useCallback(async () => {
    if (!reportType) return;

    const sectionNames = reportType === "seller" ? SELLER_SECTIONS : BUYER_SECTIONS;
    const initialSections: ReportSection[] = sectionNames.map((title) => ({
      title,
      content: "",
      status: "pending",
    }));
    setSections(initialSections);
    setIsGenerating(true);
    setGenerationError(null);
    setStep(3);

    const controller = new AbortController();
    streamRef.current = controller;

    try {
      const formData = reportType === "seller"
        ? {
            reportType: "Seller Guide",
            clientName: sellerName,
            address: sellerAddress,
            bedrooms: sellerBeds,
            bathrooms: sellerBaths,
            sqft: sellerSqft,
            askingPrice: sellerPrice,
            condition: sellerCondition,
            timeline: sellerTimeline,
            knownIssues: sellerIssues,
            targetBuyerProfile: sellerTargetBuyer,
          }
        : {
            reportType: "Buyer Guide",
            clientName: buyerName,
            budgetMin: buyerBudgetMin,
            budgetMax: buyerBudgetMax,
            desiredArea: buyerArea,
            cityState: buyerCityState,
            minBedrooms: buyerBedrooms,
            minBathrooms: buyerBathrooms,
            mustHaves: buyerMustHaves,
            niceToHaves: buyerNiceToHaves,
            buyerType,
            timeline: buyerTimeline,
            preApproved: buyerPreApproved,
            notes: buyerNotes,
          };

      const res = await fetch("/api/lens/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agentName: agentInfo?.saved_agent_name || "",
          agentCompany: agentInfo?.saved_company || "",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to generate report");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullText = "";
      let currentSectionIdx = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        // Parse sections from the accumulated text
        const updatedSections = [...initialSections];
        let remaining = fullText;

        for (let i = 0; i < sectionNames.length; i++) {
          const sectionHeader = sectionNames[i];
          const headerIdx = remaining.indexOf(sectionHeader);

          if (headerIdx === -1) {
            // Haven't reached this section yet
            if (i === currentSectionIdx && i > 0) {
              // Previous section still generating
              updatedSections[i].status = "pending";
            }
            break;
          }

          // Find the start of content (after the header line)
          const afterHeader = remaining.indexOf("\n", headerIdx);
          if (afterHeader === -1) {
            updatedSections[i].status = "generating";
            updatedSections[i].content = "";
            break;
          }

          // Find the end of this section (next header or end of text)
          let endIdx = remaining.length;
          for (let j = i + 1; j < sectionNames.length; j++) {
            const nextHeaderIdx = remaining.indexOf(sectionNames[j], afterHeader);
            if (nextHeaderIdx !== -1) {
              endIdx = nextHeaderIdx;
              break;
            }
          }

          const sectionContent = remaining.substring(afterHeader + 1, endIdx).trim();
          updatedSections[i].content = sectionContent;

          // Check if this section is complete (next section started or all text done)
          const nextSectionStarted = i < sectionNames.length - 1 && remaining.indexOf(sectionNames[i + 1], afterHeader) !== -1;

          if (nextSectionStarted) {
            updatedSections[i].status = "done";
            currentSectionIdx = i + 1;
          } else {
            updatedSections[i].status = "generating";
            currentSectionIdx = i;
          }
        }

        // Mark current as generating
        if (currentSectionIdx < sectionNames.length) {
          updatedSections[currentSectionIdx].status = updatedSections[currentSectionIdx].content ? "generating" : "generating";
          // Mark all after as pending
          for (let j = currentSectionIdx + 1; j < sectionNames.length; j++) {
            if (updatedSections[j].status !== "done") {
              updatedSections[j].status = "pending";
            }
          }
        }

        setSections(updatedSections);
      }

      // Mark all as done
      setSections((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setIsGenerating(false);
      setStep(4);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setGenerationError("Something went wrong generating the report. Please try again.");
      setIsGenerating(false);
    }
  }, [
    reportType, sellerName, sellerAddress, sellerBeds, sellerBaths, sellerSqft,
    sellerPrice, sellerCondition, sellerTimeline, sellerIssues, sellerTargetBuyer,
    buyerName, buyerBudgetMin, buyerBudgetMax, buyerArea, buyerCityState,
    buyerBedrooms, buyerBathrooms, buyerMustHaves, buyerNiceToHaves, buyerType,
    buyerTimeline, buyerPreApproved, buyerNotes, agentInfo,
  ]);

  /* ─── Regenerate single section ─── */
  const handleRegenerateSection = async (idx: number) => {
    setRegeneratingIdx(idx);
    const section = sections[idx];

    try {
      const formData = reportType === "seller"
        ? {
            reportType: "Seller Guide",
            clientName: sellerName,
            address: sellerAddress,
            bedrooms: sellerBeds,
            bathrooms: sellerBaths,
            sqft: sellerSqft,
            askingPrice: sellerPrice,
            condition: sellerCondition,
            timeline: sellerTimeline,
            knownIssues: sellerIssues,
            targetBuyerProfile: sellerTargetBuyer,
          }
        : {
            reportType: "Buyer Guide",
            clientName: buyerName,
            budgetMin: buyerBudgetMin,
            budgetMax: buyerBudgetMax,
            desiredArea: buyerArea,
            cityState: buyerCityState,
            minBedrooms: buyerBedrooms,
            minBathrooms: buyerBathrooms,
            mustHaves: buyerMustHaves,
            niceToHaves: buyerNiceToHaves,
            buyerType,
            timeline: buyerTimeline,
            preApproved: buyerPreApproved,
            notes: buyerNotes,
          };

      const res = await fetch("/api/lens/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agentName: agentInfo?.saved_agent_name || "",
          agentCompany: agentInfo?.saved_company || "",
          regenerateSection: section.title,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });

        // Extract just the section content (strip the header if present)
        let cleaned = text;
        const headerIdx = cleaned.indexOf(section.title);
        if (headerIdx !== -1) {
          const afterHeader = cleaned.indexOf("\n", headerIdx);
          if (afterHeader !== -1) {
            cleaned = cleaned.substring(afterHeader + 1);
          }
        }

        setSections((prev) => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], content: cleaned.trim(), status: "generating" };
          return updated;
        });
      }

      setSections((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: "done" };
        return updated;
      });
    } catch {
      // Keep existing content on failure
    }
    setRegeneratingIdx(null);
  };

  /* ─── Download PDF ─── */
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const clientName = reportType === "seller" ? sellerName : buyerName;
      const reportTitle = reportType === "seller"
        ? `Seller's Guide to ${sellerAddress || "Your Property"}`
        : `Buyer's Guide to ${buyerArea || buyerCityState || "Your New Home"}`;

      const res = await fetch("/api/lens/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          reportTitle,
          clientName,
          sections: sections.map((s) => ({ title: s.title, content: s.content })),
          agent: agentInfo,
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-guide-${clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStep(5);
    } catch {
      alert("Failed to generate PDF. Please try again.");
    }
    setIsDownloading(false);
  };

  /* ─── Render ─── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  const canGenerate = reportType === "seller"
    ? sellerName.trim() && sellerAddress.trim()
    : buyerName.trim() && buyerBudgetMin.trim() && buyerBudgetMax.trim() && buyerArea.trim() && buyerCityState.trim();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 20% 30%, rgba(56, 189, 248, 0.04) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 80% 70%, rgba(99, 102, 241, 0.03) 0%, transparent 60%)
        `,
      }} />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="rp-animate flex items-center gap-3 mb-8" style={{ animationDelay: "0.05s" }}>
          <Link href="/dashboard/lens" className="text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Custom Reports</h1>
            <p className="mt-0.5 text-sm text-white/40">Generate branded buyer and seller guides for your clients</p>
          </div>
        </div>

        {/* ═══ GATE: Not subscribed ═══ */}
        {!isSubscriber && (
          <div className="rp-animate rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center" style={{ animationDelay: "0.1s" }}>
            <Lock className="h-10 w-10 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white/90 mb-2">Custom Reports are a Lens Pro feature</h2>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
              Generate branded buyer and seller guides. AI writes professional content, you edit and download as a beautiful PDF with your branding.
            </p>
            <Link href="/lens#pricing">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to P2V Lens
              </Button>
            </Link>
          </div>
        )}

        {/* ═══ WIZARD ═══ */}
        {isSubscriber && (
          <>
            {/* Progress */}
            <div className="rp-animate mb-8" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step >= s
                        ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30"
                        : "bg-white/[0.04] text-white/25 border border-white/[0.06]"
                    }`}>
                      {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    {s < 5 && (
                      <div className={`h-0.5 flex-1 rounded-full transition-all ${
                        step > s ? "bg-cyan-400/30" : "bg-white/[0.06]"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 px-1">
                {["Type", "Details", "Generate", "Review", "Done"].map((label, i) => (
                  <span key={label} className={`text-[10px] font-bold uppercase tracking-wider ${
                    step >= i + 1 ? "text-cyan-400/60" : "text-white/20"
                  }`}>{label}</span>
                ))}
              </div>
            </div>

            {/* ═══ STEP 1: Choose Type ═══ */}
            {step === 1 && (
              <div className="rp-animate space-y-4" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-lg font-bold text-white/90 mb-4">Choose Report Type</h2>

                <button
                  onClick={() => { setReportType("seller"); setStep(2); }}
                  className={`w-full group text-left rounded-2xl border p-6 transition-all ${
                    reportType === "seller"
                      ? "border-cyan-400/30 bg-cyan-400/[0.08]"
                      : "border-white/[0.06] bg-white/[0.03] hover:border-cyan-400/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20">
                      <Home className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white/90 group-hover:text-cyan-300 transition-colors">Seller Guide</p>
                      <p className="mt-1 text-sm text-white/45 leading-relaxed">
                        Help your seller prepare their home for a successful listing. Market analysis, prep checklist, photo day guide, pricing strategy, and marketing plan.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setReportType("buyer"); setStep(2); }}
                  className={`w-full group text-left rounded-2xl border p-6 transition-all ${
                    reportType === "buyer"
                      ? "border-cyan-400/30 bg-cyan-400/[0.08]"
                      : "border-white/[0.06] bg-white/[0.03] hover:border-cyan-400/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 ring-1 ring-blue-400/20">
                      <Key className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white/90 group-hover:text-cyan-300 transition-colors">Buyer Guide</p>
                      <p className="mt-1 text-sm text-white/45 leading-relaxed">
                        Help your buyer find confidence in their purchase decision. Area spotlight, market conditions, budget analysis, buying process, and financial overview.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ═══ STEP 2: Fill In Details ═══ */}
            {step === 2 && reportType === "seller" && (
              <div className="rp-animate space-y-6" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white/90">Seller Details</h2>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-white/40 hover:text-white/60 transition-colors">
                    ← Change type
                  </button>
                </div>

                <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                  {/* Seller name */}
                  <div>
                    <Label className="text-sm font-bold text-white/70">Seller Name <span className="text-red-400">*</span></Label>
                    <Input
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. John & Sarah Smith"
                      className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30"
                    />
                  </div>

                  {/* Property selector */}
                  <div>
                    <Label className="text-sm font-bold text-white/70">Property Address <span className="text-red-400">*</span></Label>
                    {properties.length > 0 && (
                      <div className="relative mt-1.5">
                        <select
                          value={selectedPropertyId || ""}
                          onChange={(e) => setSelectedPropertyId(e.target.value || null)}
                          className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none"
                        >
                          <option value="" className="bg-gray-900 text-white/50">Select a property to auto-fill...</option>
                          {properties.map((p) => (
                            <option key={p.id} value={p.id} className="bg-gray-900">
                              {p.address}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      </div>
                    )}
                    <Input
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      placeholder="123 Main St, Austin, TX 78701"
                      className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30"
                    />
                  </div>

                  {/* Beds / Baths / Sqft */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-white/50">Bedrooms</Label>
                      <Input value={sellerBeds} onChange={(e) => setSellerBeds(e.target.value)} type="number" placeholder="3" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-white/50">Bathrooms</Label>
                      <Input value={sellerBaths} onChange={(e) => setSellerBaths(e.target.value)} type="number" placeholder="2" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-white/50">Sqft</Label>
                      <Input value={sellerSqft} onChange={(e) => setSellerSqft(e.target.value)} type="number" placeholder="1850" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Asking Price (or estimated)</Label>
                    <Input value={sellerPrice} onChange={(e) => setSellerPrice(e.target.value)} type="number" placeholder="425000" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                  </div>

                  {/* Condition */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Property Condition</Label>
                    <div className="relative mt-1">
                      <select value={sellerCondition} onChange={(e) => setSellerCondition(e.target.value)} className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none">
                        <option value="" className="bg-gray-900 text-white/50">Select...</option>
                        <option value="Excellent" className="bg-gray-900">Excellent</option>
                        <option value="Good" className="bg-gray-900">Good</option>
                        <option value="Fair" className="bg-gray-900">Fair</option>
                        <option value="Needs Work" className="bg-gray-900">Needs Work</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Timeline to Sell</Label>
                    <div className="relative mt-1">
                      <select value={sellerTimeline} onChange={(e) => setSellerTimeline(e.target.value)} className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none">
                        <option value="" className="bg-gray-900 text-white/50">Select...</option>
                        <option value="ASAP" className="bg-gray-900">ASAP</option>
                        <option value="1-3 months" className="bg-gray-900">1-3 months</option>
                        <option value="3-6 months" className="bg-gray-900">3-6 months</option>
                        <option value="6+ months" className="bg-gray-900">6+ months</option>
                        <option value="Not sure" className="bg-gray-900">Not sure</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </div>

                  {/* Known issues */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Known Issues or Notes</Label>
                    <Textarea value={sellerIssues} onChange={(e) => setSellerIssues(e.target.value)} placeholder="Any known repairs needed, HOA restrictions, etc." rows={3} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30 resize-none" />
                  </div>

                  {/* Target buyer */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Target Buyer Profile</Label>
                    <Input value={sellerTargetBuyer} onChange={(e) => setSellerTargetBuyer(e.target.value)} placeholder="e.g. young families, downsizers, investors" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-6 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Seller Guide
                </Button>
              </div>
            )}

            {step === 2 && reportType === "buyer" && (
              <div className="rp-animate space-y-6" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white/90">Buyer Details</h2>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-white/40 hover:text-white/60 transition-colors">
                    ← Change type
                  </button>
                </div>

                <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                  {/* Buyer name */}
                  <div>
                    <Label className="text-sm font-bold text-white/70">Buyer Name <span className="text-red-400">*</span></Label>
                    <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="e.g. Mike & Lisa Johnson" className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                  </div>

                  {/* Budget */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-bold text-white/70">Budget Min <span className="text-red-400">*</span></Label>
                      <Input value={buyerBudgetMin} onChange={(e) => setBuyerBudgetMin(e.target.value)} type="number" placeholder="300000" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-white/70">Budget Max <span className="text-red-400">*</span></Label>
                      <Input value={buyerBudgetMax} onChange={(e) => setBuyerBudgetMax(e.target.value)} type="number" placeholder="450000" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                  </div>

                  {/* Area */}
                  <div>
                    <Label className="text-sm font-bold text-white/70">Desired Area / Neighborhood <span className="text-red-400">*</span></Label>
                    <Input value={buyerArea} onChange={(e) => setBuyerArea(e.target.value)} placeholder="e.g. South Austin, Zilker, Barton Hills" className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                  </div>

                  {/* City, State */}
                  <div>
                    <Label className="text-sm font-bold text-white/70">City, State <span className="text-red-400">*</span></Label>
                    <Input value={buyerCityState} onChange={(e) => setBuyerCityState(e.target.value)} placeholder="Austin, TX" className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                  </div>

                  {/* Beds / Baths */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-white/50">Min Bedrooms</Label>
                      <Input value={buyerBedrooms} onChange={(e) => setBuyerBedrooms(e.target.value)} type="number" placeholder="3" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-white/50">Min Bathrooms</Label>
                      <Input value={buyerBathrooms} onChange={(e) => setBuyerBathrooms(e.target.value)} type="number" placeholder="2" className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30" />
                    </div>
                  </div>

                  {/* Must-haves */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Must-Haves</Label>
                    <Textarea value={buyerMustHaves} onChange={(e) => setBuyerMustHaves(e.target.value)} placeholder="e.g. garage, pool, good schools, walk to shops" rows={2} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30 resize-none" />
                  </div>

                  {/* Nice-to-haves */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Nice-to-Haves</Label>
                    <Textarea value={buyerNiceToHaves} onChange={(e) => setBuyerNiceToHaves(e.target.value)} placeholder="e.g. home office, large backyard, updated kitchen" rows={2} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30 resize-none" />
                  </div>

                  {/* Buyer type */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Buyer Type</Label>
                    <div className="relative mt-1">
                      <select value={buyerType} onChange={(e) => setBuyerType(e.target.value)} className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none">
                        <option value="" className="bg-gray-900 text-white/50">Select...</option>
                        <option value="First-time" className="bg-gray-900">First-time Buyer</option>
                        <option value="Move-up" className="bg-gray-900">Move-up Buyer</option>
                        <option value="Downsizer" className="bg-gray-900">Downsizer</option>
                        <option value="Investor" className="bg-gray-900">Investor</option>
                        <option value="Relocating" className="bg-gray-900">Relocating</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Timeline</Label>
                    <div className="relative mt-1">
                      <select value={buyerTimeline} onChange={(e) => setBuyerTimeline(e.target.value)} className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none">
                        <option value="" className="bg-gray-900 text-white/50">Select...</option>
                        <option value="ASAP" className="bg-gray-900">ASAP</option>
                        <option value="1-3 months" className="bg-gray-900">1-3 months</option>
                        <option value="3-6 months" className="bg-gray-900">3-6 months</option>
                        <option value="Just exploring" className="bg-gray-900">Just exploring</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </div>

                  {/* Pre-approved */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Pre-approved?</Label>
                    <div className="relative mt-1">
                      <select value={buyerPreApproved} onChange={(e) => setBuyerPreApproved(e.target.value)} className="w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-cyan-400/30 focus:outline-none">
                        <option value="" className="bg-gray-900 text-white/50">Select...</option>
                        <option value="Yes" className="bg-gray-900">Yes</option>
                        <option value="No" className="bg-gray-900">No</option>
                        <option value="Not yet" className="bg-gray-900">Not yet</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs font-bold text-white/50">Additional Notes</Label>
                    <Textarea value={buyerNotes} onChange={(e) => setBuyerNotes(e.target.value)} placeholder="Any other details about the buyer's preferences or situation" rows={3} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-cyan-400/30 resize-none" />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-6 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Buyer Guide
                </Button>
              </div>
            )}

            {/* ═══ STEP 3: Generating ═══ */}
            {step === 3 && (
              <div className="rp-animate space-y-3" style={{ animationDelay: "0.05s" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white/90">
                    {isGenerating ? "Generating your report..." : "Generation complete"}
                  </h2>
                  {isGenerating && (
                    <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                  )}
                </div>

                {generationError && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm text-red-300">
                    {generationError}
                    <Button onClick={handleGenerate} size="sm" variant="outline" className="ml-3 border-red-400/30 text-red-300 hover:bg-red-400/10">
                      Retry
                    </Button>
                  </div>
                )}

                {sections.map((section, idx) => (
                  <div
                    key={section.title}
                    className={`rounded-xl border p-4 transition-all ${
                      section.status === "done"
                        ? "border-cyan-400/15 bg-cyan-400/[0.04]"
                        : section.status === "generating"
                        ? "border-white/[0.08] bg-white/[0.04]"
                        : "border-white/[0.04] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {section.status === "done" && <CheckCircle className="h-4 w-4 text-cyan-400" />}
                      {section.status === "generating" && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
                      {section.status === "pending" && <Circle className="h-4 w-4 text-white/20" />}
                      <span className={`text-sm font-bold ${
                        section.status === "done" ? "text-cyan-400" : section.status === "generating" ? "text-white/70" : "text-white/30"
                      }`}>
                        {section.title}
                      </span>
                    </div>
                    {section.content && (
                      <p className="text-sm text-white/55 leading-relaxed line-clamp-4">{section.content}</p>
                    )}
                    {section.status === "generating" && !section.content && (
                      <div className="h-2 w-32 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full w-1/2 rounded-full bg-cyan-400/30 rp-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ STEP 4: Review & Edit ═══ */}
            {step === 4 && (
              <div className="rp-animate space-y-4" style={{ animationDelay: "0.05s" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white/90">Review & Edit</h2>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold"
                  >
                    {isDownloading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" />Download PDF</>
                    )}
                  </Button>
                </div>

                <p className="text-sm text-white/40 mb-4">Edit any section below before downloading. Click the refresh icon to regenerate a section with AI.</p>

                {sections.map((section, idx) => (
                  <div key={section.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-cyan-400">{section.title}</span>
                      <button
                        onClick={() => handleRegenerateSection(idx)}
                        disabled={regeneratingIdx !== null}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-cyan-400 transition-colors disabled:opacity-30"
                      >
                        {regeneratingIdx === idx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Regenerate
                      </button>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => {
                        setSections((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], content: e.target.value };
                          return updated;
                        });
                      }}
                      rows={8}
                      className="w-full bg-transparent border-0 text-sm text-white/70 leading-relaxed focus:outline-none focus:ring-0 resize-none"
                    />
                  </div>
                ))}

                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-6 text-base"
                >
                  {isDownloading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating PDF...</>
                  ) : (
                    <><Download className="mr-2 h-5 w-5" />Download PDF</>
                  )}
                </Button>
              </div>
            )}

            {/* ═══ STEP 5: Done ═══ */}
            {step === 5 && (
              <div className="rp-animate text-center py-12" style={{ animationDelay: "0.05s" }}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 ring-1 ring-cyan-400/20 mb-6">
                  <CheckCircle className="h-8 w-8 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white/90 mb-2">Report Downloaded!</h2>
                <p className="text-sm text-white/50 mb-8 max-w-md mx-auto">
                  Your {reportType === "seller" ? "Seller" : "Buyer"} Guide has been saved. You can send it directly to your client or print it for your next appointment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Again
                  </Button>
                  <Button
                    onClick={() => { setStep(1); setReportType(null); setSections([]); }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Another Report
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
