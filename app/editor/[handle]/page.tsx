"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

interface FaqItem { question: string; answer: string; }

interface SiteData {
  id: string;
  site_title: string | null;
  tagline: string | null;
  bio: string | null;
  about_content: string | null;
  primary_color: string | null;
  faq_items: FaqItem[];
  blog_enabled: boolean;
  calendar_enabled: boolean;
  listings_opt_in: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SiteEditor({ params }: { params: Promise<{ handle: string }> }) {
  const [handle, setHandle] = useState<string>("");
  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { handle: h } = await params;
      setHandle(h);

      // Login redirects to auth-callback which sets the session on p2v.homes
      const callbackUrl = `https://${h}.p2v.homes/editor/auth-callback`;
      setLoginUrl(
        `https://realestatephoto2video.com/login?redirect=${encodeURIComponent(callbackUrl)}`
      );

      const supabase = getSupabase();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setAuthError("not_logged_in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("agent_websites")
        .select("*")
        .eq("handle", h)
        .limit(1);

      if (error || !data || data.length === 0) {
        setAuthError("not_found");
        setLoading(false);
        return;
      }

      const row = data[0];
      if (row.user_id !== user.id) {
        setAuthError("not_owner");
        setLoading(false);
        return;
      }

      siteIdRef.current = row.id;
      setSite({
        id: row.id,
        site_title: row.site_title ?? "",
        tagline: row.tagline ?? "",
        bio: row.bio ?? "",
        about_content: row.about_content ?? "",
        primary_color: row.primary_color ?? "#334155",
        faq_items: Array.isArray(row.faq_items) ? row.faq_items : [],
        blog_enabled: row.blog_enabled ?? false,
        calendar_enabled: row.calendar_enabled ?? false,
        listings_opt_in: row.listings_opt_in ?? false,
      });
      setLoading(false);
    })();
  }, [params]);

  const triggerSave = useCallback((updated: SiteData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      if (!siteIdRef.current) return;
      const supabase = getSupabase();
      const { error } = await supabase
        .from("agent_websites")
        .update({
          site_title: updated.site_title,
          tagline: updated.tagline,
          bio: updated.bio,
          about_content: updated.about_content,
          primary_color: updated.primary_color,
          faq_items: updated.faq_items,
          blog_enabled: updated.blog_enabled,
          calendar_enabled: updated.calendar_enabled,
          listings_opt_in: updated.listings_opt_in,
        })
        .eq("id", siteIdRef.current);
      setSaveStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setSaveStatus("idle"), 2500);
    }, 1500);
  }, []);

  function update<K extends keyof SiteData>(key: K, value: SiteData[K]) {
    if (!site) return;
    const updated = { ...site, [key]: value };
    setSite(updated);
    triggerSave(updated);
  }

  function faqUpdate(index: number, field: "question" | "answer", value: string) {
    if (!site) return;
    update("faq_items", site.faq_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  function faqAdd() {
    if (!site) return;
    update("faq_items", [...site.faq_items, { question: "", answer: "" }]);
  }

  function faqRemove(index: number) {
    if (!site) return;
    update("faq_items", site.faq_items.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your site editor…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (authError) {
    const messages: Record<string, string> = {
      not_logged_in: "You must be logged in to edit your site.",
      not_found: "Site not found.",
      not_owner: "You don't have permission to edit this site.",
    };
    return (
      <div style={styles.centered}>
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{messages[authError] ?? "Something went wrong."}</p>
          {authError === "not_logged_in" && (
            <a href={loginUrl} style={styles.loginLink}>Log in →</a>
          )}
        </div>
      </div>
    );
  }

  if (!site) return null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <p style={styles.headerEyebrow}>Site Editor</p>
            <h1 style={styles.headerTitle}>{handle}.p2v.homes</h1>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>
      </header>

      <main style={styles.main}>

        <Section title="Brand" description="Your site's headline identity.">
          <Field label="Site title">
            <input style={styles.input} value={site.site_title ?? ""} onChange={e => update("site_title", e.target.value)} placeholder="e.g. Wall to Wall Real Estate" />
          </Field>
          <Field label="Tagline">
            <input style={styles.input} value={site.tagline ?? ""} onChange={e => update("tagline", e.target.value)} placeholder="e.g. Living the life!" />
          </Field>
          <Field label="Primary color" hint="Used for buttons and accents across your site.">
            <div style={styles.colorRow}>
              <input type="color" value={site.primary_color ?? "#334155"} onChange={e => update("primary_color", e.target.value)} style={styles.colorSwatch} />
              <input style={{ ...styles.input, flex: 1 }} value={site.primary_color ?? ""} onChange={e => update("primary_color", e.target.value)} placeholder="#334155" maxLength={7} />
            </div>
          </Field>
        </Section>

        <Section title="Content" description="Your bio and about page copy.">
          <Field label="Bio" hint="Short intro shown on your homepage and about page.">
            <textarea style={{ ...styles.input, ...styles.textarea }} value={site.bio ?? ""} onChange={e => update("bio", e.target.value)} placeholder="Tell visitors a bit about yourself…" rows={4} />
          </Field>
          <Field label="About page content" hint="Longer copy shown only on your About page.">
            <textarea style={{ ...styles.input, ...styles.textarea }} value={site.about_content ?? ""} onChange={e => update("about_content", e.target.value)} placeholder="Share your story, experience, and what makes you different…" rows={7} />
          </Field>
        </Section>

        <Section title="FAQ" description="Questions and answers shown on your homepage and about page.">
          {site.faq_items.length === 0 && (
            <p style={styles.emptyHint}>No FAQ items yet. Add your first one below.</p>
          )}
          {site.faq_items.map((item, i) => (
            <div key={i} style={styles.faqItem}>
              <div style={styles.faqHeader}>
                <span style={styles.faqIndex}>Q{i + 1}</span>
                <button onClick={() => faqRemove(i)} style={styles.removeBtn}>✕</button>
              </div>
              <input style={{ ...styles.input, marginBottom: 8 }} value={item.question} onChange={e => faqUpdate(i, "question", e.target.value)} placeholder="Question" />
              <textarea style={{ ...styles.input, ...styles.textarea }} value={item.answer} onChange={e => faqUpdate(i, "answer", e.target.value)} placeholder="Answer" rows={3} />
            </div>
          ))}
          <button onClick={faqAdd} style={styles.addBtn}>+ Add FAQ item</button>
        </Section>

        <Section title="Features" description="Toggle sections on or off for your site.">
          <Toggle label="Blog" description="Show a blog section and nav link." checked={site.blog_enabled} onChange={v => update("blog_enabled", v)} />
          <Toggle label="Calendar" description="Show a calendar section and nav link." checked={site.calendar_enabled} onChange={v => update("calendar_enabled", v)} />
          <Toggle label="Listings" description="Show your property listings on the site." checked={site.listings_opt_in} onChange={v => update("listings_opt_in", v)} />
        </Section>

      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionDesc}>{description}</p>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {hint && <p style={styles.hint}>{hint}</p>}
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={styles.toggleRow}>
      <div style={styles.toggleText}>
        <span style={styles.toggleLabel}>{label}</span>
        <span style={styles.toggleDesc}>{description}</span>
      </div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} style={{ ...styles.toggleTrack, background: checked ? "#334155" : "#d1d5db" }}>
        <span style={{ ...styles.toggleThumb, transform: checked ? "translateX(20px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { text: string; color: string }> = {
    idle: { text: "", color: "transparent" },
    saving: { text: "Saving…", color: "#6b7280" },
    saved: { text: "Saved ✓", color: "#16a34a" },
    error: { text: "Save failed", color: "#dc2626" },
  };
  const { text, color } = map[status];
  return <span style={{ fontSize: 13, color, transition: "color 0.2s", minWidth: 80, textAlign: "right" }}>{text}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { background: "#ffffff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { maxWidth: 720, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerEyebrow: { margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#94a3b8" },
  headerTitle: { margin: "2px 0 0", fontSize: 18, fontWeight: 600, color: "#0f172a" },
  main: { maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px", display: "flex", flexDirection: "column" as const, gap: 32 },
  section: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  sectionHeader: { padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  sectionTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" },
  sectionDesc: { margin: "2px 0 0", fontSize: 13, color: "#64748b" },
  sectionBody: { padding: "20px 24px", display: "flex", flexDirection: "column" as const, gap: 20 },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  hint: { margin: 0, fontSize: 12, color: "#94a3b8" },
  input: { width: "100%", padding: "8px 12px", fontSize: 14, color: "#0f172a", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", transition: "border-color 0.15s" },
  textarea: { resize: "vertical" as const, lineHeight: 1.6 },
  colorRow: { display: "flex", alignItems: "center", gap: 10 },
  colorSwatch: { width: 40, height: 38, padding: 2, border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: "none" },
  faqItem: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column" as const, gap: 0 },
  faqHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  faqIndex: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#94a3b8" },
  removeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#94a3b8", padding: "2px 6px", borderRadius: 4 },
  addBtn: { alignSelf: "flex-start" as const, background: "none", border: "1px dashed #cbd5e1", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" },
  emptyHint: { margin: 0, fontSize: 13, color: "#94a3b8", fontStyle: "italic" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "4px 0" },
  toggleText: { display: "flex", flexDirection: "column" as const, gap: 1 },
  toggleLabel: { fontSize: 14, fontWeight: 500, color: "#0f172a" },
  toggleDesc: { fontSize: 12, color: "#64748b" },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 0, position: "relative" as const, flexShrink: 0, transition: "background 0.2s" },
  toggleThumb: { position: "absolute" as const, top: 2, width: 20, height: 20, borderRadius: 10, background: "#ffffff", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
  centered: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 16, background: "#f8fafc" },
  spinner: { width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #334155", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { margin: 0, fontSize: 14, color: "#64748b" },
  errorBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "32px 40px", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, gap: 16 },
  errorText: { margin: 0, fontSize: 15, color: "#374151" },
  loginLink: { fontSize: 14, color: "#334155", fontWeight: 500 },
};
