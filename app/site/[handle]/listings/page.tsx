// ============================================================
// FILE: app/site/[handle]/listings/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { getSite, getProfile, getListings } from "../data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return {};
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const title = `Listings | ${agent}`;
  const description = `Browse all properties listed by ${agent}${profile.company ? " at " + profile.company : ""}. Professional real estate photography and video for every listing.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(site.og_image_url && { images: [{ url: site.og_image_url }] }),
    },
  };
}

export default async function ListingsPage({ params }: Props) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return notFound();
  const [profile, listings] = await Promise.all([
    getProfile(site.user_id),
    getListings(site.user_id),
  ]);
  const primary = site.primary_color || "#334155";
  const fmtPrice = (p: number | null) => p ? "$" + p.toLocaleString("en-US") : null;
  const fmtDetails = (l: (typeof listings)[0]) =>
    [l.bedrooms && l.bedrooms + " BD", l.bathrooms && l.bathrooms + " BA", l.sqft && l.sqft.toLocaleString() + " SF"]
      .filter(Boolean).join("  \u00b7  ");

  return (
    <div style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>All Listings</h1>
        <p style={{ fontSize: 16, color: "#777", margin: 0 }}>{listings.length} {listings.length === 1 ? "property" : "properties"}</p>
      </div>

      {listings.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", fontSize: 16, padding: "60px 0" }}>No listings available right now. Check back soon.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {listings.map((l) => {
            const href = l.website_slug ? `/listings/${l.website_slug}` : null;
            const CardWrapper = href ? "a" : "div";
            const wrapperProps = href
              ? { href, style: { display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s, transform 0.2s" } as React.CSSProperties }
              : { style: { borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" } as React.CSSProperties };

            return (
              <CardWrapper key={l.id} {...wrapperProps}>
                {l.photos.length > 0 ? (
                  <div style={{ position: "relative", paddingBottom: "66%", overflow: "hidden" }}>
                    <img src={l.photos[0]} alt={l.address} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    {l.website_featured && (
                      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fbbf24", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        ★ Featured
                      </div>
                    )}
                    {l.photos.length > 1 ? <div style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 10px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, fontSize: 12, color: "#fff", fontWeight: 600 }}>{l.photos.length} photos</div> : null}
                  </div>
                ) : (
                  <div style={{ paddingBottom: "66%", backgroundColor: "#f1f5f9" }} />
                )}
                <div style={{ padding: "16px 20px" }}>
                  {l.price ? <p style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{fmtPrice(l.price)}</p> : null}
                  <p style={{ fontSize: 15, color: "#444", margin: "0 0 4px", fontWeight: 600 }}>{l.address}</p>
                  {(l.city || l.state) ? <p style={{ fontSize: 14, color: "#888", margin: "0 0 8px" }}>{[l.city, l.state].filter(Boolean).join(", ")}</p> : null}
                  {fmtDetails(l) ? <p style={{ fontSize: 13, color: "#aaa", margin: 0, letterSpacing: "0.04em" }}>{fmtDetails(l)}</p> : null}
                  {href ? (
                    <p style={{ fontSize: 13, color: primary, fontWeight: 600, margin: "12px 0 0", letterSpacing: "0.02em" }}>View Details →</p>
                  ) : null}
                </div>
              </CardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
