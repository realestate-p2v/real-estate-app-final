// ============================================================
// FILE: app/site/[handle]/listings/[slug]/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { getSite, getProfile, getListing } from "../../data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site) return {};
  const listing = await getListing(site.user_id, slug);
  if (!listing) return {};
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const details = [
    listing.bedrooms && listing.bedrooms + " Bed",
    listing.bathrooms && listing.bathrooms + " Bath",
    listing.sqft && listing.sqft.toLocaleString() + " SF",
  ].filter(Boolean).join(" · ");
  const title = `${listing.address}${location ? ", " + location : ""} | ${agent}`;
  const description = [
    listing.price ? "$" + listing.price.toLocaleString("en-US") : null,
    details,
    listing.property_type,
    agent ? "Listed by " + agent : null,
  ].filter(Boolean).join(" — ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.photos.length > 0 ? [{ url: listing.photos[0], width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site) return notFound();
  const [listing, profile] = await Promise.all([
    getListing(site.user_id, slug),
    getProfile(site.user_id),
  ]);
  if (!listing) return notFound();

  const primary = site.primary_color || "#334155";
  const agent = profile.agent_name || site.site_title || "Agent";
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const fmtPrice = listing.price ? "$" + listing.price.toLocaleString("en-US") : null;

  // Detail items for the grid
  const detailItems: { label: string; value: string }[] = [];
  if (listing.bedrooms) detailItems.push({ label: "Bedrooms", value: String(listing.bedrooms) });
  if (listing.bathrooms) detailItems.push({ label: "Bathrooms", value: String(listing.bathrooms) });
  if (listing.sqft) detailItems.push({ label: "Sq Ft", value: listing.sqft.toLocaleString() });
  if (listing.lot_size) detailItems.push({ label: "Lot Size", value: listing.lot_size });
  if (listing.year_built) detailItems.push({ label: "Year Built", value: String(listing.year_built) });
  if (listing.property_type) detailItems.push({ label: "Type", value: listing.property_type });
  if (listing.listing_type) detailItems.push({ label: "Listing Type", value: listing.listing_type });
  if (listing.status && listing.status !== "active") detailItems.push({ label: "Status", value: listing.status.charAt(0).toUpperCase() + listing.status.slice(1) });

  // Split photos: hero (first), gallery (rest)
  const heroPhoto = listing.photos[0] || null;
  const galleryPhotos = listing.photos.slice(1);

  // Check if video is a Google Drive link
  const isGoogleDrive = listing.video_url?.includes("drive.google.com") || false;
  const driveEmbedUrl = isGoogleDrive && listing.video_url
    ? listing.video_url.replace("/view", "/preview").replace("?usp=sharing", "")
    : null;

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", backgroundColor: "#111" }}>
        {listing.video_url && !isGoogleDrive ? (
          <div style={{ position: "relative", maxHeight: "70vh", overflow: "hidden" }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", maxHeight: "70vh", objectFit: "cover", display: "block" }}
            >
              <source src={listing.video_url} />
            </video>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
          </div>
        ) : heroPhoto ? (
          <div style={{ position: "relative", maxHeight: "70vh", overflow: "hidden" }}>
            <img
              src={heroPhoto}
              alt={listing.address}
              style={{ width: "100%", maxHeight: "70vh", objectFit: "cover", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
          </div>
        ) : (
          <div style={{ height: 300, backgroundColor: primary }} />
        )}

        {/* Hero overlay content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 32px 32px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {fmtPrice ? (
              <p style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {fmtPrice}
              </p>
            ) : null}
            <h1 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, color: "#fff", margin: "0 0 4px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              {listing.address}
            </h1>
            {location ? (
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                {location}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── QUICK STATS BAR ──────────────────────────────────────── */}
      {(listing.bedrooms || listing.bathrooms || listing.sqft) ? (
        <section style={{ backgroundColor: primary, padding: "16px 32px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {listing.bedrooms ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{listing.bedrooms}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Bedrooms</p>
              </div>
            ) : null}
            {listing.bathrooms ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{listing.bathrooms}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Bathrooms</p>
              </div>
            ) : null}
            {listing.sqft ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{listing.sqft.toLocaleString()}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sq Ft</p>
              </div>
            ) : null}
            {listing.year_built ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>{listing.year_built}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Year Built</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── PROPERTY DETAILS GRID ────────────────────────────────── */}
      {detailItems.length > 0 ? (
        <section style={{ padding: "48px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 24px" }}>Property Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {detailItems.map((item) => (
              <div key={item.label} style={{ padding: "16px 20px", backgroundColor: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{item.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── SPECIAL FEATURES ─────────────────────────────────────── */}
      {listing.special_features && listing.special_features.length > 0 ? (
        <section style={{ padding: "0 32px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>Features &amp; Highlights</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {listing.special_features.map((f, i) => (
              <span key={i} style={{ display: "inline-block", padding: "8px 16px", backgroundColor: "#f0f4ff", color: primary, borderRadius: 20, fontSize: 14, fontWeight: 500 }}>
                {f}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── AMENITIES ────────────────────────────────────────────── */}
      {listing.amenities && listing.amenities.length > 0 ? (
        <section style={{ padding: "0 32px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>Amenities</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {listing.amenities.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: primary, flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: "#444" }}>{a}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── VIDEO TOUR (Google Drive embed) ──────────────────────── */}
      {driveEmbedUrl ? (
        <section style={{ padding: "0 32px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>Video Tour</h2>
          <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }}>
            <iframe
              src={driveEmbedUrl}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {/* ── PHOTO GALLERY ────────────────────────────────────────── */}
      {galleryPhotos.length > 0 ? (
        <section style={{ padding: "0 32px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>
            Photos ({listing.photos.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {galleryPhotos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", position: "relative", paddingBottom: "66%", borderRadius: 10, overflow: "hidden", backgroundColor: "#f1f5f9" }}
              >
                <img
                  src={url}
                  alt={`${listing.address} photo ${i + 2}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── QR CODE ──────────────────────────────────────────────── */}
      {listing.qr_code_url ? (
        <section style={{ padding: "0 32px 48px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>Share This Listing</h2>
          <img
            src={listing.qr_code_url}
            alt="QR Code"
            style={{ width: 160, height: 160, margin: "0 auto", display: "block" }}
          />
        </section>
      ) : null}

      {/* ── CONTACT CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "56px 32px", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
            Interested in this property?
          </h2>
          <p style={{ fontSize: 16, color: "#666", margin: "0 0 28px" }}>
            Contact {agent} for more information or to schedule a showing.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {profile.phone ? (
              <a
                href={"tel:" + profile.phone.replace(/\D/g, "")}
                style={{ display: "inline-block", padding: "14px 32px", backgroundColor: primary, color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}
              >
                Call {profile.phone}
              </a>
            ) : null}
            {profile.email ? (
              <a
                href={`mailto:${profile.email}?subject=${encodeURIComponent("Inquiry: " + listing.address)}`}
                style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#fff", color: primary, borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none", border: "2px solid " + primary }}
              >
                Email Agent
              </a>
            ) : null}
            <a
              href="/contact"
              style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#fff", color: "#555", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid #ddd" }}
            >
              Contact Form
            </a>
          </div>

          {/* Agent card */}
          {(profile.headshot_url || profile.agent_name) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginTop: 32, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", maxWidth: 400, margin: "32px auto 0" }}>
              {profile.headshot_url ? (
                <img src={profile.headshot_url} alt={agent} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : null}
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>{agent}</p>
                {profile.company ? <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{profile.company}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── BACK TO LISTINGS ─────────────────────────────────────── */}
      <section style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        <a
          href="/listings"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: primary, fontWeight: 600, textDecoration: "none" }}
        >
          &larr; Back to All Listings
        </a>
      </section>

      {/* ── JSON-LD STRUCTURED DATA ──────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: listing.address,
            url: `https://${handle}.p2v.homes/listings/${slug}`,
            ...(fmtPrice && {
              offers: {
                "@type": "Offer",
                price: listing.price,
                priceCurrency: "USD",
              },
            }),
            ...(heroPhoto && { image: heroPhoto }),
            address: {
              "@type": "PostalAddress",
              streetAddress: listing.address,
              ...(listing.city && { addressLocality: listing.city }),
              ...(listing.state && { addressRegion: listing.state }),
            },
            ...(listing.sqft && { floorSize: { "@type": "QuantitativeValue", value: listing.sqft, unitCode: "FTK" } }),
            ...(listing.bedrooms && { numberOfBedrooms: listing.bedrooms }),
            ...(listing.bathrooms && { numberOfBathroomsTotal: listing.bathrooms }),
            ...(listing.year_built && { yearBuilt: listing.year_built }),
          }),
        }}
      />
    </div>
  );
}
