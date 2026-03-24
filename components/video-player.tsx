"use client";

// ── Type Guards ──
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com") || url.includes("cloudinary");
}

export function isDriveUrl(url: string): boolean {
  return url.includes("drive.google.com");
}

// ── Download URL Helper ──
export function getDownloadUrl(url: string): string {
  if (isCloudinaryUrl(url)) {
    // Cloudinary: insert fl_attachment after /upload/ for forced download
    return url.includes("/upload/")
      ? url.replace("/upload/", "/upload/fl_attachment/")
      : url;
  }
  // Drive and fallback: return as-is
  return url;
}

// ── Thumbnail Helper ──
export function getVideoThumbnail(
  url: string,
  width = 400,
  height = 225
): string | null {
  if (isCloudinaryUrl(url) && url.includes("/upload/")) {
    const transformed = url.replace(
      "/upload/",
      `/upload/so_0,w_${width},h_${height},c_fill/`
    );
    return transformed.replace(/\.(mp4|mov|webm)$/i, ".jpg");
  }
  return null;
}

// ── Clip URL Extractor ──
// Handles both old Drive format and new Cloudinary format from clip_urls JSON
export function getClipPlaybackUrl(clip: any): string | null {
  if (!clip) return null;
  // New Cloudinary format: { url: "https://res.cloudinary.com/..." }
  if (clip.url) return clip.url;
  // Old Drive format: { drive_url: "https://drive.google.com/..." }
  if (clip.drive_url) return clip.drive_url;
  // If it's just a string URL
  if (typeof clip === "string") return clip;
  return null;
}

// ── Drive File ID Extractor ──
function getFileIdFromUrl(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ── Video Player Component ──
interface VideoPlayerProps {
  url: string;
  className?: string;
  poster?: string | null;
}

export function VideoPlayer({ url, className = "", poster }: VideoPlayerProps) {
  if (!url) return null;

  // Cloudinary: native <video> element
  if (isCloudinaryUrl(url)) {
    return (
      <div className={`bg-black rounded-2xl overflow-hidden ${className}`}>
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
          className="w-full h-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Google Drive: iframe preview
  if (isDriveUrl(url)) {
    const fileId = getFileIdFromUrl(url);
    if (!fileId) return null;
    return (
      <div className={`bg-black rounded-2xl overflow-hidden ${className}`}>
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback: treat as direct video URL
  return (
    <div className={`bg-black rounded-2xl overflow-hidden ${className}`}>
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        className="w-full h-full"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
