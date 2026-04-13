/**
 * Fixes Cloudinary URLs for reliable cross-domain delivery.
 * 
 * Problem: Some Cloudinary URLs with version stamps (v123456789) fail to load
 * on subdomains like p2v.homes even though they work on the main domain.
 * This can happen with signed URLs, expired versions, or delivery restrictions.
 *
 * Solution: Strip the version number and add f_auto,q_auto transformations.
 * This forces Cloudinary to re-resolve the asset and deliver it fresh.
 *
 * Usage:
 *   import { cloudinaryUrl } from '@/lib/cloudinary-url';
 *   <img src={cloudinaryUrl(agent.saved_headshot_url)} />
 *   <img src={cloudinaryUrl(agent.saved_headshot_url, 'w_400,h_400,c_fill')} />
 */

export function cloudinaryUrl(url: string | null | undefined, transforms?: string): string | null {
  if (!url) return null;

  // Only process Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;

  try {
    // Match: /upload/v{digits}/ or /upload/
    // Strip version number if present, add transforms
    const baseTransforms = 'f_auto,q_auto';
    const allTransforms = transforms 
      ? `${baseTransforms},${transforms}` 
      : baseTransforms;

    // Pattern: .../upload/v1234567890/path/to/file.ext
    // Replace with: .../upload/f_auto,q_auto/path/to/file.ext
    const withVersion = url.replace(
      /\/upload\/v\d+\//,
      `/upload/${allTransforms}/`
    );

    if (withVersion !== url) return withVersion;

    // Pattern: .../upload/path/to/file.ext (no version)
    // Replace with: .../upload/f_auto,q_auto/path/to/file.ext
    const withoutVersion = url.replace(
      /\/upload\//,
      `/upload/${allTransforms}/`
    );

    return withoutVersion;
  } catch {
    return url;
  }
}

/**
 * Get a Cloudinary thumbnail URL with specific dimensions.
 * Useful for listing cards where you want smaller images.
 */
export function cloudinaryThumb(url: string | null | undefined, width = 800, height = 600): string | null {
  return cloudinaryUrl(url, `w_${width},h_${height},c_fill`);
}

/**
 * Get a Cloudinary headshot URL optimized for circular display.
 */
export function cloudinaryHeadshot(url: string | null | undefined, size = 400): string | null {
  return cloudinaryUrl(url, `w_${size},h_${size},c_fill,g_face`);
}
