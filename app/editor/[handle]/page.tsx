// app/editor/[handle]/page.tsx
// Repo: real-estate-app-final (p2v.homes)
//
// Full-featured site editor CMS for agent websites.
// Session 5: Complete rebuild with hero media, headshot/logo,
// media library, and all content controls.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CLOUDINARY_CLOUD = "dh6ztnoue";
const CLOUDINARY_UPLOAD_PRESET = "p2v_unsigned";

// ─── Types ────────────────────────────────────────────────
type FaqItem = { question: string; answer: string };

type SiteData = {
  id: string;
  user_id: string;
  handle: string;
  site_title: string | null;
  tagline: string | null;
  bio: string | null;
  about_content: string | null;
  primary_color: string | null;
  faq_items: FaqItem[];
  blog_enabled: boolean;
  calendar_enabled: boolean;
  listings_opt_in: boolean;
  hero_photos: string[];
  hero_video_url: string | null;
};

type LensData = {
  saved_headshot_url: string | null;
  saved_logo_url: string | null;
  saved_agent_name: string | null;
  saved_phone: string | null;
  saved_email: string | null;
  saved_company: string | null;
  saved_website: string | null;
  saved_company_colors: string[] | null;
};

type OrderMedia = {
  id: string;
  name: string;
  thumbnail_url: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ActiveTab = "hero" | "brand" | "content" | "media" | "faq" | "features";

// ─── Cloudinary Upload Helper ─────────────────────────────
async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

// ─── Component ────────────────────────────────────────────
export default function EditorPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [lensData, setLensData] = useState<LensData | null>(null);
  const [orderMedia, setOrderMedia] = useState<OrderMedia[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<ActiveTab>("hero");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth ───
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    }
    checkAuth();
  }, []);

  // ─── Load Site + Lens + Orders ───
  useEffect(() => {
    if (!user) return;

    async function loadAll() {
      // Site data
      const { data: siteRows, error: siteErr } = await supabase
        .from("agent_websites")
        .select("*")
        .eq("handle", handle)
        .limit(1);

      if (siteErr) { setLoadError(`Failed to load site: ${siteErr.message}`); return; }
      if (!siteRows?.length) { setLoadError(`No site found for "${handle}".`); return; }

      const site = siteRows[0];
      if (site.user_id !== user.id) { setLoadError("You don't have permission to edit this site."); return; }

      setSiteData({
        ...site,
        faq_items: site.faq_items ?? [],
        hero_photos: site.hero_photos ?? [],
        hero_video_url: site.hero_video_url ?? null,
      });

      // Lens data (agent profile)
      const { data: lensRows } = await supabase
        .from("lens_usage")
        .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_company_colors")
        .eq("user_id", user.id)
        .limit(1);

      if (lensRows?.length) {
        setLensData(lensRows[0]);
      }

      // Order media (photos/videos from agent's purchases)
      const { data: orders } = await supabase
        .from("orders")
        .select("id, name, thumbnail_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (orders?.length) {
        // Get photos from order_photos for each order
        const orderIds = orders.map((o: any) => o.id);
        const { data: photos } = await supabase
          .from("order_photos")
          .select("id, order_id, cloudinary_url, created_at")
          .in("order_id", orderIds)
          .limit(200);

        const media: OrderMedia[] = [];

        // Add order thumbnails as available media
        orders.forEach((order: any) => {
          if (order.thumbnail_url) {
            media.push({
              id: `order-${order.id}`,
              name: order.name || "Order",
              thumbnail_url: order.thumbnail_url,
              media_url: order.thumbnail_url,
              media_type: "image",
              created_at: order.created_at,
            });
          }
        });

        // Add individual photos
        if (photos?.length) {
          photos.forEach((photo: any) => {
            const orderName = orders.find((o: any) => o.id === photo.order_id)?.name || "Photo";
            media.push({
              id: `photo-${photo.id}`,
              name: orderName,
              thumbnail_url: photo.cloudinary_url,
              media_url: photo.cloudinary_url,
              media_type: "image",
              created_at: photo.created_at,
            });
          });
        }

        setOrderMedia(media);
      }
    }
    loadAll();
  }, [user, handle]);

  // ─── Auto-Save (1.5s debounce) ───
  const autoSave = useCallback(
    (updatedData: Partial<SiteData>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        const { error } = await supabase
          .from("agent_websites")
          .update({
            site_title: updatedData.site_title,
            tagline: updatedData.tagline,
            bio: updatedData.bio,
            about_content: updatedData.about_content,
            primary_color: updatedData.primary_color,
            faq_items: updatedData.faq_items,
            blog_enabled: updatedData.blog_enabled,
            calendar_enabled: updatedData.calendar_enabled,
            listings_opt_in: updatedData.listings_opt_in,
            hero_photos: updatedData.hero_photos,
            hero_video_url: updatedData.hero_video_url,
          })
          .eq("handle", handle);
        if (error) { setSaveStatus("error"); }
        else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
      }, 1500);
    },
    [handle]
  );

  // ─── Lens Data Save (headshot/logo) ───
  async function saveLensField(field: string, value: string) {
    if (!user) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("lens_usage")
      .update({ [field]: value })
      .eq("user_id", user.id);
    if (error) { setSaveStatus("error"); }
    else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
  }

  // ─── Field Helpers ───
  function updateField<K extends keyof SiteData>(key: K, value: SiteData[K]) {
    if (!siteData) return;
    const updated = { ...siteData, [key]: value };
    setSiteData(updated);
    autoSave(updated);
  }

  function addFaqItem() {
    if (!siteData) return;
    const updated = { ...siteData, faq_items: [...siteData.faq_items, { question: "", answer: "" }] };
    setSiteData(updated);
    autoSave(updated);
  }

  function updateFaqItem(index: number, field: "question" | "answer", value: string) {
    if (!siteData) return;
    const items = [...siteData.faq_items];
    items[index] = { ...items[index], [field]: value };
    const updated = { ...siteData, faq_items: items };
    setSiteData(updated);
    autoSave(updated);
  }

  function removeFaqItem(index: number) {
    if (!siteData) return;
    const updated = { ...siteData, faq_items: siteData.faq_items.filter((_, i) => i !== index) };
    setSiteData(updated);
    autoSave(updated);
  }

  // ─── File Upload Handler ───
  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    target: string,
    folder: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadTarget(target);
    setUploadProgress(0);

    try {
      const url = await uploadToCloudinary(file, folder, setUploadProgress);
      setUploadProgress(null);
      setUploadTarget(null);

      switch (target) {
        case "headshot":
          setLensData((prev) => prev ? { ...prev, saved_headshot_url: url } : prev);
          await saveLensField("saved_headshot_url", url);
          break;
        case "logo":
          setLensData((prev) => prev ? { ...prev, saved_logo_url: url } : prev);
          await saveLensField("saved_logo_url", url);
          break;
        case "hero_photo":
          if (siteData) {
            const updated = { ...siteData, hero_photos: [...siteData.hero_photos, url] };
            setSiteData(updated);
            autoSave(updated);
          }
          break;
        case "hero_video":
          if (siteData) {
            const updated = { ...siteData, hero_video_url: url };
            setSiteData(updated);
            autoSave(updated);
          }
          break;
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadProgress(null);
      setUploadTarget(null);
      setSaveStatus("error");
    }
  }

  // ─── Pick from Media Library ───
  function pickFromLibrary(url: string) {
    if (!siteData || !mediaPickerTarget) return;

    switch (mediaPickerTarget) {
      case "hero_photo":
        const updated = { ...siteData, hero_photos: [...siteData.hero_photos, url] };
        setSiteData(updated);
        autoSave(updated);
        break;
      case "headshot":
        setLensData((prev) => prev ? { ...prev, saved_headshot_url: url } : prev);
        saveLensField("saved_headshot_url", url);
        break;
      case "logo":
        setLensData((prev) => prev ? { ...prev, saved_logo_url: url } : prev);
        saveLensField("saved_logo_url", url);
        break;
    }
    setMediaLibraryOpen(false);
    setMediaPickerTarget(null);
  }

  function removeHeroPhoto(index: number) {
    if (!siteData) return;
    const updated = { ...siteData, hero_photos: siteData.hero_photos.filter((_, i) => i !== index) };
    setSiteData(updated);
    autoSave(updated);
  }

  // ─── Tab Config ───
  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: "hero", label: "Hero", icon: "◎" },
    { key: "brand", label: "Brand", icon: "◆" },
    { key: "content", label: "Content", icon: "¶" },
    { key: "media", label: "Media", icon: "▤" },
    { key: "faq", label: "FAQ", icon: "?" },
    { key: "features", label: "Features", icon: "⚙" },
  ];

  // ─── Auth States ───
  if (authLoading) return <CenterMessage>Loading…</CenterMessage>;

  if (!user) {
    const redirectUrl = `https://${handle}.p2v.homes/editor/${handle}/auth-callback`;
    const loginUrl = `https://realestatephoto2video.com/login?redirect=${encodeURIComponent(redirectUrl)}`;
    return (
      <CenterMessage>
        <p style={{ color: "#374151", fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Site Editor
        </p>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Sign in to edit {handle}.p2v.homes
        </p>
        <a href={loginUrl} style={S.loginBtn}>Log in →</a>
      </CenterMessage>
    );
  }

  if (loadError) return <CenterMessage><p style={{ color: "#dc2626" }}>{loadError}</p></CenterMessage>;
  if (!siteData) return <CenterMessage>Loading site data…</CenterMessage>;

  // ─── Main Editor ───
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus, textarea:focus { border-color: #6366f1 !important; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .upload-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa; }
        .upload-zone:hover { border-color: #6366f1; background: #f5f3ff; }
        .media-thumb { border-radius: 8px; object-fit: cover; cursor: pointer; transition: all 0.15s; border: 2px solid transparent; }
        .media-thumb:hover { border-color: #6366f1; transform: scale(1.03); }
        .hero-item { position: relative; border-radius: 10px; overflow: hidden; }
        .hero-item .remove-btn { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .hero-item:hover .remove-btn { opacity: 1; }
        .tab-btn { position: relative; }
        .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 50%; width: 0; height: 2px; background: #6366f1; transition: all 0.2s; transform: translateX(-50%); }
        .tab-btn.active::after { width: 100%; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 16px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 1.5rem; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        .progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.3s; }
      `}</style>

      {/* ─── Header ─── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={S.headerLogo}>✦</span>
            <span style={S.headerTitle}>Editor</span>
          </div>
          <span style={S.headerHandle}>{handle}.p2v.homes</span>
        </div>
        <div style={S.headerRight}>
          <SaveBadge status={saveStatus} />
          <a
            href={`https://${handle}.p2v.homes`}
            target="_blank"
            rel="noopener noreferrer"
            style={S.viewSiteBtn}
          >
            View site ↗
          </a>
        </div>
      </header>

      {/* ─── Tabs ─── */}
      <nav style={S.tabBar}>
        <div style={S.tabInner}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              style={{
                ...S.tabBtn,
                color: activeTab === t.key ? "#4f46e5" : "#6b7280",
                fontWeight: activeTab === t.key ? 600 : 400,
              }}
            >
              <span style={{ marginRight: "0.35rem", fontSize: "0.75rem" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Content ─── */}
      <main style={S.main}>
        <div style={S.container}>

          {/* ═══ HERO TAB ═══ */}
          {activeTab === "hero" && (
            <>
              <SectionHeader title="Hero Media" subtitle="The first thing visitors see — add a stunning photo or video" />

              {/* Hero Video */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Hero Video</span>
                  <span style={S.cardSubtitle}>MP4, WebM — plays automatically on your homepage</span>
                </div>
                {siteData.hero_video_url ? (
                  <div style={{ position: "relative" }}>
                    <video
                      src={siteData.hero_video_url}
                      style={{ width: "100%", borderRadius: "8px", maxHeight: "240px", objectFit: "cover" }}
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                    <button
                      onClick={() => updateField("hero_video_url", null)}
                      style={S.removeMedia}
                    >
                      Remove video
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    accept="video/mp4,video/webm,video/quicktime"
                    label="Upload a hero video"
                    sublabel="Or drag and drop"
                    onChange={(e) => handleFileUpload(e, "hero_video", "photo2video/hero")}
                    uploading={uploadTarget === "hero_video"}
                    progress={uploadTarget === "hero_video" ? uploadProgress : null}
                  />
                )}
              </div>

              {/* Hero Photos */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Hero Photos</span>
                  <span style={S.cardSubtitle}>
                    {siteData.hero_photos.length === 0
                      ? "Falls back to listing photos when empty"
                      : `${siteData.hero_photos.length} photo${siteData.hero_photos.length > 1 ? "s" : ""}`
                    }
                  </span>
                </div>

                {siteData.hero_photos.length > 0 && (
                  <div style={S.heroGrid}>
                    {siteData.hero_photos.map((url, i) => (
                      <div key={i} className="hero-item" style={{ width: "140px", height: "100px" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button className="remove-btn" onClick={() => removeHeroPhoto(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: siteData.hero_photos.length > 0 ? "1rem" : 0 }}>
                  <UploadZone
                    accept="image/*"
                    label="Upload photo"
                    onChange={(e) => handleFileUpload(e, "hero_photo", "photo2video/hero")}
                    uploading={uploadTarget === "hero_photo"}
                    progress={uploadTarget === "hero_photo" ? uploadProgress : null}
                    compact
                  />
                  <button
                    onClick={() => { setMediaPickerTarget("hero_photo"); setMediaLibraryOpen(true); }}
                    style={S.libraryBtn}
                  >
                    📂 From your media
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ BRAND TAB ═══ */}
          {activeTab === "brand" && (
            <>
              <SectionHeader title="Brand & Identity" subtitle="Logo, headshot, colors, and site info" />

              {/* Headshot & Logo */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Agent Photos</span>
                  <span style={S.cardSubtitle}>Pulled from your Design Studio — replace anytime</span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {/* Headshot */}
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={S.label}>Headshot</label>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {lensData?.saved_headshot_url ? (
                        <img
                          src={lensData.saved_headshot_url}
                          alt="Headshot"
                          style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb" }}
                        />
                      ) : (
                        <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.75rem" }}>
                          No headshot
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <SmallUploadBtn
                        accept="image/*"
                        label="Upload"
                        onChange={(e) => handleFileUpload(e, "headshot", "photo2video/design-studio")}
                        uploading={uploadTarget === "headshot"}
                      />
                      <button
                        onClick={() => { setMediaPickerTarget("headshot"); setMediaLibraryOpen(true); }}
                        style={S.smallBtn}
                      >
                        📂 Library
                      </button>
                    </div>
                  </div>

                  {/* Logo */}
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={S.label}>Logo</label>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {lensData?.saved_logo_url ? (
                        <img
                          src={lensData.saved_logo_url}
                          alt="Logo"
                          style={{ height: "80px", maxWidth: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "8px", background: "white" }}
                        />
                      ) : (
                        <div style={{ width: "160px", height: "80px", borderRadius: "8px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.75rem" }}>
                          No logo
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <SmallUploadBtn
                        accept="image/*"
                        label="Upload"
                        onChange={(e) => handleFileUpload(e, "logo", "photo2video/agent-profiles")}
                        uploading={uploadTarget === "logo"}
                      />
                      <button
                        onClick={() => { setMediaPickerTarget("logo"); setMediaLibraryOpen(true); }}
                        style={S.smallBtn}
                      >
                        📂 Library
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Info */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Site Info</span>
                </div>
                <Field label="Site Title" value={siteData.site_title ?? ""} onChange={(v) => updateField("site_title", v)} placeholder="e.g. Wall to Wall Real Estate" />
                <Field label="Tagline" value={siteData.tagline ?? ""} onChange={(v) => updateField("tagline", v)} placeholder="e.g. Your dream home in Costa Rica" />

                <div style={S.fieldGroup}>
                  <label style={S.label}>Primary Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input
                      type="color"
                      value={siteData.primary_color ?? "#334155"}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      style={{ width: "44px", height: "44px", border: "1px solid #d1d5db", borderRadius: "10px", cursor: "pointer", padding: "2px" }}
                    />
                    <input
                      type="text"
                      value={siteData.primary_color ?? "#334155"}
                      onChange={(e) => updateField("primary_color", e.target.value)}
                      style={{ ...S.input, width: "120px" }}
                    />
                    {lensData?.saved_company_colors?.length ? (
                      <div style={{ display: "flex", gap: "6px", marginLeft: "0.5rem" }}>
                        {lensData.saved_company_colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => updateField("primary_color", c)}
                            title={c}
                            style={{ width: "28px", height: "28px", borderRadius: "6px", background: c, border: siteData.primary_color === c ? "2px solid #0f172a" : "1px solid #d1d5db", cursor: "pointer" }}
                          />
                        ))}
                        <span style={{ fontSize: "0.7rem", color: "#9ca3af", alignSelf: "center", marginLeft: "4px" }}>company</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Agent Info (read-only from lens) */}
              {lensData && (
                <div style={{ ...S.card, background: "#f8fafc" }}>
                  <div style={S.cardHeader}>
                    <span style={S.cardTitle}>Agent Profile</span>
                    <span style={S.cardSubtitle}>From your Design Studio — edit at realestatephoto2video.com</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8125rem" }}>
                    <InfoRow label="Name" value={lensData.saved_agent_name} />
                    <InfoRow label="Company" value={lensData.saved_company} />
                    <InfoRow label="Phone" value={lensData.saved_phone} />
                    <InfoRow label="Email" value={lensData.saved_email} />
                    <InfoRow label="Website" value={lensData.saved_website} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ CONTENT TAB ═══ */}
          {activeTab === "content" && (
            <>
              <SectionHeader title="Content" subtitle="Homepage bio and about page text" />
              <div style={S.card}>
                <TextArea label="Bio (homepage)" value={siteData.bio ?? ""} onChange={(v) => updateField("bio", v)} placeholder="A brief intro — 2-3 sentences for the homepage hero" rows={3} />
                <TextArea label="About Content (about page)" value={siteData.about_content ?? ""} onChange={(v) => updateField("about_content", v)} placeholder="Your full story — education, experience, philosophy…" rows={8} />
              </div>
            </>
          )}

          {/* ═══ MEDIA TAB ═══ */}
          {activeTab === "media" && (
            <>
              <SectionHeader title="Media Library" subtitle={`${orderMedia.length} items from your orders and uploads`} />
              {orderMedia.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</p>
                  <p>No media yet — order photos or videos on realestatephoto2video.com</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
                  {orderMedia.map((m) => (
                    <div key={m.id} style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb", background: "white" }}>
                      <img src={m.thumbnail_url || m.media_url} alt={m.name} style={{ width: "100%", height: "110px", objectFit: "cover" }} />
                      <div style={{ padding: "0.5rem 0.625rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#374151", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</p>
                        <p style={{ fontSize: "0.625rem", color: "#9ca3af", margin: "2px 0 0" }}>{m.media_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ FAQ TAB ═══ */}
          {activeTab === "faq" && (
            <>
              <SectionHeader title="FAQ" subtitle="Frequently asked questions on your homepage" />
              {siteData.faq_items.map((item, i) => (
                <div key={i} style={{ ...S.card, padding: "1rem 1.25rem" }}>
                  <Field label={`Question ${i + 1}`} value={item.question} onChange={(v) => updateFaqItem(i, "question", v)} placeholder="e.g. What areas do you cover?" />
                  <TextArea label="Answer" value={item.answer} onChange={(v) => updateFaqItem(i, "answer", v)} placeholder="Your answer…" rows={3} />
                  <button onClick={() => removeFaqItem(i)} style={S.dangerBtn}>Remove</button>
                </div>
              ))}
              <button onClick={addFaqItem} style={S.addBtn}>+ Add FAQ item</button>
            </>
          )}

          {/* ═══ FEATURES TAB ═══ */}
          {activeTab === "features" && (
            <>
              <SectionHeader title="Features" subtitle="Toggle sections on or off" />
              <div style={S.card}>
                <Toggle label="Blog" description="Show the blog page and link in nav" on={siteData.blog_enabled} onToggle={() => updateField("blog_enabled", !siteData.blog_enabled)} />
                <Toggle label="Calendar" description="Show the calendar page for bookings" on={siteData.calendar_enabled} onToggle={() => updateField("calendar_enabled", !siteData.calendar_enabled)} />
                <Toggle label="Listings opt-in" description="Show your listings on the site" on={siteData.listings_opt_in} onToggle={() => updateField("listings_opt_in", !siteData.listings_opt_in)} last />
              </div>
            </>
          )}
        </div>
      </main>

      {/* ─── Media Library Modal ─── */}
      {mediaLibraryOpen && (
        <div className="modal-overlay" onClick={() => { setMediaLibraryOpen(false); setMediaPickerTarget(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>
                  Choose from your media
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                  {orderMedia.length} items from your orders
                </p>
              </div>
              <button onClick={() => { setMediaLibraryOpen(false); setMediaPickerTarget(null); }} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            {orderMedia.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                No media available yet
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.625rem" }}>
                {orderMedia.map((m) => (
                  <img
                    key={m.id}
                    src={m.thumbnail_url || m.media_url}
                    alt={m.name}
                    className="media-thumb"
                    style={{ width: "100%", height: "100px", objectFit: "cover" }}
                    onClick={() => pickFromLibrary(m.media_url)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "2rem", textAlign: "center", flexDirection: "column", gap: "0.5rem" }}>
      {children}
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const cfg = {
    saving: { text: "Saving…", bg: "#fef3c7", color: "#92400e" },
    saved: { text: "Saved ✓", bg: "#dcfce7", color: "#166534" },
    error: { text: "Save failed", bg: "#fef2f2", color: "#991b1b" },
  };
  const c = cfg[status as keyof typeof cfg];
  return <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", backgroundColor: c.bg, color: c.color, fontWeight: 500 }}>{c.text}</span>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>{title}</h2>
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#9ca3af" }}>{subtitle}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={S.input} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={S.textarea} />
    </div>
  );
}

function Toggle({ label, description, on, onToggle, last }: { label: string; description: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0", borderBottom: last ? "none" : "1px solid #f1f5f9" }}>
      <div>
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1e293b" }}>{label}</span>
        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>{description}</p>
      </div>
      <button onClick={onToggle} style={{ width: "48px", height: "26px", borderRadius: "9999px", backgroundColor: on ? "#6366f1" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
        <span style={{ width: "20px", height: "20px", borderRadius: "9999px", backgroundColor: "#fff", position: "absolute", top: "3px", left: on ? "25px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </button>
    </div>
  );
}

function UploadZone({ accept, label, sublabel, onChange, uploading, progress, compact }: {
  accept: string; label: string; sublabel?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean; progress: number | null; compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className="upload-zone"
      onClick={() => inputRef.current?.click()}
      style={compact ? { padding: "1rem", flex: 1 } : {}}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />
      {uploading && progress !== null ? (
        <div style={{ width: "100%" }}>
          <p style={{ fontSize: "0.8125rem", color: "#6366f1", margin: "0 0 0.5rem" }}>Uploading… {progress}%</p>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: compact ? "0.8125rem" : "0.875rem", color: "#6b7280", margin: 0, fontWeight: 500 }}>
            {compact ? "📎 " : "📤 "}{label}
          </p>
          {sublabel && <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.25rem 0 0" }}>{sublabel}</p>}
        </>
      )}
    </div>
  );
}

function SmallUploadBtn({ accept, label, onChange, uploading }: {
  accept: string; label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />
      <button onClick={() => inputRef.current?.click()} style={S.smallBtn} disabled={uploading}>
        {uploading ? "…" : `📎 ${label}`}
      </button>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span style={{ color: "#9ca3af", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <p style={{ margin: "2px 0 0", color: "#374151", fontSize: "0.8125rem" }}>{value || "—"}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#f8f9fb", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" },
  header: { backgroundColor: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 1.5rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  headerLogo: { fontSize: "1.25rem", color: "#6366f1" },
  headerTitle: { fontWeight: 700, fontSize: "0.9375rem", color: "#0f172a", letterSpacing: "-0.02em" },
  headerHandle: { fontSize: "0.75rem", color: "#94a3b8", background: "#f1f5f9", padding: "0.2rem 0.625rem", borderRadius: "6px" },
  viewSiteBtn: { fontSize: "0.8125rem", color: "#6366f1", textDecoration: "none", fontWeight: 500, padding: "0.375rem 0.75rem", borderRadius: "8px", border: "1px solid #e0e7ff", background: "#f5f3ff", transition: "all 0.15s" },
  tabBar: { backgroundColor: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 1.5rem", overflowX: "auto" },
  tabInner: { display: "flex", gap: "0.25rem", maxWidth: "720px", margin: "0 auto" },
  tabBtn: { background: "none", border: "none", padding: "0.875rem 0.875rem", fontSize: "0.8125rem", cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s" },
  main: { padding: "1.5rem" },
  container: { maxWidth: "720px", margin: "0 auto" },
  card: { backgroundColor: "#fff", border: "1px solid #eaedf0", borderRadius: "14px", padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" },
  cardHeader: { marginBottom: "1rem" },
  cardTitle: { fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a", display: "block" },
  cardSubtitle: { fontSize: "0.75rem", color: "#9ca3af", display: "block", marginTop: "2px" },
  fieldGroup: { marginBottom: "1.125rem" },
  label: { display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#374151", marginBottom: "0.375rem" },
  input: { width: "100%", padding: "0.5625rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "0.875rem", color: "#0f172a", boxSizing: "border-box", transition: "border-color 0.15s", background: "#fff" },
  textarea: { width: "100%", padding: "0.5625rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "0.875rem", color: "#0f172a", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.15s", background: "#fff" },
  heroGrid: { display: "flex", gap: "0.625rem", flexWrap: "wrap" },
  removeMedia: { marginTop: "0.75rem", fontSize: "0.8125rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0" },
  libraryBtn: { flex: 1, padding: "1rem", borderRadius: "12px", border: "2px dashed #d1d5db", background: "#fafafa", cursor: "pointer", fontSize: "0.8125rem", color: "#6b7280", fontWeight: 500, transition: "all 0.2s", fontFamily: "inherit" },
  smallBtn: { fontSize: "0.75rem", color: "#6b7280", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", padding: "0.375rem 0.75rem", borderRadius: "8px", fontFamily: "inherit", transition: "all 0.15s" },
  addBtn: { width: "100%", padding: "0.75rem", borderRadius: "12px", border: "2px dashed #c7d2fe", background: "#fafafe", cursor: "pointer", fontSize: "0.875rem", color: "#6366f1", fontWeight: 500, fontFamily: "inherit" },
  dangerBtn: { fontSize: "0.75rem", color: "#ef4444", border: "none", background: "none", cursor: "pointer", padding: "0.25rem 0", fontFamily: "inherit" },
  loginBtn: { display: "inline-block", padding: "0.625rem 2rem", backgroundColor: "#4f46e5", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, transition: "background 0.15s" },
};
