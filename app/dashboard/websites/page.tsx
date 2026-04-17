
 "use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DashboardShell,
  useAccent,
} from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Check,
  Loader2,
  Upload,
  User,
  Sparkles,
  Eye,
  Palette,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  CalendarDays,
  FileText,
  Home,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const TEMPLATES = [
  {
    id: "classic",
    label: "Classic",
    desc: "Clean layout, professional typography, versatile for any market.",
    gradient: "from-slate-800 via-slate-700 to-slate-600",
    accent: "#06b6d4",
  },
  {
    id: "modern",
    label: "Modern",
    desc: "Bold sans-serif, generous whitespace, contemporary feel.",
    gradient: "from-zinc-900 via-zinc-800 to-zinc-700",
    accent: "#3b82f6",
  },
  {
    id: "bold",
    label: "Bold",
    desc: "High contrast, dramatic typography, luxury-forward.",
    gradient: "from-gray-950 via-gray-900 to-gray-800",
    accent: "#f59e0b",
  },
];

const PRIMARY_COLORS = [
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#0f172a", label: "Navy" },
  { hex: "#78716c", label: "Stone" },
];

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
];

function generateHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "")
    .replace(/-+/g, "")
    .slice(0, 30);
}

/* ═══════════════════════════════════════════════
   DARK INPUT PRIMITIVES
   ═══════════════════════════════════════════════ */

