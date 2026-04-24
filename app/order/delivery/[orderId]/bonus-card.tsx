// app/order/delivery/[orderId]/bonus-card.tsx
//
// Client component for a single bonus card on the delivery page.
// Three buttons: Open (white), Download (green), Edit (indigo).

"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

type Props = {
  tag: string;
  title: string;
  description: string;
  mediaUrl: string | null;
  mediaType: "video" | "image" | "link";
  linkUrl?: string;
  editLabel: string;
  editUrl: string;
};

function withAttachmentFlag(url: string): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/upload/")) return url;
  if (url.includes("fl_attachment")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export default function BonusCard({
  tag,
  title,
  description,
  mediaUrl,
  mediaType,
  linkUrl,
  editLabel,
  editUrl,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  const isInteractive = mediaType === "video" || mediaType === "image";
  const downloadUrl =
    mediaUrl && mediaType !== "link" ? withAttachmentFlag(mediaUrl) : null;

  const handlePreviewClick = () => {
    if (isInteractive) {
      setLightboxOpen(true);
    } else if (linkUrl) {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openBtnClass =
    "flex-1 min-w-[88px] inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm px-4 py-2.5 rounded-full transition-colors";
  const downloadBtnClass =
    "inline-flex items-center justify-center bg-emerald-500/15 hover:bg-emerald-500/25 ring-1 ring-emerald-400/30 text-emerald-300 font-bold text-sm px-4 py-2.5 rounded-full transition-colors";
  const editBtnClass =
    "flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 ring-1 ring-indigo-400/30 text-indigo-200 font-bold text-sm px-4 py-2.5 rounded-full transition-colors";
  const lightboxDownloadClass =
    "inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-5 py-3 rounded-full transition-colors shadow-lg";

  return (
    <>
      <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] overflow-hidden flex flex-col">
        <button
          type="button"
          onClick={handlePreviewClick}
          className="aspect-video bg-black flex items-center justify-center overflow-hidden group relative w-full"
          aria-label={`Open ${title}`}
        >
          {mediaType === "video" && mediaUrl ? (
            <>
              <video
                src={mediaUrl}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  <span className="text-gray-900 text-xl ml-1">▶</span>
                </div>
              </div>
            </>
          ) : mediaType === "image" && mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : mediaType === "link" && mediaUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/45 transition-colors">
                <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-gray-900"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="text-white/20 text-5xl">🔗</div>
          )}
        </button>

        <div className="p-5 flex flex-col flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-300 mb-2">
            {tag}
          </p>
          <h3 className="text-base font-extrabold text-white mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4 flex-1">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {isInteractive ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className={openBtnClass}
              >
                Open →
              </button>
            ) : (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={openBtnClass}
              >
                View page →
              </a>
            )}
            {downloadUrl ? (
              <a
                href={downloadUrl}
                className={downloadBtnClass}
                title="Download"
                aria-label="Download"
              >
                <Download className="h-4 w-4" strokeWidth={2.5} />
              </a>
            ) : null}
            <a href={editUrl} className={editBtnClass}>
              {editLabel} →
            </a>
          </div>
        </div>
      </div>

      {lightboxOpen && mediaUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6 sm:py-10"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition-colors z-10"
            aria-label="Close"
          >
            ×
          </button>

          <div
            className="relative max-w-6xl w-full max-h-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaType === "video" ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-w-full max-h-[80vh] rounded-lg bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}

            {downloadUrl ? (
              <a href={downloadUrl} className={lightboxDownloadClass}>
                <Download className="h-4 w-4" strokeWidth={2.5} />
                Download
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
