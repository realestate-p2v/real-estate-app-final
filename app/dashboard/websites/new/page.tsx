"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  User,
  Check,
  Loader2,
  Globe,
  Eye,
  ChevronDown,
  Image as ImageIcon,
  Film,
  FileText,
  Sofa,
  PenTool,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  status: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  website_published: boolean;
}

/* ─── Constants ─── */
const TEMPLATES = [
  {
    id: "modern_clean",
    label: "Modern Clean",
    desc: "White background, clean sans-serif typography, lots of whitespace. Best for residential homes and condos.",
    preview: "bg-white border-gray-200 text-gray-800",
  },
  {
    id: "luxury_dark",
    label: "Luxury Dark",
    desc: "Dark charcoal background, gold accents, elegant serif headings. Best for high-end and luxury properties.",
    preview: "bg-gray-900 border-amber-500/50 text-amber-100",
  },
  {
    id: "classic_light",
    label: "Classic Light",
    desc: "Warm cream background, navy accents, traditional centered layout. Best for suburban and traditional markets.",
    preview: "bg-amber-50 border-blue-900/30 text-blue-900",
  },
];

const MODULE_OPTIONS = [
  { key: "photos", label: "Photo Gallery", icon: ImageIcon, default: true },
  { key: "videos", label: "Video Walkthrough", icon: Film, default: true },
  { key: "description", label: "Property Description", icon: FileText, default: true },
  { key: "staging", label: "Virtual Staging", icon: Sofa, default: true },
  { key: "exports", label: "Marketing Materials", icon: PenTool, default: true },
  { key: "booking", label: "Booking Calendar", icon: CalendarDays, default: false },
  { key: "lead_capture", label: "Lead Capture Form", icon: MessageSquare, default: true, locked: true },
  { key: "lensy", label: "Lensy AI Chat", icon: Sparkles, default: false },
];

