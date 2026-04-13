// app/site/[handle]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Agent homepage — hero, featured listings, about preview, contact CTA.
//
// Data comes from data.ts which mirrors the Design Studio's proven queries.
// All image URLs are used AS-IS from Supabase. No cloudinaryUrl() transforms.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgentSiteData } from "./data";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function AgentHomePage({ params }: Props) {
  const { handle } = await params;
  const data = await getAgentSiteData(handle);
  if (!data) return notFound();

  const { site, profile, listings, blogPosts } = data;

  // Template colors — fall back to sensible defaults
  const primaryColor = site.primary_color || "#1a1a2e";
  const accentColor = site.accent_color || site.secondary_color || "#e2725b";

  // Featured listings — first 6 with photos
  const featured = listings.filter((l) => l.photos.length > 0).slice(0, 6);

  // Format price
  const fmtPrice = (price: number | null) => {
    if (!price) return null;
    return "$" + price.toLocaleString("en-US");
  };

  // Build details string (3 BD · 2 BA · 1,800 SF)
  const fmtDetails = (l: (typeof listings)[0]) => {
    const parts = [];
    if (l.bedrooms) parts.push(`${l.bedrooms} BD`);
    if (l.bathrooms) parts.push(`${l.bathrooms} BA`);
    if (l.sqft) parts.push(`${l.sqft.toLocaleString()} SF`);
    return parts.join("  ·  ");
  };

  return (
    <div>
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primaryColor,
          overflow: "hidden",
        }}
      >
        {/* Background — use first listing photo if available */}
        {featured[0]?.photos[0] && (
          <>
            <img
              src={featured[0].photos[0]}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)",
              }}
            />
          </>
        )}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            padding: "80px 24px",
            maxWidth: 800,
          }}
        >
          {/* Headshot */}
          {profile.headshot_url && (
            <img
              src={profile.headshot_url}
              alt={profile.agent_name || "Agent"}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(255,255,255,0.3)",
                margin: "0 auto 24px",
                display: "block",
              }}
            />
          )}

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.1,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {site.site_title || profile.agent_name || "Welcome"}
          </h1>

          {profile.company && (
            <p
              style={{
                fontSize: "clamp(16px, 2.5vw, 22px)",
                color: "rgba(255,255,255,0.8)",
                margin: "0 0 8px",
                fontWeight: 500,
              }}
            >
              {profile.company}
            </p>
          )}

          {profile.phone && (
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.7)",
                margin: "0 0 32px",
              }}
            >
              {profile.phone}
            </p>
          )}

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/listings`}
              style={{
                display: "inline-block",
                padding: "14px 32px",
                backgroundColor: accentColor,
                color: "#fff",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              View Listings
            </Link>
            <Link
              href={`/about`}
              style={{
                display: "inline-block",
                padding: "14px 32px",
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#fff",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              About Me
            </Link>
          </div>

          {/* Logo below CTA */}
          {profile.logo_url && (
            <img
              src={profile.logo_url}
              alt={profile.company || "Logo"}
              style={{
                maxWidth: 180,
                maxHeight: 60,
                objectFit: "contain",
                margin: "32px auto 0",
                display: "block",
                filter: "brightness(0) invert(1)",
                opacity: 0.7,
              }}
            />
          )}
        </div>
      </section>

      {/* ── Featured Listings ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: "64px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#111",
              margin: "0 0 8px",
              textAlign: "center",
            }}
          >
            Featured Listings
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#666",
              margin: "0 0 40px",
              textAlign: "center",
            }}
          >
            Properties with professional photography
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {featured.map((listing) => (
              <div
                key={listing.id}
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fff",
                }}
              >
                {/* Listing photo — raw URL from Supabase, no transforms */}
                <div style={{ position: "relative", paddingBottom: "66%", overflow: "hidden" }}>
                  <img
                    src={listing.photos[0]}
                    alt={listing.address}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div style={{ padding: "16px 20px" }}>
                  {listing.price && (
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#111",
                        margin: "0 0 4px",
                      }}
                    >
                      {fmtPrice(listing.price)}
                    </p>
                  )}
                  <p style={{ fontSize: 15, color: "#555", margin: "0 0 4px", fontWeight: 600 }}>
                    {listing.address}
                  </p>
                  {(listing.city || listing.state) && (
                    <p style={{ fontSize: 14, color: "#888", margin: "0 0 8px" }}>
                      {[listing.city, listing.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {fmtDetails(listing) && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#999",
                        margin: 0,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {fmtDetails(listing)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {listings.length > featured.length && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link
                href={`/listings`}
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                View All Listings
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── About Preview ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 24px",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {profile.headshot_url && (
            <img
              src={profile.headshot_url}
              alt={profile.agent_name || "Agent"}
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>
              {profile.agent_name ? `About ${profile.agent_name}` : "About Your Agent"}
            </h2>
            {profile.company && (
              <p style={{ fontSize: 16, color: "#555", margin: "0 0 8px" }}>{profile.company}</p>
            )}
            {profile.phone && (
              <p style={{ fontSize: 15, color: "#777", margin: "0 0 4px" }}>{profile.phone}</p>
            )}
            {profile.email && (
              <p style={{ fontSize: 15, color: "#777", margin: "0 0 16px" }}>{profile.email}</p>
            )}
            <Link
              href={`/about`}
              style={{
                display: "inline-block",
                padding: "10px 24px",
                backgroundColor: primaryColor,
                color: "#fff",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact CTA ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 24px",
          backgroundColor: primaryColor,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
          Ready to Get Started?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", margin: "0 0 24px" }}>
          {profile.agent_name
            ? `Contact ${profile.agent_name} today`
            : "Get in touch today"}
        </p>
        {profile.phone && (
          <a
            href={`tel:${profile.phone.replace(/\D/g, "")}`}
            style={{
              display: "inline-block",
              padding: "14px 36px",
              backgroundColor: accentColor,
              color: "#fff",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 17,
              textDecoration: "none",
            }}
          >
            Call {profile.phone}
          </a>
        )}
        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            style={{
              display: "inline-block",
              padding: "14px 36px",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              marginLeft: 16,
            }}
          >
            Email Me
          </a>
        )}
      </section>
    </div>
  );
}
