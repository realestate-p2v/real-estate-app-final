// app/site/[handle]/locations/page.tsx
// Lists all published location pages for the agent
// URL: mattsrealty.p2v.homes/locations

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function LocationsIndexPage({ params }: Props) {
  const { handle } = await params;

  const { data: siteRows } = await supabase
    .from("agent_websites").select("primary_color, site_title, user_id").eq("handle", handle).limit(1);
  if (!siteRows?.length) return notFound();
  const site = siteRows[0];
  const primary = site.primary_color || "#334155";

  const { data: pages } = await supabase
    .from("agent_location_pages")
    .select("location_name, location_slug, region, country, hero_photo_url, intro_text, highlights")
    .eq("handle", handle).eq("published", true)
    .order("location_name");

  const locations = pages || [];

  return (
    <div>
      <section style={{ padding: "56px 24px", textAlign: "center", backgroundColor: primary }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
          Areas We Serve
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", margin: 0 }}>
          Explore the communities and neighborhoods where we help clients find their perfect home
        </p>
      </section>

      <section style={{ padding: "48px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {locations.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", padding: 40 }}>No location pages published yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {locations.map((loc) => (
              <a
                key={loc.location_slug}
                href={`/locations/${loc.location_slug}`}
                style={{ display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", backgroundColor: "#fff", textDecoration: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}
              >
                <div style={{ height: 180, backgroundColor: primary, position: "relative", overflow: "hidden" }}>
                  {loc.hero_photo_url ? (
                    <img src={loc.hero_photo_url} alt={`${loc.location_name} real estate`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 48, opacity: 0.3 }}>📍</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{loc.location_name}</h3>
                  <p style={{ fontSize: 13, color: "#888", margin: "0 0 10px" }}>
                    {[loc.region, loc.country].filter(Boolean).join(", ")}
                  </p>
                  {loc.intro_text ? (
                    <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.5 }}>
                      {loc.intro_text.substring(0, 140)}{loc.intro_text.length > 140 ? "…" : ""}
                    </p>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
