// app/editor/[handle]/page.tsx  —  v3 (Session 5)
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CLD_CLOUD = "dh6ztnoue";
const CLD_PRESET = "p2v_unsigned";

type FaqItem = { question: string; answer: string };
type SiteData = { id: string; user_id: string; handle: string; site_title: string | null; tagline: string | null; bio: string | null; about_content: string | null; primary_color: string | null; faq_items: FaqItem[]; blog_enabled: boolean; calendar_enabled: boolean; listings_opt_in: boolean; hero_photos: string[]; hero_video_url: string | null; about_photo_url: string | null };
type LensData = { saved_headshot_url: string | null; saved_logo_url: string | null; saved_agent_name: string | null; saved_phone: string | null; saved_email: string | null; saved_company: string | null; saved_website: string | null; saved_company_colors: string[] | null };
type MediaItem = { id: string; label: string; url: string; thumb: string; type: "image" | "video"; source: string; date: string; property?: string };
type SaveStatus = "idle" | "saving" | "saved" | "error";
type ActiveTab = "hero" | "brand" | "content" | "media" | "faq" | "features";

async function uploadCld(file: File, folder: string, onProg?: (n: number) => void): Promise<string> {
  return new Promise((res, rej) => {
    const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", CLD_PRESET); fd.append("folder", folder);
    const x = new XMLHttpRequest();
    x.open("POST", `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/auto/upload`);
    x.upload.onprogress = e => { if (e.lengthComputable && onProg) onProg(Math.round(e.loaded / e.total * 100)); };
    x.onload = () => x.status === 200 ? res(JSON.parse(x.responseText).secure_url) : rej(new Error("fail"));
    x.onerror = () => rej(new Error("fail"));
    x.send(fd);
  });
}

