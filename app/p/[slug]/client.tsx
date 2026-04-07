
    "use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bed, Bath, Maximize, MapPin,
  Phone, Mail, Building2, ChevronLeft, ChevronRight, X,
  Play, GripVertical, ExternalLink,
} from "lucide-react";
import  BookingCalendar  from "@/components/booking-calendar";
import  ShowingRequestForm  from "@/components/showing-request-form";

const TEMPLATES: Record<string, {
  bg: string; cardBg: string; text: string; textMuted: string; heading: string;
  accent: string; accentText: string; border: string; heroOverlay: string;
  font: string; heroFont: string;
}> = {
  modern_clean: {
    bg: "bg-white", cardBg: "bg-gray-50", text: "text-gray-900", textMuted: "text-gray-500",
    heading: "text-gray-900", accent: "bg-gray-900", accentText: "text-white",
    border: "border-gray-200", heroOverlay: "from-black/60 via-black/30 to-transparent",
    font: "font-sans", heroFont: "font-sans",
  },
  luxury_dark: {
    bg: "bg-gray-950", cardBg: "bg-gray-900", text: "text-gray-100", textMuted: "text-gray-400",
    heading: "text-amber-100", accent: "bg-amber-600", accentText: "text-white",
    border: "border-gray-800", heroOverlay: "from-black/70 via-black/40 to-transparent",
    font: "font-serif", heroFont: "font-serif",
  },
  classic_light: {
    bg: "bg-amber-50/30", cardBg: "bg-white", text: "text-blue-950", textMuted: "text-blue-900/60",
    heading: "text-blue-950", accent: "bg-blue-900", accentText: "text-white",
    border: "border-blue-900/10", heroOverlay: "from-blue-950/60 via-blue-950/30 to-transparent",
    font: "font-serif", heroFont: "font-serif",
  },
};

function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (isDragging.current) updatePosition(e.clientX);
    };
    const touchMove = (e: TouchEvent) => {
      if (isDragging.current) updatePosition(e.touches[0].clientX);
    };
    const end = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", end);
    };
  }, [updatePosition]);
  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] rounded-2xl overflow-hidden select-none cursor-ew-resize"
      onMouseDown={(e) => {
        e.preventDefault();
        isDragging.current = true;
        updatePosition(e.clientX);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        updatePosition(e.touches[0].clientX);
      }}
    >
      <img src={afterUrl} alt="After staging" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeUrl} alt="Before staging" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
        Before
      </div>
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
        After
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X className="h-7 w-7" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i - 1 + photos.length) % photos.length);
        }}
        className="absolute left-4 text-white/70 hover:text-white z-10"
      >
        <ChevronLeft className="h-10 w-10" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i + 1) % photos.length);
        }}
        className="absolute right-4 text-white/70 hover:text-white z-10"
      >
        <ChevronRight className="h-10 w-10" />
      </button>
      <img
        src={
          photos[idx]?.includes("/upload/")
            ? photos[idx].replace("/upload/", "/upload/w_1400,h_900,c_fit/")
            : photos[idx]
        }
        alt={`Photo ${idx + 1}`}
        className="max-h-[90vh] max-w-[95vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {idx + 1} / {photos.length}
      </p>
    </div>
  );
}

