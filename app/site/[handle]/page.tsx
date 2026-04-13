// app/site/[handle]/page.tsx
import { notFound } from "next/navigation";
import { getAgentSiteData } from "./data";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function AgentHomePage({ params }: Props) {
  const { handle } = await params;
  const data = await getAgentSiteData(handle);
  if (!data) return notFound();

  const { site, profile, listings, blogPosts } = data;
  const primary = site.primary_color || "#334155";
  const featured = listings.filter((l) => l.photos.length > 0).slice(0, 6);

  // Hero: CMS hero_photos first, then first listing photo
  const heroImage = site.hero_photos.length > 0
    ? site.hero_photos[0]
    : featured[0]?.photos[0] || null;

  const fmtPrice = (p: number | null) => p ? "$" + p.toLocaleString("en-US") : null;
  const fmtDetails = (l: (typeof listings)[0]) =>
    [l.bedrooms && l.bedrooms + " BD", l.bathrooms && l.bathrooms + " BA", l.sqft && l.sqft.toLocaleString() + " SF"]
      .filter(Boolean).join("  \u00b7  ");

  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: primary, overflow: "hidden" }}>
        {heroImage ? (
          <>
            <img src={heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)" }} />
          </>
        ) : null}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "80px 24px 60px", maxWidth: 720 }}>
          {profile.headshot_url ? (
            <img src={profile.headshot_url} alt={profile.agent_name || ""} style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(255,255,255,0.25)", display: "block", margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }} />
          ) : null}
          <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.1, textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
            {site.site_title || profile.agent_name || "Welcome"}
          </h1>
          {site.tagline ? <p style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: "rgba(255,255,255,0.85)", margin: "0 0 6px", fontStyle: "italic" }}>{site.tagline}</p> : null}
          {profile.company ? <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", margin: "0 0 4px", fontWeight: 600, letterSpacing: "0.03em" }}>{profile.company}</p> : null}
          {profile.phone ? <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", margin: "0 0 32px" }}>{profile.phone}</p> : null}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {featured.length > 0 ? <a href="/listings" style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#fff", color: primary, borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>View Listings</a> : null}
            <a href="/about" style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>About Me</a>
          </div>
          {profile.logo_url ? <img src={profile.logo_url} alt={profile.company || "Logo"} style={{ maxWidth: 180, maxHeight: 55, objectFit: "contain", margin: "36px auto 0", display: "block", opacity: 0.6 }} /> : null}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      {featured.length > 0 ? (
        <section style={{ padding: "72px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Featured Properties</h2>
            <p style={{ fontSize: 16, color: "#777", margin: 0 }}>Professional photography for every listing</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {featured.map((l) => (
              <div key={l.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ position: "relative", paddingBottom: "66%", overflow: "hidden" }}>
                  <img src={l.photos[0]} alt={l.address} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  {l.photos.length > 1 ? <div style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 10px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, fontSize: 12, color: "#fff", fontWeight: 600 }}>{l.photos.length} photos</div> : null}
                </div>
                <div style={{ padding: "16px 20px" }}>
                  {l.price ? <p style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{fmtPrice(l.price)}</p> : null}
                  <p style={{ fontSize: 15, color: "#444", margin: "0 0 4px", fontWeight: 600 }}>{l.address}</p>
                  {(l.city || l.state) ? <p style={{ fontSize: 14, color: "#888", margin: "0 0 8px" }}>{[l.city, l.state].filter(Boolean).join(", ")}</p> : null}
                  {fmtDetails(l) ? <p style={{ fontSize: 13, color: "#aaa", margin: 0, letterSpacing: "0.04em" }}>{fmtDetails(l)}</p> : null}
                </div>
              </div>
            ))}
          </div>
          {listings.length > featured.length ? (
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <a href="/listings" style={{ display: "inline-block", padding: "12px 28px", border: "2px solid " + primary, color: primary, borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>View All Listings</a>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ABOUT PREVIEW */}
      {(profile.agent_name || site.bio || site.about_content) ? (
        <section style={{ padding: "72px 24px", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            {profile.headshot_url ? <img src={profile.headshot_url} alt={profile.agent_name || ""} style={{ width: 200, height: 200, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} /> : null}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>{profile.agent_name ? "About " + profile.agent_name : "About"}</h2>
              {site.bio ? <p style={{ fontSize: 16, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>{site.bio}</p> : null}
              {site.about_content ? <p style={{ fontSize: 15, color: "#666", margin: "0 0 20px", lineHeight: 1.6 }}>{site.about_content}</p> : null}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <a href="/about" style={{ display: "inline-block", padding: "10px 24px", backgroundColor: primary, color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>Learn More</a>
                {profile.phone ? <a href={"tel:" + profile.phone.replace(/\D/g, "")} style={{ fontSize: 15, color: primary, fontWeight: 600, textDecoration: "none" }}>{profile.phone}</a> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {site.faq_items.length > 0 ? (
        <section style={{ padding: "72px 24px", maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 32px", textAlign: "center" }}>Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {site.faq_items.map((faq, i) => (
              <div key={i} style={{ padding: "20px 24px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>{faq.question}</p>
                <p style={{ fontSize: 15, color: "#555", margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* BLOG PREVIEW */}
      {site.blog_enabled && blogPosts.length > 0 ? (
        <section style={{ padding: "72px 24px", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 32px", textAlign: "center" }}>Latest Posts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {blogPosts.slice(0, 3).map((post) => (
                <a key={post.id} href={"/blog/" + post.slug} style={{ display: "block", padding: 24, backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", textDecoration: "none" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>{post.title}</p>
                  {post.excerpt ? <p style={{ fontSize: 14, color: "#666", margin: "0 0 12px", lineHeight: 1.5 }}>{post.excerpt.substring(0, 140)}{post.excerpt.length > 140 ? "\u2026" : ""}</p> : null}
                  {post.published_at ? <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>{new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p> : null}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CONTACT CTA */}
      <section style={{ padding: "72px 24px", backgroundColor: primary, textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>Ready to Get Started?</h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", margin: "0 0 28px" }}>{profile.agent_name ? "Contact " + profile.agent_name + " today" : "Get in touch today"}</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {profile.phone ? <a href={"tel:" + profile.phone.replace(/\D/g, "")} style={{ display: "inline-block", padding: "14px 36px", backgroundColor: "#fff", color: primary, borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>Call {profile.phone}</a> : null}
          {profile.email ? <a href={"mailto:" + profile.email} style={{ display: "inline-block", padding: "14px 36px", backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>Email Me</a> : null}
        </div>
      </section>
    </div>
  );
}