export default function EditorPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [site, setSite] = useState<SiteData | null>(null);
  const [lens, setLens] = useState<LensData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [tab, setTab] = useState<ActiveTab>("hero");
  const [upProg, setUpProg] = useState<number | null>(null);
  const [upTarget, setUpTarget] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [pickerFilter, setPickerFilter] = useState<"all" | "image" | "video">("all");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const saveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { (async () => { const { data: { user } } = await supabase.auth.getUser(); setUser(user); setAuthLoading(false); })(); }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rows, error } = await supabase.from("agent_websites").select("*").eq("handle", handle).limit(1);
      if (error || !rows?.length) { setLoadErr(error?.message || "Site not found"); return; }
      const s = rows[0];
      if (s.user_id !== user.id) { setLoadErr("No permission"); return; }
      setSite({ ...s, faq_items: s.faq_items ?? [], hero_photos: Array.isArray(s.hero_photos) ? s.hero_photos : [], hero_video_url: s.hero_video_url ?? null, about_photo_url: s.about_photo_url ?? null });

      const { data: lr } = await supabase.from("lens_usage")
        .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_company_colors")
        .eq("user_id", user.id).limit(1);
      if (lr?.length) setLens(lr[0]);

      // Build media library
      const items: MediaItem[] = [];
      const { data: orders } = await supabase.from("orders")
        .select("id, property_address, photos, delivery_url, clip_urls, created_at")
        .eq("user_id", user.id).eq("payment_status", "paid").order("created_at", { ascending: false });
      if (orders) {
        for (const o of orders) {
          const addr = o.property_address || "Order";
          const photos = Array.isArray(o.photos) ? o.photos : [];
          photos.forEach((p: any, i: number) => {
            const url = p.secure_url || p.url;
            if (url) items.push({ id: `op-${o.id}-${i}`, label: p.description || addr, url, thumb: url, type: "image", source: "Order Photo", date: o.created_at, property: addr });
          });
          if (o.delivery_url) items.push({ id: `ov-${o.id}`, label: addr, url: o.delivery_url, thumb: photos[0]?.secure_url || "", type: "video", source: "Delivery Video", date: o.created_at, property: addr });
          // Individual clips
          const clips = Array.isArray(o.clip_urls) ? o.clip_urls : [];
          clips.forEach((c: any, i: number) => {
            if (c.drive_url) items.push({ id: `oc-${o.id}-${i}`, label: `${addr} — Clip ${c.position || i + 1}`, url: c.drive_url, thumb: c.photo_url || photos[0]?.secure_url || "", type: "video", source: "Video Clip", date: o.created_at, property: addr });
          });
        }
      }
      const { data: exps } = await supabase.from("design_exports")
        .select("id, template_type, export_url, overlay_video_url, export_format, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (exps) {
        for (const e of exps) {
          if (e.export_url) {
            const isV = e.export_format === "video" || /\.(mp4|webm|mov)$/i.test(e.export_url);
            items.push({ id: `de-${e.id}`, label: e.template_type || "Design Export", url: e.export_url, thumb: isV ? "" : e.export_url, type: isV ? "video" : "image", source: "Design Studio", date: e.created_at });
          }
          if (e.overlay_video_url) {
            items.push({ id: `dv-${e.id}`, label: (e.template_type || "Design") + " — Video", url: e.overlay_video_url, thumb: "", type: "video", source: "Design Studio", date: e.created_at });
          }
        }
      }
      setMedia(items);
    })();
  }, [user, handle]);

  const autoSave = useCallback((d: Partial<SiteData>) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const { error } = await supabase.from("agent_websites").update({
        site_title: d.site_title, tagline: d.tagline, bio: d.bio, about_content: d.about_content,
        primary_color: d.primary_color, faq_items: d.faq_items, blog_enabled: d.blog_enabled,
        calendar_enabled: d.calendar_enabled, listings_opt_in: d.listings_opt_in,
        hero_photos: d.hero_photos, hero_video_url: d.hero_video_url, about_photo_url: d.about_photo_url,
      }).eq("handle", handle);
      if (error) { console.error("Save:", error.message); setSaveStatus("error"); } else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
    }, 1500);
  }, [handle]);

  async function saveLens(f: string, v: string) {
    if (!user) return; setSaveStatus("saving");
    const { error } = await supabase.from("lens_usage").update({ [f]: v }).eq("user_id", user.id);
    if (error) setSaveStatus("error"); else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); }
  }

  function up<K extends keyof SiteData>(k: K, v: SiteData[K]) { if (!site) return; const u = { ...site, [k]: v }; setSite(u); autoSave(u); }
  function addFaq() { if (!site) return; const u = { ...site, faq_items: [...site.faq_items, { question: "", answer: "" }] }; setSite(u); autoSave(u); }
  function upFaq(i: number, f: "question" | "answer", v: string) { if (!site) return; const it = [...site.faq_items]; it[i] = { ...it[i], [f]: v }; const u = { ...site, faq_items: it }; setSite(u); autoSave(u); }
  function rmFaq(i: number) { if (!site) return; const u = { ...site, faq_items: site.faq_items.filter((_, x) => x !== i) }; setSite(u); autoSave(u); }
  function rmHero(i: number) { if (!site) return; const u = { ...site, hero_photos: site.hero_photos.filter((_, x) => x !== i) }; setSite(u); autoSave(u); }

  async function doUpload(e: React.ChangeEvent<HTMLInputElement>, t: string, folder: string) {
    const f = e.target.files?.[0]; if (!f) return;
    setUpTarget(t); setUpProg(0);
    try {
      const url = await uploadCld(f, folder, setUpProg); setUpProg(null); setUpTarget(null);
      if (t === "headshot") { setLens(p => p ? { ...p, saved_headshot_url: url } : p); await saveLens("saved_headshot_url", url); }
      else if (t === "logo") { setLens(p => p ? { ...p, saved_logo_url: url } : p); await saveLens("saved_logo_url", url); }
      else if (t === "hero_photo" && site) { const u = { ...site, hero_photos: [...site.hero_photos, url] }; setSite(u); autoSave(u); }
      else if (t === "hero_video" && site) { const u = { ...site, hero_video_url: url }; setSite(u); autoSave(u); }
    } catch { setUpProg(null); setUpTarget(null); setSaveStatus("error"); }
  }

  function pick(url: string) {
    if (!site || !pickerTarget) return;
    if (pickerTarget === "hero_photo") { const u = { ...site, hero_photos: [...site.hero_photos, url] }; setSite(u); autoSave(u); }
    else if (pickerTarget === "hero_video") { const u = { ...site, hero_video_url: url }; setSite(u); autoSave(u); }
    else if (pickerTarget === "about_photo") { const u = { ...site, about_photo_url: url }; setSite(u); autoSave(u); }
    else if (pickerTarget === "headshot") { setLens(p => p ? { ...p, saved_headshot_url: url } : p); saveLens("saved_headshot_url", url); }
    else if (pickerTarget === "logo") { setLens(p => p ? { ...p, saved_logo_url: url } : p); saveLens("saved_logo_url", url); }
    setPickerOpen(false); setPickerTarget(null);
  }
  function openPick(t: string, f?: "all" | "image" | "video") { setPickerTarget(t); setPickerFilter(f || "all"); setPickerOpen(true); }

  function copyUrl(url: string) { navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(null), 1500); }

  // Use a media item as hero
  function useAsHero(m: MediaItem) {
    if (!site) return;
    if (m.type === "image") { const u = { ...site, hero_photos: [...site.hero_photos, m.url] }; setSite(u); autoSave(u); }
    else { const u = { ...site, hero_video_url: m.url }; setSite(u); autoSave(u); }
  }

  const filtMedia = mediaFilter === "all" ? media : media.filter(m => m.type === mediaFilter);
  const pickFilt = pickerFilter === "all" ? media : media.filter(m => m.type === pickerFilter);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "hero", label: "Hero" }, { key: "brand", label: "Brand" }, { key: "content", label: "Content" },
    { key: "media", label: `Media (${media.length})` }, { key: "faq", label: "FAQ" }, { key: "features", label: "Features" },
  ];

  if (authLoading) return <Ctr><p style={{ color: "#9ca3af" }}>Loading…</p></Ctr>;
  if (!user) { const r = `https://${handle}.p2v.homes/editor/${handle}/auth-callback`; return <Ctr><p style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>Site Editor</p><p style={{ color: "#94a3b8", marginBottom: 20 }}>Sign in to edit {handle}.p2v.homes</p><a href={`https://realestatephoto2video.com/login?redirect=${encodeURIComponent(r)}`} style={S.primaryBtn}>Log in →</a></Ctr>; }
  if (loadErr) return <Ctr><p style={{ color: "#dc2626" }}>{loadErr}</p></Ctr>;
  if (!site) return <Ctr><p style={{ color: "#9ca3af" }}>Loading site…</p></Ctr>;

  return (
    <div style={S.page}><style>{CSS}</style>
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "#6366f1" }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Editor</span>
          <span style={{ fontSize: 12, color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: 6 }}>{handle}.p2v.homes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SaveBdg s={saveStatus} />
          <a href={`https://${handle}.p2v.homes`} target="_blank" rel="noopener noreferrer" style={S.viewBtn}>View site ↗</a>
        </div>
      </header>

      <nav style={S.tabBar}>{tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ ...S.tabItem, color: tab === t.key ? "#4f46e5" : "#9ca3af", fontWeight: tab === t.key ? 600 : 400, borderBottom: tab === t.key ? "2px solid #6366f1" : "2px solid transparent" }}>{t.label}</button>)}</nav>

      <main style={S.main}><div style={S.ctr}>

        {tab === "hero" && <>
          <Hd title="Hero Section" sub="The banner visitors see first" />
          <Cd title="Hero Video" sub="Auto-plays behind your hero. MP4 or WebM.">
            {site.hero_video_url ? <div>
              <video src={site.hero_video_url} muted loop autoPlay playsInline style={{ width: "100%", borderRadius: 8, maxHeight: 220, objectFit: "cover" }} />
              <button onClick={() => up("hero_video_url", null)} style={S.dng}>Remove video</button>
            </div> : <div style={{ display: "flex", gap: 8 }}>
              <UZ accept="video/mp4,video/webm,video/quicktime" label="Upload video" onChange={e => doUpload(e, "hero_video", "photo2video/hero")} uping={upTarget === "hero_video"} prog={upTarget === "hero_video" ? upProg : null} />
              <LB label="From your videos" onClick={() => openPick("hero_video", "video")} />
            </div>}
          </Cd>
          <Cd title="Hero Photos" sub={site.hero_photos.length ? `${site.hero_photos.length} photo${site.hero_photos.length > 1 ? "s" : ""}` : "Falls back to listing photos when empty"}>
            {site.hero_photos.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{site.hero_photos.map((u, i) => <div key={i} className="tw"><img src={u} alt="" style={{ width: 130, height: 90, objectFit: "cover", borderRadius: 8 }} /><button className="tx" onClick={() => rmHero(i)}>×</button></div>)}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <UZ accept="image/*" label="Upload photo" onChange={e => doUpload(e, "hero_photo", "photo2video/hero")} uping={upTarget === "hero_photo"} prog={upTarget === "hero_photo" ? upProg : null} compact />
              <LB label="From your photos" onClick={() => openPick("hero_photo", "image")} />
            </div>
          </Cd>
        </>}

        {tab === "brand" && <>
          <Hd title="Brand & Identity" sub="Your photos, colors, and site info" />
          <Cd title="Agent Photos" sub="From your Design Studio — replace anytime">
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={S.label}>Headshot</label>
                {lens?.saved_headshot_url ? <img src={lens.saved_headshot_url} alt="" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb", display: "block" }} /> : <div style={{ width: 110, height: 110, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>No headshot</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <SU accept="image/*" label="Upload" onChange={e => doUpload(e, "headshot", "photo2video/design-studio")} uping={upTarget === "headshot"} />
                  <button onClick={() => openPick("headshot", "image")} style={S.sm}>Library</button>
                </div>
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label style={S.label}>Logo</label>
                {lens?.saved_logo_url ? <img src={lens.saved_logo_url} alt="" style={{ height: 70, maxWidth: 180, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", padding: 8, background: "#fff", display: "block" }} /> : <div style={{ width: 150, height: 70, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>No logo</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <SU accept="image/*" label="Upload" onChange={e => doUpload(e, "logo", "photo2video/agent-profiles")} uping={upTarget === "logo"} />
                  <button onClick={() => openPick("logo", "image")} style={S.sm}>Library</button>
                </div>
              </div>
            </div>
          </Cd>
          <Cd title="Site Info">
            <Fl label="Site Title" value={site.site_title ?? ""} onChange={v => up("site_title", v)} ph="e.g. Wall to Wall Real Estate" />
            <Fl label="Tagline" value={site.tagline ?? ""} onChange={v => up("tagline", v)} ph="e.g. Your dream home in Costa Rica" />
            <div style={S.fg}><label style={S.label}>Primary Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={site.primary_color ?? "#334155"} onChange={e => up("primary_color", e.target.value)} style={{ width: 42, height: 42, border: "1px solid #d1d5db", borderRadius: 10, cursor: "pointer", padding: 2 }} />
                <input type="text" value={site.primary_color ?? "#334155"} onChange={e => up("primary_color", e.target.value)} style={{ ...S.input, width: 110 }} />
                {lens?.saved_company_colors?.length ? <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>{lens.saved_company_colors.map((c, i) => <button key={i} onClick={() => up("primary_color", c)} title={c} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: site.primary_color === c ? "2px solid #0f172a" : "1px solid #d1d5db", cursor: "pointer" }} />)}<span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center" }}>brand</span></div> : null}
              </div>
            </div>
          </Cd>
          {lens && <Cd title="Agent Profile" sub="From your Design Studio" muted><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Inf l="Name" v={lens.saved_agent_name} /><Inf l="Company" v={lens.saved_company} /><Inf l="Phone" v={lens.saved_phone} /><Inf l="Email" v={lens.saved_email} /></div></Cd>}
        </>}

        {tab === "content" && <>
          <Hd title="Content" sub="Homepage bio and about page text" />
          <Cd>
            <TA label="Bio (homepage)" value={site.bio ?? ""} onChange={v => up("bio", v)} ph="A brief intro — 2-3 sentences" rows={3} />
            <TA label="About Content (about page)" value={site.about_content ?? ""} onChange={v => up("about_content", v)} ph="Your full story…" rows={8} />
          </Cd>
        </>}

        {tab === "media" && <>
          <Hd title="Media Library" sub={`${media.length} items from your orders and Design Studio`} />
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["all", "image", "video"] as const).map(f => <button key={f} onClick={() => setMediaFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + (mediaFilter === f ? "#6366f1" : "#e5e7eb"), background: mediaFilter === f ? "#eef2ff" : "#fff", color: mediaFilter === f ? "#4f46e5" : "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{f === "all" ? `All (${media.length})` : f === "image" ? `Photos (${media.filter(m => m.type === "image").length})` : `Videos (${media.filter(m => m.type === "video").length})`}</button>)}
          </div>
          {filtMedia.length === 0 ? <Cd><div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}><p style={{ fontSize: 32, marginBottom: 8 }}>📷</p><p>No {mediaFilter === "all" ? "media" : mediaFilter + "s"} found</p></div></Cd> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {filtMedia.map(m => (
                <div key={m.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff" }}>
                  {/* Thumbnail / Preview */}
                  <div onClick={() => setPreviewItem(m)} style={{ cursor: "pointer", position: "relative" }}>
                    {m.type === "video" ? (
                      <div style={{ width: "100%", height: 120, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {m.thumb ? <img src={m.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} /> : null}
                        <span style={{ position: "absolute", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", backdropFilter: "blur(4px)" }}>▶</span>
                      </div>
                    ) : <img src={m.thumb} alt={m.label} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  </div>
                  {/* Info + Actions */}
                  <div style={{ padding: "10px 12px" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 8px" }}>{m.source}{m.property ? ` · ${m.property}` : ""}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => setPreviewItem(m)} style={S.actionBtn}>{m.type === "video" ? "▶ Play" : "🔍 Preview"}</button>
                      <button onClick={() => useAsHero(m)} style={S.actionBtn}>{m.type === "video" ? "🎬 Set as hero" : "🖼 Set as hero"}</button>
                      <button onClick={() => copyUrl(m.url)} style={S.actionBtn}>{copied === m.url ? "✓ Copied" : "🔗 Copy link"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {tab === "faq" && <>
          <Hd title="FAQ" sub="Frequently asked questions on your homepage" />
          {site.faq_items.map((item, i) => <Cd key={i}><Fl label={`Question ${i + 1}`} value={item.question} onChange={v => upFaq(i, "question", v)} ph="e.g. What areas do you cover?" /><TA label="Answer" value={item.answer} onChange={v => upFaq(i, "answer", v)} ph="Your answer…" rows={3} /><button onClick={() => rmFaq(i)} style={S.dng}>Remove</button></Cd>)}
          <button onClick={addFaq} style={S.addBtn}>+ Add FAQ item</button>
        </>}

        {tab === "features" && <>
          <Hd title="Features" sub="Toggle site sections on or off" />
          <Cd>
            <Tg label="Blog" desc="Show blog page and nav link" on={site.blog_enabled} onTg={() => up("blog_enabled", !site.blog_enabled)} />
            <Tg label="Calendar" desc="Show calendar page for bookings" on={site.calendar_enabled} onTg={() => up("calendar_enabled", !site.calendar_enabled)} />
            <Tg label="Listings" desc="Show your property listings" on={site.listings_opt_in} onTg={() => up("listings_opt_in", !site.listings_opt_in)} last />
          </Cd>
        </>}

      </div></main>

      {/* ─── Media Picker Modal ─── */}
      {pickerOpen && <div className="mbg" onClick={() => { setPickerOpen(false); setPickerTarget(null); }}><div className="mbox" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Choose from your media</h3><p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{pickFilt.length} items</p></div>
          <button onClick={() => { setPickerOpen(false); setPickerTarget(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        {pickFilt.length === 0 ? <p style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No matching media</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {pickFilt.map(m => <div key={m.id} onClick={() => pick(m.url)} className="ptb" style={{ cursor: "pointer" }}>
              {m.type === "video" ? <div style={{ width: "100%", height: 90, background: "#111", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>{m.thumb ? <img src={m.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} /> : null}<span style={{ position: "absolute", fontSize: 20, color: "white" }}>▶</span></div> : <img src={m.thumb} alt={m.label} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />}
              <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</p>
            </div>)}
          </div>
        )}
      </div></div>}

      {/* ─── Preview / Player Modal ─── */}
      {previewItem && <div className="mbg" onClick={() => setPreviewItem(null)}><div className="mbox" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{previewItem.label}</h3><p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{previewItem.source}{previewItem.property ? ` · ${previewItem.property}` : ""}</p></div>
          <button onClick={() => setPreviewItem(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        {previewItem.type === "video" ? (
          previewItem.url.includes("drive.google.com") ? (
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
              <iframe src={previewItem.url.replace("/view", "/preview")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
            </div>
          ) : (
            <video src={previewItem.url} controls autoPlay style={{ width: "100%", borderRadius: 8, maxHeight: 500 }} />
          )
        ) : (
          <img src={previewItem.url} alt={previewItem.label} style={{ width: "100%", borderRadius: 8, maxHeight: 600, objectFit: "contain", background: "#f1f5f9" }} />
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => useAsHero(previewItem)} style={S.actionBtnLg}>🖼 Use as hero</button>
          <button onClick={() => copyUrl(previewItem.url)} style={S.actionBtnLg}>{copied === previewItem.url ? "✓ Copied!" : "🔗 Copy link"}</button>
          <a href={previewItem.url} target="_blank" rel="noopener noreferrer" style={{ ...S.actionBtnLg, textDecoration: "none" }}>↗ Open original</a>
        </div>
      </div></div>}
    </div>
  );
}

// ─── Sub Components ───
function Ctr({ children }: { children: React.ReactNode }) { return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',system-ui,sans-serif", padding: 32, textAlign: "center", flexDirection: "column" }}>{children}</div>; }
function SaveBdg({ s }: { s: SaveStatus }) { if (s === "idle") return null; const c = { saving: { t: "Saving…", bg: "#fef3c7", fg: "#92400e" }, saved: { t: "Saved ✓", bg: "#dcfce7", fg: "#166534" }, error: { t: "Save failed", bg: "#fef2f2", fg: "#991b1b" } }[s]!; return <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: c.bg, color: c.fg, fontWeight: 500 }}>{c.t}</span>; }
function Hd({ title, sub }: { title: string; sub: string }) { return <div style={{ marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{sub}</p></div>; }
function Cd({ title, sub, muted, children }: { title?: string; sub?: string; muted?: boolean; children: React.ReactNode }) { return <div style={{ background: muted ? "#f8fafc" : "#fff", border: "1px solid #eaedf0", borderRadius: 14, padding: "20px 24px", marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>{title && <div style={{ marginBottom: 14 }}><span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", display: "block" }}>{title}</span>{sub && <span style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</span>}</div>}{children}</div>; }
function Fl({ label, value, onChange, ph }: { label: string; value: string; onChange: (v: string) => void; ph?: string }) { return <div style={S.fg}><label style={S.label}>{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={ph} style={S.input} /></div>; }
function TA({ label, value, onChange, ph, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; ph?: string; rows?: number }) { return <div style={S.fg}><label style={S.label}>{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} placeholder={ph} rows={rows} style={S.ta} /></div>; }
function Tg({ label, desc, on, onTg, last }: { label: string; desc: string; on: boolean; onTg: () => void; last?: boolean }) { return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid #f1f5f9" }}><div><span style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{label}</span><p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{desc}</p></div><button onClick={onTg} style={{ width: 46, height: 25, borderRadius: 99, background: on ? "#6366f1" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}><span style={{ width: 19, height: 19, borderRadius: 99, background: "#fff", position: "absolute", top: 3, left: on ? 24 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} /></button></div>; }
function Inf({ l, v }: { l: string; v: string | null }) { return <div><span style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</span><p style={{ margin: "2px 0 0", color: "#374151", fontSize: 13 }}>{v || "—"}</p></div>; }
function UZ({ accept, label, onChange, uping, prog, compact }: { accept: string; label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; uping: boolean; prog: number | null; compact?: boolean }) { const r = useRef<HTMLInputElement>(null); return <div className="uz" onClick={() => r.current?.click()} style={compact ? { padding: 14, flex: 1 } : {}}><input ref={r} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />{uping && prog !== null ? <div style={{ width: "100%" }}><p style={{ fontSize: 13, color: "#6366f1", margin: "0 0 6px" }}>Uploading… {prog}%</p><div className="pb"><div className="pf" style={{ width: `${prog}%` }} /></div></div> : <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontWeight: 500 }}>{compact ? "📎 " : "📤 "}{label}</p>}</div>; }
function SU({ accept, label, onChange, uping }: { accept: string; label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; uping: boolean }) { const r = useRef<HTMLInputElement>(null); return <><input ref={r} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} /><button onClick={() => r.current?.click()} style={S.sm} disabled={uping}>{uping ? "…" : `📎 ${label}`}</button></>; }
function LB({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick} style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px dashed #d1d5db", background: "#fafafa", cursor: "pointer", fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "inherit" }}>📂 {label}</button>; }

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8f9fb", fontFamily: "'DM Sans',system-ui,sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  viewBtn: { fontSize: 13, color: "#6366f1", textDecoration: "none", fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e7ff", background: "#f5f3ff" },
  tabBar: { background: "#fff", borderBottom: "1px solid #eaedf0", padding: "0 20px", display: "flex", gap: 2, overflowX: "auto" },
  tabItem: { background: "none", border: "none", padding: "12px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s" },
  main: { padding: 20 }, ctr: { maxWidth: 780, margin: "0 auto" },
  fg: { marginBottom: 16 }, label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, color: "#0f172a", boxSizing: "border-box", background: "#fff", fontFamily: "inherit" },
  ta: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, color: "#0f172a", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", background: "#fff" },
  primaryBtn: { display: "inline-block", padding: "10px 28px", background: "#4f46e5", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600 },
  sm: { fontSize: 12, color: "#6b7280", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  addBtn: { width: "100%", padding: 14, borderRadius: 12, border: "2px dashed #c7d2fe", background: "#fafafe", cursor: "pointer", fontSize: 14, color: "#6366f1", fontWeight: 500, fontFamily: "inherit" },
  dng: { fontSize: 12, color: "#ef4444", border: "none", background: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit", marginTop: 8, display: "block" },
  actionBtn: { fontSize: 11, color: "#4f46e5", border: "1px solid #e0e7ff", background: "#f5f3ff", cursor: "pointer", padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontWeight: 500, whiteSpace: "nowrap" },
  actionBtnLg: { fontSize: 13, color: "#4f46e5", border: "1px solid #e0e7ff", background: "#f5f3ff", cursor: "pointer", padding: "8px 16px", borderRadius: 8, fontFamily: "inherit", fontWeight: 500, display: "inline-block" },
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}body{margin:0}
input:focus,textarea:focus{border-color:#6366f1!important;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.1)}
.uz{border:2px dashed #d1d5db;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}.uz:hover{border-color:#6366f1;background:#f5f3ff}
.tw{position:relative;display:inline-block}.tw .tx{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}.tw:hover .tx{opacity:1}
.pb{height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden}.pf{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .3s}
.mbg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.mbox{background:#fff;border-radius:16px;width:90%;max-width:780px;max-height:85vh;overflow-y:auto;padding:24px;box-shadow:0 25px 50px rgba(0,0,0,.25)}
.ptb:hover img,.ptb:hover div{outline:2px solid #6366f1;outline-offset:-2px;border-radius:8px}`;