export default function PropertyWebsiteClient({
  property,
  agent,
  modules,
  curated,
  descriptions,
  stagings,
  designExports,
  template,
}: {
  property: any;
  agent: any;
  modules: Record<string, boolean>;
  curated: Record<string, string[]>;
  descriptions: any[];
  stagings: any[];
  designExports: any[];
  template: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeStagingIdx, setActiveStagingIdx] = useState(0);

  const t = TEMPLATES[template] || TEMPLATES.modern_clean;
  const photos = curated.photos || [];
  const videos = curated.videos || [];
  const heroPhoto = photos[0];
  const heroVideo = videos[0];
  const location = [property.city, property.state, property.zip].filter(Boolean).join(", ");
  const agentName = agent?.saved_agent_name || "";

  return (
    <div className={`min-h-screen ${t.bg} ${t.font}`}>
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] w-full overflow-hidden">
        {heroVideo ? (
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : heroPhoto ? (
          <img
            src={
              heroPhoto.includes("/upload/")
                ? heroPhoto.replace("/upload/", "/upload/w_1920,h_1080,c_fill,q_auto/")
                : heroPhoto
            }
            alt={property.address}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${t.heroOverlay}`} />

        {(agent?.saved_logo_url || agentName) && (
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {agent?.saved_logo_url && (
                <img
                  src={agent.saved_logo_url}
                  alt={agentName}
                  className="h-8 object-contain brightness-0 invert"
                />
              )}
              {!agent?.saved_logo_url && agentName && (
                <span className="text-white/90 text-sm font-semibold">{agentName}</span>
              )}
            </div>
            {agent?.saved_company && (
              <span className="text-white/60 text-xs">{agent.saved_company}</span>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 z-10">
          <div className="max-w-5xl mx-auto">
            {property.price && (
              <p className="text-white/90 text-2xl sm:text-4xl font-bold mb-2">
                ${property.price.toLocaleString()}
                {property.price_period && (
                  <span className="text-lg font-normal text-white/70">/{property.price_period}</span>
                )}
              </p>
            )}
            <h1 className={`text-white text-3xl sm:text-5xl font-extrabold leading-tight mb-3 ${t.heroFont}`}>
              {property.address}
            </h1>
            {location && (
              <p className="text-white/80 text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            )}
            <div className="flex items-center gap-6 mt-5">
              {property.bedrooms && (
                <div className="flex items-center gap-2 text-white/90">
                  <Bed className="h-5 w-5" />
                  <span className="text-lg font-semibold">{property.bedrooms}</span>
                  <span className="text-sm text-white/60">Beds</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2 text-white/90">
                  <Bath className="h-5 w-5" />
                  <span className="text-lg font-semibold">{property.bathrooms}</span>
                  <span className="text-sm text-white/60">Baths</span>
                </div>
              )}
              {property.sqft && (
                <div className="flex items-center gap-2 text-white/90">
                  <Maximize className="h-5 w-5" />
                  <span className="text-lg font-semibold">{property.sqft.toLocaleString()}</span>
                  <span className="text-sm text-white/60">Sqft</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {modules.description && descriptions.length > 0 && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>
              About This Property
            </h2>
            {descriptions.map((desc: any) => (
              <div key={desc.id} className="mb-6 last:mb-0">
                <p className={`text-base leading-relaxed ${t.text} whitespace-pre-wrap`}>
                  {desc.description}
                </p>
              </div>
            ))}
          </section>
        )}

        {modules.photos && photos.length > 0 && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((url: string, i: number) => {
                const thumb = url.includes("/upload/")
                  ? url.replace("/upload/", "/upload/w_600,h_450,c_fill,q_auto/")
                  : url;
                return (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`relative rounded-xl overflow-hidden group ${
                      i === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                  >
                    <div className="aspect-[4/3] bg-gray-200">
                      <img
                        src={thumb}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {modules.videos && videos.length > 0 && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>Video Tour</h2>
            {videos.map((url: string, i: number) => (
              <div key={i} className="rounded-2xl overflow-hidden mb-6 last:mb-0">
                <video
                  src={url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video bg-black"
                />
              </div>
            ))}
          </section>
        )}

        {modules.staging && stagings.length > 0 && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>
              Virtual Staging
            </h2>
            <BeforeAfterSlider
              beforeUrl={stagings[activeStagingIdx]?.original_url}
              afterUrl={stagings[activeStagingIdx]?.staged_url}
            />
            {stagings.length > 1 && (
              <div className="flex items-center gap-2 mt-4 justify-center">
                {stagings.map((s: any, i: number) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStagingIdx(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      i === activeStagingIdx
                        ? `${t.accent} ${t.accentText}`
                        : `${t.cardBg} ${t.textMuted} border ${t.border}`
                    }`}
                  >
                    {s.room_type
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase()) || `Room ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {modules.exports && designExports.length > 0 && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>
              Marketing Materials
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {designExports.map((exp: any) => {
                const dl = exp.export_url || exp.overlay_video_url;
                const isVideo =
                  exp.export_format === "mp4" || (dl && /\.(mp4|mov|webm)$/i.test(dl));
                let thumb: string | null = null;
                if (dl?.includes("cloudinary.com")) {
                  if (isVideo) {
                    thumb = dl
                      .replace("/video/upload/", "/video/upload/so_1,w_500,h_375,c_fill,f_jpg/")
                      .replace(/\.(mp4|mov|webm)$/i, ".jpg");
                  } else {
                    thumb = dl.includes("/upload/")
                      ? dl.replace("/upload/", "/upload/w_500,h_375,c_fill/")
                      : dl;
                  }
                }
                const labels: Record<string, string> = {
                  just_listed: "Just Listed",
                  open_house: "Open House",
                  price_reduced: "Price Reduced",
                  just_sold: "Just Sold",
                  yard_sign: "Yard Sign",
                  property_pdf: "Property PDF",
                  branding_card: "Branding Card",
                };
                return (
                  <a
                    key={exp.id}
                    href={dl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-xl overflow-hidden border ${t.border} group block`}
                  >
                    <div className="aspect-[4/3] bg-gray-200 relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={labels[exp.template_type] || "Marketing"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ExternalLink className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="h-5 w-5 text-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className={`text-sm font-semibold ${t.text}`}>
                        {labels[exp.template_type] || exp.template_type}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {modules.booking && property.booking_enabled && (
          <section className="py-16">
            <h2 className={`text-2xl font-extrabold ${t.heading} mb-2 ${t.heroFont}`}>
              Schedule a Showing
            </h2>
            <p className={`${t.textMuted} text-sm mb-6`}>Pick a time that works for you.</p>
            <div className={`${t.cardBg} rounded-2xl border ${t.border} p-6`}>
              <BookingCalendar propertyId={property.id} mode="book" agentName={agentName} />
            </div>
          </section>
        )}

        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className={`text-2xl font-extrabold ${t.heading} mb-2 ${t.heroFont}`}>
                Interested in This Property?
              </h2>
              <p className={`${t.textMuted} text-sm mb-6`}>
                Send a message and {agentName || "the agent"} will get back to you.
              </p>
              <div className={`${t.cardBg} rounded-2xl border ${t.border} p-6`}>
                <ShowingRequestForm
                  propertyId={property.id}
                  propertyInfo={{
                    address: property.address,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    price: property.price,
                    status: property.status,
                  }}
                  agentUserId={property.user_id}
                  agentName={agentName}
                  source="property_website"
                />
              </div>
            </div>
            <div>
              <div className={`${t.cardBg} rounded-2xl border ${t.border} p-6 sticky top-8`}>
                <div className="flex items-start gap-4 mb-5">
                  {agent?.saved_headshot_url ? (
                    <img
                      src={agent.saved_headshot_url}
                      alt={agentName}
                      className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`h-20 w-20 rounded-xl ${t.accent} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className={`text-2xl font-bold ${t.accentText}`}>
                        {agentName ? agentName.charAt(0).toUpperCase() : "A"}
                      </span>
                    </div>
                  )}
                  <div>
                    {agentName && (
                      <p className={`text-lg font-bold ${t.heading}`}>{agentName}</p>
                    )}
                    {agent?.saved_company && (
                      <p className={`text-sm ${t.textMuted}`}>{agent.saved_company}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {agent?.saved_phone && (
                    <a
                      href={`tel:${agent.saved_phone}`}
                      className={`flex items-center gap-3 text-sm ${t.text} hover:opacity-80`}
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      {agent.saved_phone}
                    </a>
                  )}
                  {agent?.saved_email && (
                    <a
                      href={`mailto:${agent.saved_email}`}
                      className={`flex items-center gap-3 text-sm ${t.text} hover:opacity-80`}
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      {agent.saved_email}
                    </a>
                  )}
                  {agent?.saved_company && (
                    <div className={`flex items-center gap-3 text-sm ${t.textMuted}`}>
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      {agent.saved_company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <h2 className={`text-2xl font-extrabold ${t.heading} mb-6 ${t.heroFont}`}>
            Property Details
          </h2>
          <div className={`${t.cardBg} rounded-2xl border ${t.border} p-6`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Bedrooms", value: property.bedrooms },
                { label: "Bathrooms", value: property.bathrooms },
                { label: "Square Feet", value: property.sqft?.toLocaleString() },
                { label: "Lot Size", value: property.lot_size },
                { label: "Year Built", value: property.year_built },
                {
                  label: "Property Type",
                  value: property.property_type
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                },
                {
                  label: "Status",
                  value:
                    property.status?.charAt(0).toUpperCase() +
                    property.status?.slice(1),
                },
                {
                  label: "Listing Type",
                  value:
                    property.listing_type?.charAt(0).toUpperCase() +
                    property.listing_type?.slice(1),
                },
              ]
                .filter((item) => item.value)
                .map((item, i) => (
                  <div key={i}>
                    <p
                      className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide mb-1`}
                    >
                      {item.label}
                    </p>
                    <p className={`text-base font-bold ${t.text}`}>{item.value}</p>
                  </div>
                ))}
            </div>
            {property.special_features && property.special_features.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p
                  className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide mb-3`}
                >
                  Features
                </p>
                <div className="flex flex-wrap gap-2">
                  {property.special_features.map((f: string, i: number) => (
                    <span
                      key={i}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border ${t.border} ${t.text}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className={`border-t ${t.border} py-10 mt-8`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {agentName && (
            <p className={`text-sm ${t.textMuted} mb-2`}>
              Listed by {agentName}
              {agent?.saved_company ? ` \u00B7 ${agent.saved_company}` : ""}
            </p>
          )}
          <p className={`text-xs ${t.textMuted} opacity-60`}>
            Powered by{" "}
            <a href="https://realestatephoto2video.com" className="hover:opacity-80 underline">
              P2V
            </a>
          </p>
        </div>
      </footer>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
