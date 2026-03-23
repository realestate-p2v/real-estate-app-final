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

// ── Drive File ID Extractor ──

function getFileIdFromUrl(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ── Video Player Component ──

interface VideoPlayerProps {
  url: string;
  className?: string;
}

export function VideoPlayer({ url, className = "" }: VideoPlayerProps) {
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
        className="w-full h-full"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
