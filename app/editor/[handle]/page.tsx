// app/editor/[handle]/page.tsx
// Repo: real-estate-app-final (p2v.homes)
//
// Full-featured site editor CMS for agent websites.
// Session 5: Hero media, headshot/logo, media library from orders + exports.

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

type MediaItem = {
  id: string;
  label: string;
  url: string;
  thumb: string;
  type: "image" | "video";
  source: string;
  date: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ActiveTab = "hero" | "brand" | "content" | "media" | "faq" | "features";

// ─── Cloudinary Upload ────────────────────────────────────
async function uploadToCloudinary(
  file: File, folder: string, onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    fd.append("folder", folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url); else reject(new Error("Upload failed")); };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(fd);
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<ActiveTab>("hero");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth ───
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    })();
  }, []);

  // ─── Load All Data ───
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Site
      const { data: siteRows, error: siteErr } = await supabase
        .from("agent_websites").select("*").eq("handle", handle).limit(1);
      if (siteErr || !siteRows?.length) { setLoadError(siteErr?.message || `No site for "${handle}"`); return; }
      const site = siteRows[0];
      if (site.user_id !== user.id) { setLoadError("No permission to edit this site."); return; }
      setSiteData({
        ...site,
        faq_items: site.faq_items ?? [],
        hero_photos: Array.isArray(site.hero_photos) ? site.hero_photos : [],
        hero_video_url: site.hero_video_url ?? null,
      });

      // Lens
      const { data: lensRows } = await supabase
        .from("lens_usage")
        .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_company_colors")
        .eq("user_id", user.id).limit(1);
      if (lensRows?.length) setLensData(lensRows[0]);

      // ─── Media Library ───
      const media: MediaItem[] = [];

      // Orders → photos from jsonb + delivery videos
      const { data: orders } = await supabase
        .from("orders")
        .select("id, property_address, photos, delivery_url, clip_urls, payment_status, created_at")
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (orders) {
        for (const order of orders) {
          const addr = order.property_address || "Order";
          const photos = Array.isArray(order.photos) ? order.photos : [];

          // Each photo in the jsonb array
          photos.forEach((p: any, i: number) => {
            const url = p.secure_url || p.url;
            if (url) {
              media.push({
                id: `op-${order.id}-${i}`,
                label: addr,
                url,
                thumb: url,
                type: "image",
                source: "Order",
                date: order.created_at,
              });
            }
          });

          // Delivery video
          if (order.delivery_url) {
            media.push({
              id: `ov-${order.id}`,
              label: addr + " — Video",
              url: order.delivery_url,
              thumb: photos[0]?.secure_url || "",
              type: "video",
              source: "Video",
              date: order.created_at,
            });
          }
        }
      }

      // Design exports
      const { data: exports } = await supabase
        .from("design_exports")
        .select("id, template_type, export_url, overlay_video_url, export_format, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (exports) {
        for (const exp of exports) {
          if (exp.export_url) {
            const isVid = exp.export_format === "video" || /\.(mp4|webm|mov)$/i.test(exp.export_url);
            media.push({
              id: `de-${exp.id}`,
              label: exp.template_type || "Design Export",
              url: exp.export_url,
              thumb: isVid ? "" : exp.export_url,
              type: isVid ? "video" : "image",
              source: "Design Studio",
              date: exp.created_at,
            });
          }
        }
      }

      setMediaItems(media);
    })();
  }, [user, handle]);

  // ─── Auto-Save ───
  const autoSave = useCallback((d: Partial<SiteData>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const payload: any = {
        site_title: d.site_title, tagline: d.tagline, bio: d.bio,
        about_content: d.about_content, primary_color: d.primary_color,
        faq_items: d.faq_items, blog_enabled: d.blog_enabled,
        calendar_enabled: d.calendar_enabled, listings_opt_in: d.listings_opt_in,
        hero_photos: d.hero_photos,
        hero_video_url: d.hero_video_url,
      };
      const { error } = await supabase.from("agent_websites").update(payload).eq("handle", handle);
      if (error) { console.error("Save:", error.message); setSaveStatus("error"); }
      else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
    }, 1500);
  }, [handle]);

  // ─── Lens Save ───
  async function saveLens(field: string, value: string) {
    if (!user) return;
    setSaveStatus("saving");
    const { error } = await supabase.from("lens_usage").update({ [field]: value }).eq("user_id", user.id);
    if (error) setSaveStatus("error");
    else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
  }

  // ─── Helpers ───
  function updateField<K extends keyof SiteData>(key: K, value: SiteData[K]) {
    if (!siteData) return;
    const u = { ...siteData, [key]: value };
    setSiteData(u); autoSave(u);
  }
  function addFaq() { if (!siteData) return; const u = { ...siteData, faq_items: [...siteData.faq_items, { question: "", answer: "" }] }; setSiteData(u); autoSave(u); }
  function updateFaq(i: number, f: "question" | "answer", v: string) { if (!siteData) return; const items = [...siteData.faq_items]; items[i] = { ...items[i], [f]: v }; const u = { ...siteData, faq_items: items }; setSiteData(u); autoSave(u); }
  function removeFaq(i: number) { if (!siteData) return; const u = { ...siteData, faq_items: siteData.faq_items.filter((_, idx) => idx !== i) }; setSiteData(u); autoSave(u); }
  function removeHeroPhoto(i: number) { if (!siteData) return; const u = { ...siteData, hero_photos: siteData.hero_photos.filter((_, idx) => idx !== i) }; setSiteData(u); autoSave(u); }

  // ─── Upload ───
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: string, folder: string) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadTarget(target); setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, folder, setUploadProgress);
      setUploadProgress(null); setUploadTarget(null);
      if (target === "headshot") { setLensData(p => p ? { ...p, saved_headshot_url: url } : p); await saveLens("saved_headshot_url", url); }
      else if (target === "logo") { setLensData(p => p ? { ...p, saved_logo_url: url } : p); await saveLens("saved_logo_url", url); }
      else if (target === "hero_photo" && siteData) { const u = { ...siteData, hero_photos: [...siteData.hero_photos, url] }; setSiteData(u); autoSave(u); }
      else if (target === "hero_video" && siteData) { const u = { ...siteData, hero_video_url: url }; setSiteData(u); autoSave(u); }
    } catch { setUploadProgress(null); setUploadTarget(null); setSaveStatus("error"); }
  }

  // ─── Picker ───
  function pickMedia(url: string) {
    if (!siteData || !mediaPickerTarget) return;
    if (mediaPickerTarget === "hero_photo") { const u = { ...siteData, hero_photos: [...siteData.hero_photos, url] }; setSiteData(u); autoSave(u); }
    else if (mediaPickerTarget === "hero_video") { const u = { ...siteData, hero_video_url: url }; setSiteData(u); autoSave(u); }
    else if (mediaPickerTarget === "headshot") { setLensData(p => p ? { ...p, saved_headshot_url: url } : p); saveLens("saved_headshot_url", url); }
    else if (mediaPickerTarget === "logo") { setLensData(p => p ? { ...p, saved_logo_url: url } : p); saveLens("saved_logo_url", url); }
    setMediaPickerOpen(false); setMediaPickerTarget(null);
  }
  function openPicker(target: string, filter?: "all" | "image" | "video") { setMediaPickerTarget(target); setMediaFilter(filter || "all"); setMediaPickerOpen(true); }
  const filteredMedia = mediaFilter === "all" ? mediaItems : mediaItems.filter(m => m.type === mediaFilter);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "hero", label: "Hero" }, { key: "brand", label: "Brand" }, { key: "content", label: "Content" },
    { key: "media", label: `Media (${mediaItems.length})` }, { key: "faq", label: "FAQ" }, { key: "features", label: "Features" },
  ];

  // ─── Auth States ───
  if (authLoading) return <Center><p style={{ color: "#9ca3af" }}>Loading…</p></Center>;
  if (!user) {
    const redir = `https://${handle}.p2v.homes/editor/${handle}/auth-callback`;
    return (
      <Center>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>Site Editor</p>
        <p style={{ color: "#94a3b8", marginBottom: 20 }}>Sign in to edit {handle}.p2v.homes</p>
        <a href={`https://realestatephoto2video.com/login?redirect=${encodeURIComponent(redir)}`} style={S.primaryBtn}>Log in →</a>
      </Center>
    );
  }
  if (loadError) return <Center><p style={{ color: "#dc2626" }}>{loadError}</p></Center>;
  if (!siteData) return <Center><p style={{ color: "#9ca3af" }}>Loading site…</p></Center>;

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "#6366f1" }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Editor</span>
          <span style={{ fontSize: 12, color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: 6 }}>{handle}.p2v.homes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SaveBadge status={saveStatus} />
          <a href={`https://${handle}.p2v.homes`} target="_blank" rel="noopener noreferrer" style={S.viewBtn}>View site ↗</a>
        </div>
      </header>

      <nav style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ ...S.tab, color: activeTab === t.key ? "#4f46e5" : "#9ca3af", fontWeight: activeTab === t.key ? 600 : 400, borderBottom: activeTab === t.key ? "2px solid #6366f1" : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={S.main}><div style={S.container}>

        {activeTab === "hero" && <>
          <Heading title="Hero Section" sub="The banner visitors see first" />
          <Card title="Hero Video" sub="Auto-plays behind your hero content. MP4 or WebM.">
            {siteData.hero_video_url ? (
              <div>
                <video src={siteData.hero_video_url} muted loop autoPlay playsInline style={{ width: "100%", borderRadius: 8, maxHeight: 220, objectFit: "cover" }} />
                <button onClick={() => updateField("hero_video_url", null)} style={S.dangerLink}>Remove video</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <UploadZone accept="video/mp4,video/webm,video/quicktime" label="Upload video" onChange={e => handleUpload(e, "hero_video", "photo2video/hero")} uploading={uploadTarget === "hero_video"} progress={uploadTarget === "hero_video" ? uploadProgress : null} />
                <LibraryBtn label="From your videos" onClick={() => openPicker("hero_video", "video")} />
              </div>
            )}
          </Card>
          <Card title="Hero Photos" sub={siteData.hero_photos.length ? `${siteData.hero_photos.length} photo${siteData.hero_photos.length > 1 ? "s" : ""}` : "Falls back to listing photos when empty"}>
            {siteData.hero_photos.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {siteData.hero_photos.map((url, i) => (
                  <div key={i} className="thumb-wrap">
                    <img src={url} alt="" style={{ width: 130, height: 90, objectFit: "cover", borderRadius: 8 }} />
                    <button className="thumb-x" onClick={() => removeHeroPhoto(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <UploadZone accept="image/*" label="Upload photo" onChange={e => handleUpload(e, "hero_photo", "photo2video/hero")} uploading={uploadTarget === "hero_photo"} progress={uploadTarget === "hero_photo" ? uploadProgress : null} compact />
              <LibraryBtn label="From your photos" onClick={() => openPicker("hero_photo", "image")} />
            </div>
          </Card>
        </>}

        {activeTab === "brand" && <>
          <Heading title="Brand & Identity" sub="Your photos, colors, and site info" />
          <Card title="Agent Photos" sub="From your Design Studio — replace anytime">
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={S.label}>Headshot</label>
                {lensData?.saved_headshot_url
                  ? <img src={lensData.saved_headshot_url} alt="" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb", display: "block" }} />
                  : <div style={{ width: 110, height: 110, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>No headshot</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <SmallUpload accept="image/*" label="Upload" onChange={e => handleUpload(e, "headshot", "photo2video/design-studio")} uploading={uploadTarget === "headshot"} />
                  <button onClick={() => openPicker("headshot", "image")} style={S.smallBtn}>Library</button>
                </div>
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label style={S.label}>Logo</label>
                {lensData?.saved_logo_url
                  ? <img src={lensData.saved_logo_url} alt="" style={{ height: 70, maxWidth: 180, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", padding: 8, background: "#fff", display: "block" }} />
                  : <div style={{ width: 150, height: 70, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>No logo</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <SmallUpload accept="image/*" label="Upload" onChange={e => handleUpload(e, "logo", "photo2video/agent-profiles")} uploading={uploadTarget === "logo"} />
                  <button onClick={() => openPicker("logo", "image")} style={S.smallBtn}>Library</button>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Site Info">
            <Field label="Site Title" value={siteData.site_title ?? ""} onChange={v => updateField("site_title", v)} placeholder="e.g. Wall to Wall Real Estate" />
            <Field label="Tagline" value={siteData.tagline ?? ""} onChange={v => updateField("tagline", v)} placeholder="e.g. Your dream home in Costa Rica" />
            <div style={S.fieldGroup}>
              <label style={S.label}>Primary Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={siteData.primary_color ?? "#334155"} onChange={e => updateField("primary_color", e.target.value)} style={{ width: 42, height: 42, border: "1px solid #d1d5db", borderRadius: 10, cursor: "pointer", padding: 2 }} />
                <input type="text" value={siteData.primary_color ?? "#334155"} onChange={e => updateField("primary_color", e.target.value)} style={{ ...S.input, width: 110 }} />
                {lensData?.saved_company_colors?.length ? (
                  <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>
                    {lensData.saved_company_colors.map((c, i) => (
                      <button key={i} onClick={() => updateField("primary_color", c)} title={c}
                        style={{ width: 26, height: 26, borderRadius: 6, background: c, border: siteData.primary_color === c ? "2px solid #0f172a" : "1px solid #d1d5db", cursor: "pointer" }} />
                    ))}
                    <span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center" }}>brand</span>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
          {lensData && (
            <Card title="Agent Profile" sub="From your Design Studio" muted>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Info label="Name" value={lensData.saved_agent_name} />
                <Info label="Company" value={lensData.saved_company} />
                <Info label="Phone" value={lensData.saved_phone} />
                <Info label="Email" value={lensData.saved_email} />
              </div>
            </Card>
          )}
        </>}

        {activeTab === "content" && <>
          <Heading title="Content" sub="Homepage bio and about page text" />
          <Card>
            <TextArea label="Bio (homepage)" value={siteData.bio ?? ""} onChange={v => updateField("bio", v)} placeholder="A brief intro — 2-3 sentences" rows={3} />
            <TextArea label="About Content (about page)" value={siteData.about_content ?? ""} onChange={v => updateField("about_content", v)} placeholder="Your full story…" rows={8} />
          </Card>
        </>}

        {activeTab === "media" && <>
          <Heading title="Media Library" sub={`${mediaItems.length} items from your orders and Design Studio`} />
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["all", "image", "video"] as const).map(f => (
              <button key={f} onClick={() => setMediaFilter(f)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + (mediaFilter === f ? "#6366f1" : "#e5e7eb"), background: mediaFilter === f ? "#eef2ff" : "#fff", color: mediaFilter === f ? "#4f46e5" : "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {f === "all" ? `All (${mediaItems.length})` : f === "image" ? `Photos (${mediaItems.filter(m => m.type === "image").length})` : `Videos (${mediaItems.filter(m => m.type === "video").length})`}
              </button>
            ))}
          </div>
          {filteredMedia.length === 0 ? (
            <Card><div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}><p style={{ fontSize: 32, marginBottom: 8 }}>📷</p><p>No {mediaFilter === "all" ? "media" : mediaFilter + "s"} found</p></div></Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
              {filteredMedia.map(m => (
                <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff" }}>
                  {m.type === "video" ? (
                    <div style={{ width: "100%", height: 105, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {m.thumb ? <img src={m.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} /> : null}
                      <span style={{ position: "absolute", fontSize: 28, color: "white" }}>▶</span>
                    </div>
                  ) : (
                    <img src={m.thumb} alt={m.label} style={{ width: "100%", height: 105, objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#374151", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{m.source}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {activeTab === "faq" && <>
          <Heading title="FAQ" sub="Frequently asked questions on your homepage" />
          {siteData.faq_items.map((item, i) => (
            <Card key={i}>
              <Field label={`Question ${i + 1}`} value={item.question} onChange={v => updateFaq(i, "question", v)} placeholder="e.g. What areas do you cover?" />
              <TextArea label="Answer" value={item.answer} onChange={v => updateFaq(i, "answer", v)} placeholder="Your answer…" rows={3} />
              <button onClick={() => removeFaq(i)} style={S.dangerLink}>Remove</button>
            </Card>
          ))}
          <button onClick={addFaq} style={S.addBtn}>+ Add FAQ item</button>
        </>}

        {activeTab === "features" && <>
          <Heading title="Features" sub="Toggle site sections on or off" />
          <Card>
            <Toggle label="Blog" desc="Show blog page and nav link" on={siteData.blog_enabled} onToggle={() => updateField("blog_enabled", !siteData.blog_enabled)} />
            <Toggle label="Calendar" desc="Show calendar page for bookings" on={siteData.calendar_enabled} onToggle={() => updateField("calendar_enabled", !siteData.calendar_enabled)} />
            <Toggle label="Listings" desc="Show your property listings" on={siteData.listings_opt_in} onToggle={() => updateField("listings_opt_in", !siteData.listings_opt_in)} last />
          </Card>
        </>}

      </div></main>

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <div className="modal-bg" onClick={() => { setMediaPickerOpen(false); setMediaPickerTarget(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Choose from your media</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{filteredMedia.length} items</p>
              </div>
              <button onClick={() => { setMediaPickerOpen(false); setMediaPickerTarget(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            {filteredMedia.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No matching media</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {filteredMedia.map(m => (
                  <div key={m.id} onClick={() => pickMedia(m.url)} className="picker-thumb" style={{ cursor: "pointer" }}>
                    {m.type === "video" ? (
                      <div style={{ width: "100%", height: 90, background: "#111", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                        {m.thumb ? <img src={m.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} /> : null}
                        <span style={{ position: "absolute", fontSize: 22, color: "white" }}>▶</span>
                      </div>
                    ) : (
                      <img src={m.thumb} alt={m.label} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                    )}
                    <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub Components ───
function Center({ children }: { children: React.ReactNode }) { return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif", padding: 32, textAlign: "center", flexDirection: "column" }}>{children}</div>; }
function SaveBadge({ status }: { status: SaveStatus }) { if (status === "idle") return null; const c = { saving: { t: "Saving…", bg: "#fef3c7", fg: "#92400e" }, saved: { t: "Saved ✓", bg: "#dcfce7", fg: "#166534" }, error: { t: "Save failed", bg: "#fef2f2", fg: "#991b1b" } }[status]!; return <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: c.bg, color: c.fg, fontWeight: 500 }}>{c.t}</span>; }
function Heading({ title, sub }: { title: string; sub: string }) { return <div style={{ marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{sub}</p></div>; }
function Card({ title, sub, muted, children }: { title?: string; sub?: string; muted?: boolean; children: React.ReactNode }) { return <div style={{ background: muted ? "#f8fafc" : "#fff", border: "1px solid #eaedf0", borderRadius: 14, padding: "20px 24px", marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>{title && <div style={{ marginBottom: 14 }}><span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", display: "block" }}>{title}</span>{sub && <span style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</span>}</div>}{children}</div>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) { return <div style={S.fieldGroup}><label style={S.label}>{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={S.input} /></div>; }
function TextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) { return <div style={S.fieldGroup}><label style={S.label}>{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={S.textarea} /></div>; }
function Toggle({ label, desc, on, onToggle, last }: { label: string; desc: string; on: boolean; onToggle: () => void; last?: boolean }) { return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid #f1f5f9" }}><div><span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{label}</span><p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{desc}</p></div><button onClick={onToggle} style={{ width: 46, height: 25, borderRadius: 99, background: on ? "#6366f1" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}><span style={{ width: 19, height: 19, borderRadius: 99, background: "#fff", position: "absolute", top: 3, left: on ? 24 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} /></button></div>; }
function Info({ label, value }: { label: string; value: string | null }) { return <div><span style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span><p style={{ margin: "2px 0 0", color: "#374151", fontSize: 13 }}>{value || "—"}</p></div>; }
function UploadZone({ accept, label, onChange, uploading, progress, compact }: { accept: string; label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean; progress: number | null; compact?: boolean }) { const ref = useRef<HTMLInputElement>(null); return <div className="upload-zone" onClick={() => ref.current?.click()} style={compact ? { padding: 14, flex: 1 } : {}}><input ref={ref} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />{uploading && progress !== null ? <div style={{ width: "100%" }}><p style={{ fontSize: 13, color: "#6366f1", margin: "0 0 6px" }}>Uploading… {progress}%</p><div className="prog"><div className="prog-fill" style={{ width: `${progress}%` }} /></div></div> : <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontWeight: 500 }}>{compact ? "📎 " : "📤 "}{label}</p>}</div>; }
function SmallUpload({ accept, label, onChange, uploading }: { accept: string; label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) { const ref = useRef<HTMLInputElement>(null); return <><input ref={ref} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} /><button onClick={() => ref.current?.click()} style={S.smallBtn} disabled={uploading}>{uploading ? "…" : `📎 ${label}`}</button></>; }
function LibraryBtn({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick} style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px dashed #d1d5db", background: "#fafafa", cursor: "pointer", fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "inherit" }}>📂 {label}</button>; }

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8f9fb", fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  viewBtn: { fontSize: 13, color: "#6366f1", textDecoration: "none", fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e7ff", background: "#f5f3ff" },
  tabBar: { background: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 20px", display: "flex", gap: 2, overflowX: "auto" },
  tab: { background: "none", border: "none", padding: "12px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s" },
  main: { padding: 20 },
  container: { maxWidth: 720, margin: "0 auto" },
  fieldGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, color: "#0f172a", boxSizing: "border-box", background: "#fff", fontFamily: "inherit" },
  textarea: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, color: "#0f172a", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", background: "#fff" },
  primaryBtn: { display: "inline-block", padding: "10px 28px", background: "#4f46e5", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600 },
  smallBtn: { fontSize: 12, color: "#6b7280", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  addBtn: { width: "100%", padding: 14, borderRadius: 12, border: "2px dashed #c7d2fe", background: "#fafafe", cursor: "pointer", fontSize: 14, color: "#6366f1", fontWeight: 500, fontFamily: "inherit" },
  dangerLink: { fontSize: 12, color: "#ef4444", border: "none", background: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit", marginTop: 8, display: "block" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}body{margin:0}
input:focus,textarea:focus{border-color:#6366f1!important;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.1)}
.upload-zone{border:2px dashed #d1d5db;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}
.upload-zone:hover{border-color:#6366f1;background:#f5f3ff}
.thumb-wrap{position:relative;display:inline-block}.thumb-wrap .thumb-x{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}.thumb-wrap:hover .thumb-x{opacity:1}
.prog{height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden}.prog-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .3s}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal-box{background:#fff;border-radius:16px;width:90%;max-width:780px;max-height:80vh;overflow-y:auto;padding:24px;box-shadow:0 25px 50px rgba(0,0,0,.25)}
.picker-thumb:hover img,.picker-thumb:hover div{outline:2px solid #6366f1;outline-offset:-2px;border-radius:8px}
`;
