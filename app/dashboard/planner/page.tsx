import { useState, useEffect, useRef } from "react";

// Mock data for prototype — in production these come from your Supabase queries
const MOCK_PROPERTIES = [
  { id: "1", address: "142 Maple Drive", city: "Westfield", state: "NJ", status: "active", price: 725000, bedrooms: 4, bathrooms: 3, sqft: 2800 },
  { id: "2", address: "88 Ocean Blvd", city: "Long Branch", state: "NJ", status: "active", price: 1250000, bedrooms: 5, bathrooms: 4, sqft: 3600 },
  { id: "3", address: "310 Park Ave", city: "Scotch Plains", state: "NJ", status: "coming_soon", price: 549000, bedrooms: 3, bathrooms: 2, sqft: 1950 },
];

const MOCK_MEDIA = {
  "1": [
    { id: "m1", type: "photo", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop", label: "Front Exterior" },
    { id: "m2", type: "photo", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop", label: "Living Room" },
    { id: "m3", type: "photo", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop", label: "Kitchen" },
    { id: "m4", type: "photo", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop", label: "Master Bedroom" },
    { id: "m5", type: "flyer", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop", label: "Just Listed Flyer" },
    { id: "m6", type: "video", url: "https://example.com/tour.mp4", label: "Listing Video", thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop" },
    { id: "m7", type: "staging", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop", label: "Virtual Staging — Living Room" },
  ],
  "2": [
    { id: "m8", type: "photo", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop", label: "Ocean View Front" },
    { id: "m9", type: "photo", url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop", label: "Pool & Deck" },
    { id: "m10", type: "photo", url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=400&h=300&fit=crop", label: "Open Floor Plan" },
    { id: "m11", type: "flyer", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop", label: "Open House Flyer" },
  ],
  "3": [
    { id: "m12", type: "photo", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop", label: "Charming Front" },
    { id: "m13", type: "photo", url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&h=300&fit=crop", label: "Backyard" },
  ],
};

const PLATFORMS = [
  { key: "facebook", label: "Facebook", icon: "f", color: "#1877F2" },
  { key: "instagram", label: "Instagram", icon: "📷", color: "#E4405F" },
  { key: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2" },
];

const MEDIA_FILTERS = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Videos" },
  { key: "flyer", label: "Graphics" },
  { key: "staging", label: "Staging" },
];

function formatPrice(n) {
  return "$" + n.toLocaleString();
}

function StatusBadge({ status }) {
  const styles = {
    active: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", text: "Active" },
    coming_soon: { bg: "rgba(234,179,8,0.15)", color: "#eab308", text: "Coming Soon" },
    sold: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", text: "Sold" },
    price_reduced: { bg: "rgba(168,85,247,0.15)", color: "#a855f7", text: "Price Reduced" },
  };
  const s = styles[status] || styles.active;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
      {s.text}
    </span>
  );
}

export default function MarketingPlannerV3() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [step, setStep] = useState(1); // 1=pick property, 2=pick media, 3=post ready
  const captionRef = useRef(null);

  const properties = MOCK_PROPERTIES;
  const media = selectedProperty ? (MOCK_MEDIA[selectedProperty.id] || []) : [];
  const filteredMedia = mediaFilter === "all" ? media : media.filter(m => m.type === mediaFilter);

  // Count media by type for filter badges
  const mediaCounts = {};
  MEDIA_FILTERS.forEach(f => {
    mediaCounts[f.key] = f.key === "all" ? media.length : media.filter(m => m.type === f.key).length;
  });

  function handleSelectProperty(p) {
    setSelectedProperty(p);
    setSelectedMedia(null);
    setGeneratedCaption("");
    setMediaFilter("all");
    setStep(2);
  }

  function handleSelectMedia(m) {
    setSelectedMedia(m);
    setGeneratedCaption("");
    setStep(2);
  }

  function handleGenerateCaption() {
    setIsGenerating(true);
    // Simulate AI generation — in production this calls /api/planner/caption
    setTimeout(() => {
      const captions = [
        `✨ Just listed! This stunning ${selectedProperty.bedrooms}-bed, ${selectedProperty.bathrooms}-bath home at ${selectedProperty.address} is everything you've been looking for.\n\n🏡 ${selectedProperty.sqft.toLocaleString()} sq ft of beautifully designed living space in the heart of ${selectedProperty.city}.\n\n💰 Offered at ${formatPrice(selectedProperty.price)}\n\nDM me for a private showing! 🔑\n\n#JustListed #RealEstate #${selectedProperty.city.replace(/\s/g, "")}Homes #DreamHome`,
        `🏠 NEW on the market in ${selectedProperty.city}!\n\n${selectedProperty.address} — ${selectedProperty.bedrooms} BR / ${selectedProperty.bathrooms} BA / ${selectedProperty.sqft.toLocaleString()} SF\n\nThis home checks every box. Don't wait — schedule your tour today.\n\n${formatPrice(selectedProperty.price)} | Link in bio\n\n#NewListing #HomesForSale #${selectedProperty.state}RealEstate`,
        `Welcome home to ${selectedProperty.address} 🏡\n\n${selectedProperty.bedrooms} bedrooms · ${selectedProperty.bathrooms} bathrooms · ${selectedProperty.sqft.toLocaleString()} sq ft\n\nLocated in beautiful ${selectedProperty.city}, ${selectedProperty.state}, this property won't last long at ${formatPrice(selectedProperty.price)}.\n\nReady to see it in person? Let's connect! 📲\n\n#OpenHouse #${selectedProperty.city.replace(/\s/g, "")} #RealEstateAgent #HomeGoals`,
      ];
      setGeneratedCaption(captions[Math.floor(Math.random() * captions.length)]);
      setIsGenerating(false);
      setStep(3);
    }, 1500);
  }

  function handleCopy(platform) {
    const text = generatedCaption;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleBack() {
    if (step === 3) {
      setGeneratedCaption("");
      setStep(2);
    } else if (step === 2) {
      setSelectedProperty(null);
      setSelectedMedia(null);
      setGeneratedCaption("");
      setMediaFilter("all");
      setStep(1);
    }
  }

  function handleStartOver() {
    setSelectedProperty(null);
    setSelectedMedia(null);
    setGeneratedCaption("");
    setMediaFilter("all");
    setStep(1);
  }

  // ── Styles ──
  const root = {
    fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
    background: "transparent",
    minHeight: "100vh",
    color: "#e2e8f0",
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 16px",
  };

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  };

  const heading = {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
    letterSpacing: "-0.02em",
  };

  const subtext = {
    fontSize: 13,
    color: "#94a3b8",
    margin: "4px 0 0",
  };

  const stepIndicator = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 20,
  };

  const stepDot = (active, done) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    background: done ? "#22c55e" : active ? "#3b82f6" : "rgba(255,255,255,0.06)",
    color: done || active ? "#fff" : "#64748b",
    border: active ? "2px solid #60a5fa" : "2px solid transparent",
    transition: "all 0.3s",
  });

  const stepLine = (done) => ({
    width: 32,
    height: 2,
    background: done ? "#22c55e" : "rgba(255,255,255,0.08)",
    borderRadius: 1,
    transition: "all 0.3s",
  });

  const propertyCard = (isSelected) => ({
    background: isSelected ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
    border: isSelected ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 16,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const mediaCard = (isSelected) => ({
    borderRadius: 10,
    overflow: "hidden",
    cursor: "pointer",
    border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
    background: "rgba(255,255,255,0.03)",
    transition: "all 0.2s",
    position: "relative",
  });

  const pillBtn = (active) => ({
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    background: active ? "#3b82f6" : "rgba(255,255,255,0.06)",
    color: active ? "#fff" : "#94a3b8",
    transition: "all 0.2s",
  });

  const primaryBtn = (disabled) => ({
    padding: "14px 28px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
    width: "100%",
    letterSpacing: "-0.01em",
  });

  const shareBtn = (color) => ({
    flex: 1,
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    background: color,
    color: "#fff",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  });

  const backBtn = {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 0",
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  };

  return (
    <div style={root}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={heading}>Marketing Planner</h1>
            <p style={subtext}>Select a property → pick media → generate & share</p>
          </div>
          {step > 1 && (
            <button onClick={handleStartOver} style={{ ...pillBtn(false), fontSize: 11 }}>
              ↺ Start Over
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div style={stepIndicator}>
        <div style={stepDot(step === 1, step > 1)}>{step > 1 ? "✓" : "1"}</div>
        <div style={stepLine(step > 1)} />
        <div style={stepDot(step === 2, step > 2)}>{step > 2 ? "✓" : "2"}</div>
        <div style={stepLine(step > 2)} />
        <div style={stepDot(step === 3, false)}>3</div>
        <div style={{ fontSize: 12, color: "#64748b", marginLeft: 12 }}>
          {step === 1 ? "Choose property" : step === 2 ? "Select media & generate" : "Share your post"}
        </div>
      </div>

      {/* ── STEP 1: Property Selection ── */}
      {step === 1 && (
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 12px" }}>
            Your Active Properties
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {properties.map(p => (
              <div
                key={p.id}
                style={propertyCard(false)}
                onClick={() => handleSelectProperty(p)}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{p.address}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {p.city}, {p.state} · {p.bedrooms}bd / {p.bathrooms}ba · {p.sqft.toLocaleString()} sf
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={p.status} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{formatPrice(p.price)}</span>
                  <span style={{ color: "#475569", fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Media + Generate ── */}
      {step >= 2 && selectedProperty && (
        <>
          {/* Selected property summary */}
          <div style={{ ...card, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleBack} style={{ ...backBtn, marginBottom: 0, fontSize: 18, padding: 0 }}>←</button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{selectedProperty.address}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {selectedProperty.city}, {selectedProperty.state} · {formatPrice(selectedProperty.price)}
                </div>
              </div>
            </div>
            <StatusBadge status={selectedProperty.status} />
          </div>

          {/* Media filters */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {MEDIA_FILTERS.map(f => (
              mediaCounts[f.key] > 0 || f.key === "all" ? (
                <button
                  key={f.key}
                  style={pillBtn(mediaFilter === f.key)}
                  onClick={() => setMediaFilter(f.key)}
                >
                  {f.label} {mediaCounts[f.key] > 0 && <span style={{ opacity: 0.6, marginLeft: 2 }}>({mediaCounts[f.key]})</span>}
                </button>
              ) : null
            ))}
          </div>

          {/* Media grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
            {filteredMedia.map(m => (
              <div
                key={m.id}
                style={mediaCard(selectedMedia?.id === m.id)}
                onClick={() => handleSelectMedia(m)}
              >
                <img
                  src={m.thumbnail || m.url}
                  alt={m.label}
                  style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginTop: 2 }}>{m.type}</div>
                </div>
                {selectedMedia?.id === m.id && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>✓</div>
                )}
                {m.type === "video" && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -70%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>▶</div>
                )}
              </div>
            ))}
          </div>

          {/* Generate button */}
          {step === 2 && (
            <button
              style={primaryBtn(!selectedMedia || isGenerating)}
              disabled={!selectedMedia || isGenerating}
              onClick={handleGenerateCaption}
            >
              {isGenerating ? (
                <span>✨ Generating your post...</span>
              ) : selectedMedia ? (
                <span>✨ Generate Post for "{selectedMedia.label}"</span>
              ) : (
                <span>Select media above to generate a post</span>
              )}
            </button>
          )}
        </>
      )}

      {/* ── STEP 3: Caption + Share ── */}
      {step === 3 && generatedCaption && (
        <div style={{ ...card, marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Your Post</h2>
            <button
              onClick={handleGenerateCaption}
              style={{ ...pillBtn(false), display: "flex", alignItems: "center", gap: 4 }}
            >
              ↻ Regenerate
            </button>
          </div>

          {/* Preview */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            {selectedMedia && (
              <img
                src={selectedMedia.thumbnail || selectedMedia.url}
                alt=""
                style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
              />
            )}
            <textarea
              ref={captionRef}
              value={generatedCaption}
              onChange={e => setGeneratedCaption(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 12,
                color: "#e2e8f0",
                fontSize: 13,
                lineHeight: 1.6,
                resize: "vertical",
                minHeight: 120,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                style={shareBtn(copied === p.key ? "#22c55e" : p.color)}
                onClick={() => handleCopy(p.key)}
              >
                {p.key === "facebook" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
                {p.key === "instagram" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                )}
                {p.key === "linkedin" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                )}
                {copied === p.key ? "Copied!" : `Share to ${p.label}`}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#475569", marginTop: 10, textAlign: "center" }}>
            Caption is copied to clipboard — paste it when sharing on the platform
          </p>

          {/* New post button */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => { setSelectedMedia(null); setGeneratedCaption(""); setStep(2); }}
              style={{ ...pillBtn(false), width: "100%", padding: "10px", fontSize: 13 }}
            >
              Create another post for {selectedProperty.address}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {step === 1 && properties.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>No active properties</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Add a property to start creating marketing content</p>
        </div>
      )}
    </div>
  );
}
