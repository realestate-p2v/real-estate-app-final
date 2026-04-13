// app/site/[handle]/page.tsx
// DIAGNOSTIC BUILD — inline everything, zero external imports except supabase + next
import { createClient } from "@supabase/supabase-js";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function AgentHomePage({ params }: Props) {
  const debug: string[] = [];

  try {
    const { handle } = await params;
    debug.push("handle: " + handle);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Step 1: Get site config
    const { data: sites, error: siteErr } = await supabase
      .from("agent_websites")
      .select("id, user_id, handle, site_title, primary_color, accent_color")
      .eq("handle", handle)
      .limit(1);

    if (siteErr) debug.push("site error: " + siteErr.message);
    if (!sites || sites.length === 0) {
      debug.push("no site found");
      return (
        <div style={{ padding: 40, fontFamily: "monospace", fontSize: 14 }}>
          <h1>Debug: No site found for handle</h1>
          {debug.map((d, i) => <p key={i}>{d}</p>)}
        </div>
      );
    }

    const site = sites[0];
    debug.push("site_title: " + site.site_title);
    debug.push("user_id: " + site.user_id);

    // Step 2: Get profile from lens_usage
    const { data: profiles, error: profileErr } = await supabase
      .from("lens_usage")
      .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company")
      .eq("user_id", site.user_id)
      .limit(1);

    if (profileErr) debug.push("profile error: " + profileErr.message);
    const profile = profiles?.[0] || null;
    debug.push("agent_name: " + (profile?.saved_agent_name || "null"));
    debug.push("headshot: " + (profile?.saved_headshot_url ? "YES" : "null"));
    debug.push("logo: " + (profile?.saved_logo_url ? "YES" : "null"));

    // Step 3: Get listings
    const { data: props, error: propsErr } = await supabase
      .from("agent_properties")
      .select("id, address, city, state, bedrooms, bathrooms, sqft, price, website_curated")
      .eq("user_id", site.user_id)
      .is("merged_into_id", null)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (propsErr) debug.push("props error: " + propsErr.message);
    debug.push("listings: " + (props?.length || 0));

    // Step 4: Get orders with photos
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("photos, property_address")
      .eq("user_id", site.user_id)
      .eq("payment_status", "paid");

    if (ordersErr) debug.push("orders error: " + ordersErr.message);
    debug.push("orders: " + (orders?.length || 0));

    // Photo enrichment helper (inline, same as Design Studio)
    function getPhotos(listing: any): string[] {
      let photos: string[] = [];
      const cur = listing.website_curated?.photos || [];
      if (cur.length) photos = cur.slice(0, 7);
      if (photos.length < 5 && orders) {
        const prefix = (listing.address || "").substring(0, 15).toLowerCase();
        if (prefix) {
          for (const o of orders) {
            if ((o.property_address || "").toLowerCase().includes(prefix)) {
              const urls = (o.photos || []).map((p: any) => p.secure_url || p.url).filter(Boolean);
              photos = [...photos, ...urls];
              if (photos.length >= 7) break;
            }
          }
        }
      }
      return [...new Set(photos)].slice(0, 7);
    }

    // Enrich listings
    const listings = (props || []).map((p: any) => ({ ...p, photos: getPhotos(p) }));
    const featured = listings.filter((l: any) => l.photos.length > 0).slice(0, 6);
    debug.push("featured with photos: " + featured.length);

    // ─── RENDER ────────────────────────────────────────────────────────
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>

        {/* Hero */}
        <section style={{
          position: "relative",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: site.primary_color || "#1a1a2e",
          overflow: "hidden",
        }}>
          {featured[0]?.photos[0] && (
            <>
              <img
                src={featured[0].photos[0]}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }} />
            </>
          )}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 24px" }}>
            {profile?.saved_headshot_url && (
              <img
                src={profile.saved_headshot_url}
                alt=""
                style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)", display: "block", margin: "0 auto 20px" }}
              />
            )}
            <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
              {site.site_title || profile?.saved_agent_name || "Welcome"}
            </h1>
            {profile?.saved_company && (
              <p style={{ fontSize: 20, color: "rgba(255,255,255,0.8)", margin: "0 0 4px" }}>{profile.saved_company}</p>
            )}
            {profile?.saved_phone && (
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", margin: 0 }}>{profile.saved_phone}</p>
            )}
            {profile?.saved_logo_url && (
              <img
                src={profile.saved_logo_url}
                alt=""
                style={{ maxWidth: 160, maxHeight: 50, objectFit: "contain", margin: "24px auto 0", display: "block", opacity: 0.7 }}
              />
            )}
          </div>
        </section>

        {/* Listings Grid */}
        {featured.length > 0 && (
          <section style={{ padding: "48px 24px", maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 32px", textAlign: "center" }}>Featured Listings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {featured.map((listing: any) => {
                const details = [
                  listing.bedrooms && listing.bedrooms + " BD",
                  listing.bathrooms && listing.bathrooms + " BA",
                  listing.sqft && listing.sqft.toLocaleString() + " SF",
                ].filter(Boolean).join("  \u00b7  ");
                return (
                  <div key={listing.id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff" }}>
                    <div style={{ position: "relative", paddingBottom: "66%" }}>
                      <img src={listing.photos[0]} alt={listing.address} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      {listing.price && <p style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{"$" + listing.price.toLocaleString()}</p>}
                      <p style={{ fontSize: 14, color: "#555", margin: "0 0 2px", fontWeight: 600 }}>{listing.address}</p>
                      {(listing.city || listing.state) && <p style={{ fontSize: 13, color: "#888", margin: "0 0 6px" }}>{[listing.city, listing.state].filter(Boolean).join(", ")}</p>}
                      {details && <p style={{ fontSize: 12, color: "#aaa", margin: 0, letterSpacing: "0.04em" }}>{details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Debug — remove after confirming assets load */}
        <details style={{ margin: "40px 24px", padding: 20, backgroundColor: "#111", borderRadius: 8, color: "#0f0", fontFamily: "monospace", fontSize: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#0f0" }}>Debug Output</summary>
          <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{debug.join("\n")}</pre>
        </details>

      </div>
    );

  } catch (err: any) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", fontSize: 14, color: "#ff4444", backgroundColor: "#1a1a1a", minHeight: "100vh" }}>
        <h1 style={{ color: "#ff4444" }}>CAUGHT ERROR</h1>
        <p>{err?.message || "Unknown"}</p>
        <pre style={{ color: "#ff8888", fontSize: 11 }}>{err?.stack || ""}</pre>
        <hr style={{ borderColor: "#333" }} />
        <pre style={{ color: "#0f0" }}>{debug.join("\n")}</pre>
      </div>
    );
  }
}
