// app/editor/[handle]/page.tsx
// Repo: p2v.homes app
//
// Site editor CMS for agent websites.
// Session 4: Built. Session 5: Added "View site →" link (Priority 3).

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function EditorPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<"brand" | "content" | "faq" | "features">("brand");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth Check ───
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    }
    checkAuth();
  }, []);

  // ─── Load Site Data ───
  useEffect(() => {
    if (!user) return;

    async function loadSite() {
      const { data, error } = await supabase
        .from("agent_websites")
        .select("*")
        .eq("handle", handle)
        .limit(1);

      if (error) {
        setLoadError(`Failed to load site: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        setLoadError(`No site found for handle "${handle}".`);
        return;
      }

      const site = data[0];

      // Ownership check
      if (site.user_id !== user.id) {
        setLoadError("You don't have permission to edit this site.");
        return;
      }

      setSiteData({
        ...site,
        faq_items: site.faq_items ?? [],
      });
    }
    loadSite();
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
          })
          .eq("handle", handle);

        if (error) {
          console.error("Save failed:", error.message);
          setSaveStatus("error");
        } else {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        }
      }, 1500);
    },
    [handle]
  );

  // ─── Field Update Helper ───
  function updateField<K extends keyof SiteData>(key: K, value: SiteData[K]) {
    if (!siteData) return;
    const updated = { ...siteData, [key]: value };
    setSiteData(updated);
    autoSave(updated);
  }

  // ─── FAQ Helpers ───
  function addFaqItem() {
    if (!siteData) return;
    const updated = {
      ...siteData,
      faq_items: [...siteData.faq_items, { question: "", answer: "" }],
    };
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
    const items = siteData.faq_items.filter((_, i) => i !== index);
    const updated = { ...siteData, faq_items: items };
    setSiteData(updated);
    autoSave(updated);
  }

  // ─── Styles ───
  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    } as React.CSSProperties,
    header: {
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0.75rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky" as const,
      top: 0,
      zIndex: 50,
    } as React.CSSProperties,
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    } as React.CSSProperties,
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    } as React.CSSProperties,
    logo: {
      fontWeight: 700,
      fontSize: "0.875rem",
      color: "#0f172a",
      letterSpacing: "-0.02em",
    } as React.CSSProperties,
    viewSiteLink: {
      fontSize: "0.8125rem",
      color: "#64748b",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      transition: "color 0.15s",
    } as React.CSSProperties,
    saveIndicator: {
      fontSize: "0.75rem",
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
    } as React.CSSProperties,
    container: {
      maxWidth: "720px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
    } as React.CSSProperties,
    tabs: {
      display: "flex",
      gap: "0.25rem",
      marginBottom: "1.5rem",
      backgroundColor: "#f1f5f9",
      borderRadius: "0.5rem",
      padding: "0.25rem",
    } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: "0.5rem 1rem",
      borderRadius: "0.375rem",
      fontSize: "0.8125rem",
      fontWeight: active ? 600 : 400,
      color: active ? "#0f172a" : "#64748b",
      backgroundColor: active ? "#ffffff" : "transparent",
      border: "none",
      cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
    } as React.CSSProperties),
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      marginBottom: "1rem",
    } as React.CSSProperties,
    fieldGroup: {
      marginBottom: "1.25rem",
    } as React.CSSProperties,
    label: {
      display: "block",
      fontSize: "0.8125rem",
      fontWeight: 500,
      color: "#374151",
      marginBottom: "0.375rem",
    } as React.CSSProperties,
    input: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box" as const,
      transition: "border-color 0.15s",
    } as React.CSSProperties,
    textarea: {
      width: "100%",
      padding: "0.5rem 0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box" as const,
      resize: "vertical" as const,
      minHeight: "100px",
      fontFamily: "inherit",
    } as React.CSSProperties,
    colorRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    } as React.CSSProperties,
    colorPicker: {
      width: "40px",
      height: "40px",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      cursor: "pointer",
      padding: 0,
    } as React.CSSProperties,
    toggleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 0",
      borderBottom: "1px solid #f1f5f9",
    } as React.CSSProperties,
    toggleLabel: {
      fontSize: "0.875rem",
      color: "#374151",
    } as React.CSSProperties,
    toggle: (on: boolean) => ({
      width: "44px",
      height: "24px",
      borderRadius: "9999px",
      backgroundColor: on ? "#3b82f6" : "#d1d5db",
      border: "none",
      cursor: "pointer",
      position: "relative" as const,
      transition: "background-color 0.2s",
    } as React.CSSProperties),
    toggleDot: (on: boolean) => ({
      width: "18px",
      height: "18px",
      borderRadius: "9999px",
      backgroundColor: "#ffffff",
      position: "absolute" as const,
      top: "3px",
      left: on ? "23px" : "3px",
      transition: "left 0.2s",
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
    } as React.CSSProperties),
    faqCard: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "0.5rem",
      padding: "1rem",
      marginBottom: "0.75rem",
    } as React.CSSProperties,
    removeBtn: {
      fontSize: "0.75rem",
      color: "#ef4444",
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: "0.25rem 0",
    } as React.CSSProperties,
    addBtn: {
      fontSize: "0.8125rem",
      color: "#3b82f6",
      border: "1px dashed #93c5fd",
      background: "none",
      cursor: "pointer",
      padding: "0.5rem 1rem",
      borderRadius: "0.375rem",
      width: "100%",
    } as React.CSSProperties,
    centerMessage: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column" as const,
      gap: "1rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "2rem",
      textAlign: "center" as const,
    } as React.CSSProperties,
    loginLink: {
      display: "inline-block",
      padding: "0.5rem 1.5rem",
      backgroundColor: "#0f172a",
      color: "#ffffff",
      borderRadius: "0.375rem",
      textDecoration: "none",
      fontSize: "0.875rem",
      fontWeight: 500,
    } as React.CSSProperties,
  };

  // ─── Save Status Badge ───
  function SaveBadge() {
    const config = {
      idle: { text: "", bg: "transparent", color: "transparent" },
      saving: { text: "Saving…", bg: "#fef3c7", color: "#92400e" },
      saved: { text: "Saved ✓", bg: "#dcfce7", color: "#166534" },
      error: { text: "Save failed", bg: "#fef2f2", color: "#991b1b" },
    };
    const c = config[saveStatus];
    if (saveStatus === "idle") return null;
    return (
      <span style={{ ...styles.saveIndicator, backgroundColor: c.bg, color: c.color }}>
        {c.text}
      </span>
    );
  }

  // ─── Auth Loading ───
  if (authLoading) {
    return (
      <div style={styles.centerMessage}>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading…</p>
      </div>
    );
  }

  // ─── Not Logged In ───
  if (!user) {
    const redirectUrl = `https://${handle}.p2v.homes/editor/${handle}/auth-callback`;
    const loginUrl = `https://realestatephoto2video.com/login?redirect=${encodeURIComponent(redirectUrl)}`;

    return (
      <div style={styles.centerMessage}>
        <p style={{ color: "#374151", fontSize: "1rem", fontWeight: 500 }}>
          You must be logged in to edit this site.
        </p>
        <a href={loginUrl} style={styles.loginLink}>
          Log in →
        </a>
      </div>
    );
  }

  // ─── Load Error ───
  if (loadError) {
    return (
      <div style={styles.centerMessage}>
        <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{loadError}</p>
      </div>
    );
  }

  // ─── Loading Site Data ───
  if (!siteData) {
    return (
      <div style={styles.centerMessage}>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading site data…</p>
      </div>
    );
  }

  // ─── Editor ───
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>Site Editor</span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {handle}.p2v.homes
          </span>
        </div>
        <div style={styles.headerRight}>
          <SaveBadge />
          {/* ─── Priority 3: View Site Link ─── */}
          <a
            href={`https://${handle}.p2v.homes`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.viewSiteLink}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            View site
            <span style={{ fontSize: "0.875rem" }}>↗</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.container}>
        {/* Tabs */}
        <div style={styles.tabs}>
          {(["brand", "content", "faq", "features"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={styles.tab(activeTab === tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Brand Tab ─── */}
        {activeTab === "brand" && (
          <div style={styles.card}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Site Title</label>
              <input
                type="text"
                value={siteData.site_title ?? ""}
                onChange={(e) => updateField("site_title", e.target.value)}
                placeholder="e.g. Wall to Wall Real Estate"
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tagline</label>
              <input
                type="text"
                value={siteData.tagline ?? ""}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="e.g. Your dream home awaits"
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Primary Color</label>
              <div style={styles.colorRow}>
                <input
                  type="color"
                  value={siteData.primary_color ?? "#334155"}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  style={styles.colorPicker}
                />
                <input
                  type="text"
                  value={siteData.primary_color ?? "#334155"}
                  onChange={(e) => updateField("primary_color", e.target.value)}
                  placeholder="#334155"
                  style={{ ...styles.input, width: "120px" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Content Tab ─── */}
        {activeTab === "content" && (
          <div style={styles.card}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Bio (short — shown on homepage)</label>
              <textarea
                value={siteData.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="A brief intro about yourself…"
                style={{ ...styles.textarea, minHeight: "80px" }}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>About Content (long — about page only)</label>
              <textarea
                value={siteData.about_content ?? ""}
                onChange={(e) => updateField("about_content", e.target.value)}
                placeholder="Full about page content…"
                style={{ ...styles.textarea, minHeight: "180px" }}
              />
            </div>
          </div>
        )}

        {/* ─── FAQ Tab ─── */}
        {activeTab === "faq" && (
          <div>
            {siteData.faq_items.map((item, index) => (
              <div key={index} style={styles.faqCard}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Question</label>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => updateFaqItem(index, "question", e.target.value)}
                    placeholder="e.g. What areas do you serve?"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.fieldGroup, marginBottom: "0.5rem" }}>
                  <label style={styles.label}>Answer</label>
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFaqItem(index, "answer", e.target.value)}
                    placeholder="Your answer…"
                    style={{ ...styles.textarea, minHeight: "60px" }}
                  />
                </div>
                <button onClick={() => removeFaqItem(index)} style={styles.removeBtn}>
                  Remove this question
                </button>
              </div>
            ))}
            <button onClick={addFaqItem} style={styles.addBtn}>
              + Add FAQ item
            </button>
          </div>
        )}

        {/* ─── Features Tab ─── */}
        {activeTab === "features" && (
          <div style={styles.card}>
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Blog</span>
              <button
                onClick={() => updateField("blog_enabled", !siteData.blog_enabled)}
                style={styles.toggle(siteData.blog_enabled)}
              >
                <span style={styles.toggleDot(siteData.blog_enabled)} />
              </button>
            </div>
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Calendar</span>
              <button
                onClick={() => updateField("calendar_enabled", !siteData.calendar_enabled)}
                style={styles.toggle(siteData.calendar_enabled)}
              >
                <span style={styles.toggleDot(siteData.calendar_enabled)} />
              </button>
            </div>
            <div style={{ ...styles.toggleRow, borderBottom: "none" }}>
              <span style={styles.toggleLabel}>Listings opt-in</span>
              <button
                onClick={() => updateField("listings_opt_in", !siteData.listings_opt_in)}
                style={styles.toggle(siteData.listings_opt_in)}
              >
                <span style={styles.toggleDot(siteData.listings_opt_in)} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