const AGENT_MODULE_OPTIONS = [
  { key: "properties", label: "Property Listings", icon: Home, default: true },
  { key: "contact", label: "Contact Page", icon: MessageSquare, default: true },
  { key: "lead_capture", label: "Lead Capture Form", icon: MessageSquare, default: true, locked: true },
  { key: "lensy", label: "Lensy AI Chat", icon: Sparkles, default: false },
  { key: "neighborhood", label: "Neighborhood Tools", icon: Globe, default: false },
  { key: "walk_score", label: "Walk Score", icon: Globe, default: false },
  { key: "booking", label: "Booking Calendar", icon: CalendarDays, default: false },
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

/* ═══════════════════════════════════════════════
   WIZARD PAGE
   ═══════════════════════════════════════════════ */
export default function NewWebsitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1 — Site Type
  const preselectedType = searchParams.get("type") as "property" | "agent" | null;
  const [siteType, setSiteType] = useState<"property" | "agent">(preselectedType || "property");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Step 2 — Template
  const [template, setTemplate] = useState("modern_clean");

  // Step 3 — Content
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [siteName, setSiteName] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [agentBio, setAgentBio] = useState("");

  // Step 4 — Domain
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Init
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/dashboard/websites/new");
        return;
      }
      setUserId(user.id);

      // Fetch properties for the picker
      const { data: props } = await supabase
        .from("agent_properties")
        .select("id, address, city, state, status, property_type, bedrooms, bathrooms, price, website_published")
        .eq("user_id", user.id)
        .is("merged_into_id", null)
        .order("updated_at", { ascending: false });
      setProperties(props || []);

      // Init defaults
      const defaultModules: Record<string, boolean> = {};
      MODULE_OPTIONS.forEach((m) => { defaultModules[m.key] = m.default; });
      setModules(defaultModules);

      // If type was preselected, skip to step 2
      if (preselectedType) {
        setStep(1); // Still show step 1 but with preselection
      }

      setLoading(false);
    };
    init();
  }, [supabase, router, preselectedType]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (siteName) {
      setSlug(generateSlug(siteName));
      setSlugAvailable(null);
    }
  }, [siteName]);

  // When property is selected, auto-fill the site name
  useEffect(() => {
    if (siteType === "property" && selectedPropertyId) {
      const prop = properties.find((p) => p.id === selectedPropertyId);
      if (prop) {
        setSiteName(prop.address);
        setSlug(generateSlug([prop.address, prop.city, prop.state].filter(Boolean).join(" ")));
      }
    }
  }, [selectedPropertyId, siteType, properties]);

  // Check slug availability
  const checkSlug = useCallback(async () => {
    if (!slug.trim()) return;
    setCheckingSlug(true);
    const { data } = await supabase
      .from("site_slugs")
      .select("slug")
      .eq("slug", slug.trim())
      .maybeSingle();
    setSlugAvailable(!data);
    setCheckingSlug(false);
  }, [slug, supabase]);

  useEffect(() => {
    if (slug.trim().length >= 3) {
      const timer = setTimeout(checkSlug, 500);
      return () => clearTimeout(timer);
    } else {
      setSlugAvailable(null);
    }
  }, [slug, checkSlug]);

  // Save website
  const handleCreate = async (publish: boolean) => {
    if (!userId) return;
    setSaving(true);

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName.trim() || "My Website",
          site_type: siteType,
          status: publish ? "published" : "draft",
          slug: slug.trim(),
          template,
          modules,
          property_id: siteType === "property" ? selectedPropertyId : null,
          hero_headline: siteType === "agent" ? heroHeadline : null,
          hero_subheadline: siteType === "agent" ? heroSubheadline : null,
          about_content: siteType === "agent" ? aboutContent : null,
          agent_bio: siteType === "agent" ? agentBio : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to create website: " + (data.error || "Unknown error"));
        setSaving(false);
        return;
      }

      router.push(`/dashboard/websites/${data.id}`);
    } catch (err: any) {
      alert("Failed to create website: " + err.message);
      setSaving(false);
    }
  };

  // Navigation
  const canAdvance = () => {
    switch (step) {
      case 1:
        if (siteType === "property" && !selectedPropertyId) return false;
        if (siteType === "agent" && !siteName.trim()) return false;
        return true;
      case 2:
        return !!template;
      case 3:
        return true;
      case 4:
        return slug.trim().length >= 3 && slugAvailable !== false;
      default:
        return true;
    }
  };

  const stepLabels = ["Type", "Template", "Content", "Domain", "Review"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const activeModules = siteType === "property" ? MODULE_OPTIONS : AGENT_MODULE_OPTIONS;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/websites" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Create Website</h1>
            <p className="text-muted-foreground mt-1">Step {step} of 5 — {stepLabels[step - 1]}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${
                i + 1 <= step ? "bg-accent" : "bg-muted"
              }`} />
              <p className={`text-[10px] font-semibold mt-1.5 ${
                i + 1 === step ? "text-accent" : "text-muted-foreground"
              }`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ═══ STEP 1: SITE TYPE ═══ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">What kind of website?</h2>
              <p className="text-sm text-muted-foreground">Choose the type that fits your needs.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setSiteType("property"); setSelectedPropertyId(null); setSiteName(""); }}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  siteType === "property"
                    ? "border-accent ring-2 ring-accent/30 bg-accent/5"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Property Website</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Showcase a single listing with photos, videos, staging, descriptions, and lead capture.
                </p>
              </button>
              <button
                onClick={() => { setSiteType("agent"); setSelectedPropertyId(null); }}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  siteType === "agent"
                    ? "border-accent ring-2 ring-accent/30 bg-accent/5"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Agent Portfolio</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Multi-page brand site with all your listings, bio, about page, contact, and neighborhood tools.
                </p>
              </button>
            </div>

            {/* Property picker */}
            {siteType === "property" && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Select a property</label>
                {properties.length === 0 ? (
                  <div className="bg-muted/30 rounded-xl border border-border p-6 text-center">
                    <Home className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No properties found. Add one first.</p>
                    <Button asChild variant="outline" size="sm" className="font-semibold">
                      <Link href="/dashboard/properties?add=true">Add a Property</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-border p-2">
                    {properties.map((prop) => {
                      const isSelected = selectedPropertyId === prop.id;
                      return (
                        <button
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "border-accent bg-accent/5"
                              : "border-transparent hover:border-accent/20 hover:bg-muted/30"
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-accent bg-accent" : "border-border"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{prop.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {[prop.city, prop.state].filter(Boolean).join(", ")}
                              {prop.bedrooms && ` · ${prop.bedrooms}bd`}
                              {prop.bathrooms && ` / ${prop.bathrooms}ba`}
                              {prop.price && ` · $${prop.price.toLocaleString()}`}
                            </p>
                          </div>
                          {prop.website_published && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                              Has website
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Agent site name */}
            {siteType === "agent" && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Website name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Tres Amigos Realty"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <p className="text-xs text-muted-foreground mt-1.5">This will be your site title and subdomain.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: TEMPLATE ═══ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Choose a template</h2>
              <p className="text-sm text-muted-foreground">Pick the look that matches your brand.</p>
            </div>

            <div className="space-y-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
                    template === t.id
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-24 rounded-lg border flex items-center justify-center flex-shrink-0 ${t.preview}`}>
                      <span className="text-sm font-bold">Aa</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{t.label}</h3>
                        {template === t.id && (
                          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: CONTENT ═══ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                {siteType === "property" ? "Configure your property page" : "Set up your portfolio"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {siteType === "property"
                  ? "Choose which sections to show. Content is pulled from your property portfolio."
                  : "Add your branding and choose which pages to include."}
              </p>
            </div>

            {/* Agent site content fields */}
            {siteType === "agent" && (
              <div className="space-y-4 bg-card rounded-2xl border border-border p-6">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hero Headline</label>
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="Your Austin Real Estate Expert"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hero Subheadline</label>
                  <input
                    type="text"
                    value={heroSubheadline}
                    onChange={(e) => setHeroSubheadline(e.target.value)}
                    placeholder="Helping families find their dream home since 2010"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">About</label>
                  <textarea
                    value={aboutContent}
                    onChange={(e) => setAboutContent(e.target.value)}
                    placeholder="Tell visitors about yourself and your business..."
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Agent Bio</label>
                  <textarea
                    value={agentBio}
                    onChange={(e) => setAgentBio(e.target.value)}
                    placeholder="A short bio for your agent card..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Module toggles */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-3">
                {siteType === "property" ? "Sections to show" : "Pages & features"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {activeModules.map(({ key, label, icon: Icon, default: def, locked }) => {
                  const isOn = locked ? true : (modules[key] ?? def);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (locked) return;
                        setModules((prev) => ({ ...prev, [key]: !isOn }));
                      }}
                      disabled={locked}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        isOn ? "border-accent/40 bg-accent/5" : "border-border hover:border-accent/20"
                      } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isOn ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                        {locked && <p className="text-[9px] text-muted-foreground">Always on</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {siteType === "property" && selectedProperty && (
              <div className="bg-muted/30 rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Content will be pulled from your property portfolio for <span className="font-semibold text-foreground">{selectedProperty.address}</span>.
                  You can curate specific assets after creating the website.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: DOMAIN ═══ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Choose your subdomain</h2>
              <p className="text-sm text-muted-foreground">Your website will be live at this address instantly.</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80));
                    setSlugAvailable(null);
                  }}
                  placeholder="my-listing"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <span className="text-sm text-muted-foreground flex-shrink-0">.p2v.homes</span>
              </div>

              {/* Availability indicator */}
              <div className="mt-3">
                {checkingSlug && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {!checkingSlug && slugAvailable === true && slug.trim().length >= 3 && (
                  <p className="text-xs text-green-600 flex items-center gap-1.5">
                    <Check className="h-3 w-3" /> {slug}.p2v.homes is available
                  </p>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> {slug}.p2v.homes is already taken
                  </p>
                )}
              </div>

              {/* Preview */}
              {slug.trim().length >= 3 && slugAvailable !== false && (
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Your website URL</p>
                  <p className="text-sm font-bold text-foreground">https://{slug}.p2v.homes</p>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">
                Custom domains (like yourname.com) are coming soon. For now, all sites use .p2v.homes subdomains with free hosting included.
              </p>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: REVIEW ═══ */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Review & launch</h2>
              <p className="text-sm text-muted-foreground">Everything looks good? Publish now or save as a draft.</p>
            </div>

            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              {/* Type */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Site Type</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {siteType === "property" ? "Property Website" : "Agent Portfolio"}
                  </p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
              </div>

              {/* Property */}
              {siteType === "property" && selectedProperty && (
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Property</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedProperty.address}</p>
                    <p className="text-xs text-muted-foreground">{[selectedProperty.city, selectedProperty.state].filter(Boolean).join(", ")}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
                </div>
              )}

              {/* Name (agent) */}
              {siteType === "agent" && (
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Site Name</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{siteName}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
                </div>
              )}

              {/* Template */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Template</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {TEMPLATES.find((t) => t.id === template)?.label || template}
                  </p>
                </div>
                <button onClick={() => setStep(2)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
              </div>

              {/* Modules */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Enabled Sections</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {Object.entries(modules)
                      .filter(([, v]) => v)
                      .map(([k]) => {
                        const m = [...MODULE_OPTIONS, ...AGENT_MODULE_OPTIONS].find((o) => o.key === k);
                        return m?.label || k;
                      })
                      .join(", ")}
                  </p>
                </div>
                <button onClick={() => setStep(3)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
              </div>

              {/* Domain */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Domain</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{slug}.p2v.homes</p>
                </div>
                <button onClick={() => setStep(4)} className="text-xs font-semibold text-accent hover:text-accent/80">Edit</button>
              </div>
            </div>

            {/* Launch buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => handleCreate(true)}
                disabled={saving}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-black py-3"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>
                ) : (
                  <><Globe className="h-4 w-4 mr-2" />Publish Now</>
                )}
              </Button>
              <Button
                onClick={() => handleCreate(false)}
                disabled={saving}
                variant="outline"
                className="font-bold py-3"
              >
                Save as Draft
              </Button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button
              onClick={() => setStep(Math.max(1, step - 1))}
              variant="outline"
              disabled={step === 1}
              className="font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep(Math.min(5, step + 1))}
              disabled={!canAdvance()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
