// ============================================================
// FILE: app/site/[handle]/locations/[slug]/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSite, getProfile } from "../../data";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

async function getLocationPage(handle: string, slug: string) {
  const { data: pages } = await supabase
    .from("agent_location_pages")
    .select("*")
    .eq("handle", handle)
    .eq("location_slug", slug)
    .eq("published", true)
    .limit(1);
  return pages?.[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const page = await getLocationPage(handle, slug);
  if (!page) return {};
  const site = await getSite(handle);
  if (!site) return {};
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const title = page.page_title || `${page.location_name} Real Estate | ${agent}`;
  const description = page.meta_description || `Explore real estate in ${page.location_name}. ${agent} is your local expert.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(page.hero_photo_url && { images: [{ url: page.hero_photo_url }] }),
    },
    twitter: {
      card: page.hero_photo_url ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const { handle, slug } = await params;
  const page = await getLocationPage(handle, slug);
  if (!page) return notFound();

  const site = await getSite(handle);
  const primary = site?.primary_color || "#334155";

  const { data: lensRows } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company")
    .eq("user_id", page.user_id)
    .limit(1);
  const agent = lensRows?.[0];

  const sections = parseMarkdown(page.body_content || "");
  const photos: { url: string | null; alt: string; caption: string }[] = Array.isArray(page.photos) ? page.photos : [];
  const photosWithUrls = photos.filter(p => p.url);

  return (
    <div>
      {/* Hero */}
      <section style={{
        position: "relative",
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary,
        overflow: "hidden",
      }}>
        {page.hero_photo_url ? (
          <>
            <img src={page.hero_photo_url} alt={`${page.location_name} real estate`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)" }} />
          </>
        ) : null}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 24px", maxWidth: 700 }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {page.region ? `${page.region}, ` : ""}{page.country || "Costa Rica"}
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.1, textShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
            {page.hero_heading || page.location_name}
          </h1>
          {page.intro_text ? (
            <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
              {page.intro_text}
            </p>
          ) : null}
        </div>
      </section>

      {/* Highlights */}
      {page.highlights?.length > 0 ? (
        <section style={{ padding: "48px 24px", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {page.highlights.map((h: string, i: number) => (
              <div key={i} style={{ padding: "16px 20px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ color: primary, fontSize: 18, flexShrink: 0, marginTop: 1 }}>✦</span>
                <p style={{ fontSize: 15, color: "#374151", margin: 0, lineHeight: 1.5 }}>{h}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Body Content */}
      <section style={{ padding: "56px 24px", maxWidth: 800, margin: "0 auto" }}>
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            {section.heading ? (
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: "0 0 16px", borderBottom: "2px solid " + primary, paddingBottom: 8, display: "inline-block" }}>
                {section.heading}
              </h2>
            ) : null}
            {section.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize: 16, color: "#444", margin: "0 0 14px", lineHeight: 1.7 }}>{p}</p>
            ))}
            {photosWithUrls[i] ? (
              <div style={{ margin: "24px 0", borderRadius: 10, overflow: "hidden" }}>
                <img
                  src={photosWithUrls[i].url!}
                  alt={photosWithUrls[i].alt}
                  style={{ width: "100%", maxHeight: 400, objectFit: "cover" }}
                />
                {photosWithUrls[i].caption ? (
                  <p style={{ fontSize: 13, color: "#888", margin: "8px 0 0", fontStyle: "italic" }}>
                    {photosWithUrls[i].caption}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ padding: "56px 24px", backgroundColor: primary, textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
          Interested in {page.location_name}?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "0 0 24px" }}>
          {agent?.saved_agent_name ? `${agent.saved_agent_name} can help you find your perfect property` : "Get in touch to learn more about properties in this area"}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/contact" style={{ display: "inline-block", padding: "14px 36px", backgroundColor: "#fff", color: primary, borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
            Contact {agent?.saved_agent_name?.split(" ")[0] || "Us"}
          </a>
          <a href="/listings" style={{ display: "inline-block", padding: "14px 36px", backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
            View Listings
          </a>
        </div>
      </section>
    </div>
  );
}

function parseMarkdown(md: string): { heading: string | null; paragraphs: string[] }[] {
  const lines = md.split("\n");
  const sections: { heading: string | null; paragraphs: string[] }[] = [];
  let current: { heading: string | null; paragraphs: string[] } = { heading: null, paragraphs: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (current.paragraphs.length > 0 || current.heading) sections.push(current);
      current = { heading: trimmed.replace(/^##\s*/, ""), paragraphs: [] };
    } else if (trimmed.length > 0) {
      const cleaned = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
      current.paragraphs.push(cleaned);
    }
  }
  if (current.paragraphs.length > 0 || current.heading) sections.push(current);
  return sections;
}