function DarkInput({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/20 transition-colors"
      />
      {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}

function DarkTextarea({ label, hint, ...props }: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        {...props}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/20 transition-colors resize-none"
      />
      {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEFAULT EXPORT — Suspense wrapper
   ═══════════════════════════════════════════════ */
export default function WebsiteSetupPage() {
  return (
    <DashboardShell accent="sky" maxWidth="3xl">
      <Suspense fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      }>
        <WizardInner />
      </Suspense>
    </DashboardShell>
  );
}

/* ═══════════════════════════════════════════════
   WIZARD COMPONENT
   ═══════════════════════════════════════════════ */
function WizardInner() {
  const router = useRouter();
  const a = useAccent();

  /* ─── Auth + profile state ─── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingSite, setHasExistingSite] = useState(false);
  const [existingHandle, setExistingHandle] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  /* ─── Step tracking ─── */
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  /* ─── Step 1: Your Site ─── */
  const [handle, setHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [siteTitle, setSiteTitle] = useState("");
  const [tagline, setTagline] = useState("");

  /* ─── Step 2: About You ─── */
  const [bio, setBio] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const aboutPhotoRef = useRef<HTMLInputElement>(null);

  /* ─── Step 3: Brand & Design ─── */
  const [template, setTemplate] = useState("classic");
  const [primaryColor, setPrimaryColor] = useState("#06b6d4");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  /* ─── Step 4: Features ─── */
  const [blogEnabled, setBlogEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [reportsPublic, setReportsPublic] = useState(false);
  const [listingsOptIn, setListingsOptIn] = useState(true);

  /* ═══ INIT ═══ */
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login?redirect=/dashboard/websites");
        return;
      }

      const authUser = session.user;
      setUserId(authUser.id);

      // Check if they already have an agent website
      const { data: existing } = await supabase
        .from("agent_websites")
        .select("handle, status")
        .eq("user_id", authUser.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setHasExistingSite(true);
        setExistingHandle(existing[0].handle);
        setExistingStatus(existing[0].status);
        setLoading(false);
        return;
      }

      // Pre-fill from agent profile
      const { data: profile } = await supabase
        .from("lens_usage")
        .select("saved_agent_name, saved_company, saved_phone, saved_email, saved_website, saved_headshot_url, saved_logo_url, saved_location")
        .eq("user_id", authUser.id)
        .limit(1);

      if (profile && profile.length > 0) {
        const p = profile[0];
        const name = p.saved_agent_name || "";
        const company = p.saved_company || "";

        if (name) {
          setSiteTitle(name + (company ? " \u2014 " + company : ""));
          setHandle(generateHandle(name));
        }
        if (p.saved_headshot_url) setAboutPhotoUrl(p.saved_headshot_url);
        if (p.saved_location) setTagline("Your trusted real estate professional in " + p.saved_location);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  /* ═══ HANDLE AVAILABILITY CHECK ═══ */
  const checkHandle = useCallback(async () => {
    if (!handle.trim() || handle.trim().length < 3) {
      setHandleAvailable(null);
      return;
    }
    setCheckingHandle(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("agent_websites")
      .select("handle")
      .eq("handle", handle.trim().toLowerCase())
      .limit(1);

    setHandleAvailable(!data || data.length === 0);
    setCheckingHandle(false);
  }, [handle]);

  useEffect(() => {
    if (handle.trim().length >= 3) {
      const timer = setTimeout(checkHandle, 600);
      return () => clearTimeout(timer);
    } else {
      setHandleAvailable(null);
    }
  }, [handle, checkHandle]);

  /* ═══ PHOTO UPLOAD ═══ */
  const handlePhotoUpload = async (file: File) => {
    if (!userId) return;
    setUploadingPhoto(true);
    try {
      const cloudName = "dh6ztnoue";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "p2v_unsigned");
      fd.append("folder", "photo2video/agent-websites");
      const res = await fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (result.secure_url) {
        setAboutPhotoUrl(result.secure_url);
      } else {
        console.error("Cloudinary upload failed:", result);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploadingPhoto(false);
  };

  /* ═══ SAVE / PUBLISH ═══ */
  const handleCreate = async (publish: boolean) => {
    if (!userId) return;
    setSaving(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    // Only include non-empty social links
    const cleanSocials: Record<string, string> = {};
    Object.entries(socialLinks).forEach(([k, v]) => {
      if (v.trim()) cleanSocials[k] = v.trim();
    });

    const { data, error } = await supabase
      .from("agent_websites")
      .insert({
        user_id: userId,
        handle: handle.trim().toLowerCase(),
        site_title: siteTitle.trim() || "My Agent Website",
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        about_content: aboutContent.trim() || null,
        about_photo_url: aboutPhotoUrl || null,
        template: template,
        primary_color: primaryColor,
        social_links: cleanSocials,
        blog_enabled: blogEnabled,
        calendar_enabled: calendarEnabled,
        reports_public: reportsPublic,
        listings_opt_in: listingsOptIn,
        seo_title: siteTitle.trim() || null,
        seo_description: tagline.trim() || null,
        status: publish ? "published" : "draft",
        published_at: publish ? now : null,
      })
      .select("handle")
      .limit(1);

    if (error) {
      console.error("Create error:", error);
      alert("Failed to create website: " + error.message);
      setSaving(false);
      return;
    }

    const createdHandle = (data && data.length > 0) ? data[0].handle : handle.trim().toLowerCase();

    if (publish) {
      window.location.href = "https://" + createdHandle + ".p2v.homes";
    } else {
      router.push("/dashboard");
    }
  };

  /* ═══ STEP VALIDATION ═══ */
  const canAdvance = () => {
    switch (step) {
      case 1: return handle.trim().length >= 3 && handleAvailable === true && siteTitle.trim().length > 0;
      case 2: return true;
      case 3: return !!template;
      case 4: return true;
      default: return true;
    }
  };

  const stepLabels = ["Your Site", "About You", "Brand & Design", "Features", "Review & Launch"];

  /* ═══ LOADING STATE ═══ */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  /* ═══ EXISTING SITE ═══ */
  if (hasExistingSite && existingHandle) {
    return (
      <div className="mc-animate py-20 text-center">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-sky-400/10 ring-1 ring-sky-400/20 flex items-center justify-center mb-6">
          <Globe className="h-10 w-10 text-sky-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-3">You already have a website</h1>
        <p className="text-white/50 mb-1 text-lg font-semibold">{existingHandle}.p2v.homes</p>
        {existingStatus === "draft" && (
          <p className="text-amber-400/70 text-sm mb-4">Status: Draft — publish it from your editor to go live</p>
        )}
        {existingStatus === "published" && (
          <p className="text-green-400/70 text-sm mb-4">Your site is live</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-6">
          <a
            href={"https://" + existingHandle + ".p2v.homes"}
            target="_blank"
            rel="noopener noreferrer"
            className={"inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors " + a.btnBg + " " + a.btnBgHover + " text-white"}
          >
            <Eye className="h-4 w-4" />
            View Your Site
          </a>
          <a
            href={"https://" + existingHandle + ".p2v.homes/editor"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Open Editor
          </a>
        </div>
        <Link href="/dashboard" className="inline-block mt-8 text-sm text-white/30 hover:text-white/50 transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     WIZARD RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div className="mc-animate" style={{ animationDelay: "0.05s" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Create Your Agent Website</h1>
          <p className="text-sm text-white/40 mt-0.5">Step {step} of {TOTAL_STEPS} &mdash; {stepLabels[step - 1]}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-10">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={"h-1.5 rounded-full transition-all duration-300 " + (i + 1 <= step ? "bg-sky-400" : "bg-white/[0.06]")} />
            <p className={"text-[10px] font-semibold mt-1.5 transition-colors " + (i + 1 === step ? "text-sky-400" : i + 1 < step ? "text-white/40" : "text-white/20")}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: YOUR SITE ═══ */}
      {step === 1 && (
        <div className="space-y-6 mc-animate" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm space-y-5">
            <DarkInput
              label="Site Title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Jane Smith &mdash; Coldwell Banker Realty"
              hint="Your name and brokerage. Appears in the hero and browser tab."
            />
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Your Handle</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
                    setHandle(val);
                    setHandleAvailable(null);
                  }}
                  placeholder="janesmith"
                  className="flex-1 rounded-l-xl border border-r-0 border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/20 transition-colors font-mono"
                />
                <div className="rounded-r-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-white/40 font-mono whitespace-nowrap">
                  .p2v.homes
                </div>
              </div>
              <div className="mt-2 h-5">
                {checkingHandle && (
                  <p className="text-xs text-white/30 flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {!checkingHandle && handleAvailable === true && handle.trim().length >= 3 && (
                  <p className="text-xs text-green-400 flex items-center gap-1.5">
                    <Check className="h-3 w-3" /> {handle}.p2v.homes is available
                  </p>
                )}
                {!checkingHandle && handleAvailable === false && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <X className="h-3 w-3" /> {handle}.p2v.homes is taken &mdash; try another
                  </p>
                )}
              </div>
            </div>
            <DarkInput
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your trusted real estate professional in Austin, TX"
              hint="One line that describes what you do. Shows below your name on the homepage."
            />
          </div>

          {handle.trim().length >= 3 && handleAvailable === true && siteTitle.trim() && (
            <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4 mc-animate">
              <p className="text-xs font-semibold text-sky-400/60 mb-1">Your website will be live at</p>
              <p className="text-sm font-bold text-white font-mono">https://{handle}.p2v.homes</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 2: ABOUT YOU ═══ */}
      {step === 2 && (
        <div className="space-y-6 mc-animate" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm space-y-5">
            {/* Photo upload */}
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Profile Photo</label>
              <div className="flex items-center gap-5">
                <div className="relative group flex-shrink-0">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-white/[0.06] border-2 border-white/[0.08] transition-colors group-hover:border-sky-400/30">
                    {aboutPhotoUrl ? (
                      <img src={aboutPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => aboutPhotoRef.current?.click()}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={aboutPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-white/60">Appears on your homepage hero and about page.</p>
                  <p className="text-xs text-white/30 mt-1">
                    {aboutPhotoUrl ? "Click the photo to change it" : "Click the circle to upload"}
                  </p>
                </div>
              </div>
            </div>

            <DarkTextarea
              label="Short Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="15+ years helping families find their dream home in the Austin metro area. Specializing in luxury properties and new construction..."
              rows={3}
              hint="A quick intro — appears on your homepage and listing pages."
            />
            <DarkTextarea
              label="About — Full Description"
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              placeholder="Tell your story. What makes you different? What do clients say about working with you? This appears on your About page."
              rows={6}
              hint="The full version. Goes on your dedicated About page."
            />
          </div>
          <p className="text-xs text-white/25 text-center">All fields are optional — you can always edit these later in your site editor.</p>
        </div>
      )}

      {/* ═══ STEP 3: BRAND & DESIGN ═══ */}
      {step === 3 && (
        <div className="space-y-6 mc-animate" style={{ animationDelay: "0.1s" }}>
          {/* Template picker */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Template</label>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={"rounded-xl border-2 p-1 transition-all " + (template === t.id ? "border-sky-400 ring-2 ring-sky-400/20" : "border-white/[0.06] hover:border-white/[0.15]")}
                >
                  <div className={"h-24 rounded-lg bg-gradient-to-br " + t.gradient + " flex items-end p-3"}>
                    <div>
                      <div className="h-1 w-12 rounded-full mb-1.5" style={{ backgroundColor: t.accent }} />
                      <div className="h-0.5 w-8 rounded-full bg-white/20" />
                    </div>
                  </div>
                  <div className="p-2.5 text-center">
                    <p className={"text-xs font-bold " + (template === t.id ? "text-sky-400" : "text-white/70")}>{t.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
              <Palette className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Primary Color
            </label>
            <div className="grid grid-cols-6 gap-2.5">
              {PRIMARY_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setPrimaryColor(c.hex)}
                  className={"h-10 rounded-lg border-2 transition-all " + (primaryColor === c.hex ? "border-white scale-110 shadow-lg" : "border-transparent hover:border-white/20 hover:scale-105")}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
            <p className="text-xs text-white/25 mt-3">Tints your buttons, links, and accent elements across the site.</p>
          </div>

          {/* Social links */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
              <LinkIcon className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Social Links
            </label>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white/40 w-20 flex-shrink-0">{s.label}</span>
                  <input
                    type="url"
                    value={socialLinks[s.key] || ""}
                    onChange={(e) => setSocialLinks((prev) => ({ ...prev, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:border-sky-400/30 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-white/25 mt-3">Leave blank to hide. Icons appear in your site footer.</p>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: FEATURES ═══ */}
      {step === 4 && (
        <div className="space-y-6 mc-animate" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-5">Enable Pages & Features</label>
            <div className="space-y-1">
              {[
                { key: "blog", label: "Blog", desc: "AI-generated blog posts for SEO. Write about neighborhoods, market updates, and tips.", icon: BookOpen, value: blogEnabled, setter: setBlogEnabled },
                { key: "listings", label: "Listings Directory", desc: "Show all your published properties on your site. Visitors can browse and inquire.", icon: Home, value: listingsOptIn, setter: setListingsOptIn },
                { key: "calendar", label: "Booking Calendar", desc: "Let visitors schedule showings and consultations directly from your site.", icon: CalendarDays, value: calendarEnabled, setter: setCalendarEnabled },
                { key: "reports", label: "Public Reports", desc: "Make your buyer/seller reports viewable on your website for lead generation.", icon: FileText, value: reportsPublic, setter: setReportsPublic },
              ].map((feature) => (
                <button
                  key={feature.key}
                  onClick={() => feature.setter(!feature.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-all text-left"
                >
                  <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (feature.value ? "bg-sky-400/10 ring-1 ring-sky-400/20" : "bg-white/[0.04] ring-1 ring-white/[0.06]")}>
                    <feature.icon className={"h-5 w-5 " + (feature.value ? "text-sky-400" : "text-white/25")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={"text-sm font-bold " + (feature.value ? "text-white/90" : "text-white/50")}>{feature.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{feature.desc}</p>
                  </div>
                  {feature.value ? (
                    <ToggleRight className="h-6 w-6 text-sky-400 flex-shrink-0" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-white/20 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/25 text-center">You can change these anytime in your site editor &rarr; Features tab.</p>
        </div>
      )}

      {/* ═══ STEP 5: REVIEW & LAUNCH ═══ */}
      {step === 5 && (
        <div className="space-y-6 mc-animate" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm divide-y divide-white/[0.04]">
            {/* Site info */}
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Website</p>
                <p className="text-sm font-bold text-white mt-0.5">{siteTitle || "Untitled"}</p>
                <p className="text-xs text-sky-400/60 mt-0.5 font-mono">{handle}.p2v.homes</p>
                {tagline && <p className="text-xs text-white/30 mt-1 italic">{tagline}</p>}
              </div>
              <button onClick={() => setStep(1)} className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 transition-colors">Edit</button>
            </div>

            {/* About */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {aboutPhotoUrl && (
                  <img src={aboutPhotoUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-white/[0.08] flex-shrink-0" />
                )}
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">About</p>
                  <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{bio || aboutContent || "Not set yet — you can add this later"}</p>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 transition-colors flex-shrink-0 ml-4">Edit</button>
            </div>

            {/* Brand */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg border border-white/[0.08]" style={{ backgroundColor: primaryColor }} />
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Brand & Design</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    {TEMPLATES.find((t) => t.id === template)?.label || template} template
                    {Object.values(socialLinks).filter(Boolean).length > 0 && (
                      <span className="text-white/30"> &middot; {Object.values(socialLinks).filter(Boolean).length} social link{Object.values(socialLinks).filter(Boolean).length !== 1 ? "s" : ""}</span>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={() => setStep(3)} className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 transition-colors flex-shrink-0 ml-4">Edit</button>
            </div>

            {/* Features */}
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Features</p>
                <p className="text-sm text-white/60 mt-0.5">
                  {[
                    blogEnabled && "Blog",
                    listingsOptIn && "Listings",
                    calendarEnabled && "Calendar",
                    reportsPublic && "Public Reports",
                  ].filter(Boolean).join(", ") || "None enabled"}
                </p>
              </div>
              <button onClick={() => setStep(4)} className="text-xs font-semibold text-sky-400/70 hover:text-sky-400 transition-colors flex-shrink-0 ml-4">Edit</button>
            </div>
          </div>

          {/* Launch buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => handleCreate(true)}
              disabled={saving}
              className={"flex-1 font-extrabold py-6 text-base rounded-xl text-white " + a.btnBg + " " + a.btnBgHover + " shadow-lg " + a.btnShadow}
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
              className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold py-6 text-base rounded-xl"
            >
              Save as Draft
            </Button>
          </div>

          <p className="text-xs text-white/25 text-center">
            After publishing, use the editor at {handle}.p2v.homes/editor to add hero photos, listings, blog posts, FAQ, and more.
          </p>
        </div>
      )}

      {/* ═══ NAVIGATION BUTTONS ═══ */}
      {step < 5 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.04]">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white/60 hover:text-white font-bold rounded-xl px-5 py-2.5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => setStep(Math.min(5, step + 1))}
            disabled={!canAdvance()}
            className={"font-extrabold rounded-xl px-6 py-2.5 text-white " + a.btnBg + " " + a.btnBgHover + " disabled:opacity-30 disabled:cursor-not-allowed"}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
