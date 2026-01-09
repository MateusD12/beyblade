import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a Beyblade image URL to use our proxy instead of direct Fandom CDN links.
 * This prevents 404 errors from anti-hotlinking protection.
 */
export function getBeybladeImageUrl(
  imageUrl: string | null | undefined,
  wikiUrl?: string | null,
  size: number = 400
): string | null {
  if (!imageUrl) return null;

  // If it's already our storage URL, use it directly
  if (imageUrl.includes('supabase.co/storage')) {
    return imageUrl;
  }

  // If it's a Fandom/Wikia URL, use our proxy
  if (imageUrl.includes('static.wikia.nocookie.net') || imageUrl.includes('fandom.com')) {
    let slug: string | null = null;
    
    // Try to extract slug from wiki URL first (most reliable)
    if (wikiUrl) {
      const match = wikiUrl.match(/\/wiki\/([^?#]+)/);
      if (match) {
        slug = match[1];
      }
    }
    
    // Fallback: extract from image URL path
    // Pattern: /images/X/XX/FileName.ext/revision/... or /images/X/XX/FileName.ext
    if (!slug) {
      // More robust regex that captures the filename without extension
      const imgMatch = imageUrl.match(/\/images\/[a-f0-9]\/[a-f0-9]{2}\/([^/.]+)\.[a-zA-Z]+/i);
      if (imgMatch) {
        slug = imgMatch[1];
      }
    }

    if (slug) {
      return `https://gcsnlxedyrlusleskjks.supabase.co/functions/v1/beyblade-image?slug=${encodeURIComponent(slug)}&size=${size}`;
    }
  }

  // Return original URL as fallback
  return imageUrl;
}
