// app/site/[handle]/listings/page.tsx
import { notFound } from "next/navigation";
import { getSite, getProfile, getListings } from "../data";

interface Props {
  params: Promise<{ handle: string }>;
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
          {listings.map((l) => (
            <div key={l.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {l.photos.length > 0 ? (
                <div style={{ position: "relative", paddingBottom: "66%", overflow: "hidden" }}>
                  <img src={l.photos[0]} alt={l.address} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
