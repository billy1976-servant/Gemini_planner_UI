/**
 * Best Image Selector
 * 
 * Selects the best quality image from available sources.
 * Rules:
 * - Prefer highest-res source
 * - Avoid blur placeholders
 * - Rewrite width params to target size
 * - Fall back to thumbnail only if nothing else exists
 */

export interface ImageSource {
  url?: string;
  src?: string;
  srcset?: string;
  sizes?: string;
  featuredImage?: string;
  images?: string[];
  thumbnail?: string;
  thumb?: string;
}

/**
 * Extract width parameter from URL and rewrite to target width
 */
function rewriteImageWidth(url: string, targetWidth: number = 900): string {
  try {
    const urlObj = new URL(url);
    
    // Remove existing width parameters
    urlObj.searchParams.delete('w');
    urlObj.searchParams.delete('width');
    urlObj.searchParams.delete('size');
    
    // Add target width
    urlObj.searchParams.set('width', String(targetWidth));
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Check if URL is a blur placeholder
 */
function isBlurPlaceholder(url: string): boolean {
  const blurIndicators = ['blur', 'lqip', 'placeholder', 'data:', 'base64'];
  const lowerUrl = url.toLowerCase();
  return blurIndicators.some(indicator => lowerUrl.includes(indicator));
}

/**
 * Extract width from URL filename patterns (e.g., _20x_crop_center, _580x)
 */
function extractWidthFromFilename(url: string): number | null {
  // Match patterns like _20x, _580x, _1500x
  const match = url.match(/_(\d+)x(?:_crop_center)?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Get image quality score (higher = better)
 */
function getImageQualityScore(url: string): number {
  // Prefer full-size images over cropped/thumbnail versions
  if (url.includes('_20x_crop_center') || url.includes('thumbnail')) {
    return 1;
  }
  
  // Check for explicit width in filename
  const width = extractWidthFromFilename(url);
  if (width) {
    return width;
  }
  
  // Default score for full-size images
  return 1000;
}

/**
 * Select best image from array of URLs
 */
function selectBestFromArray(urls: string[]): string | null {
  if (!urls || urls.length === 0) return null;
  
  // Filter out blur placeholders
  const validUrls = urls.filter(url => url && !isBlurPlaceholder(url));
  if (validUrls.length === 0) {
    // Fallback to first if all are placeholders
    return urls[0];
  }
  
  // Sort by quality score (highest first)
  const sorted = [...validUrls].sort((a, b) => {
    const scoreA = getImageQualityScore(a);
    const scoreB = getImageQualityScore(b);
    return scoreB - scoreA;
  });
  
  return sorted[0];
}

/**
 * Select the best image from various source formats
 * 
 * Priority order:
 * 1. srcset (parse and pick largest)
 * 2. explicit original/large/master URLs
 * 3. images[] array (pick highest quality)
 * 4. featuredImage
 * 5. url/src
 * 6. thumbnail (last resort)
 */
export function selectBestImage(source: ImageSource, targetWidth: number = 900): string | null {
  // 1. Check srcset (if present, parse and use largest)
  if (source.srcset) {
    // Simple srcset parser - find largest width
    const candidates = source.srcset.split(',').map(s => s.trim());
    const urls: string[] = [];
    for (const candidate of candidates) {
      const parts = candidate.split(/\s+/);
      if (parts[0] && !isBlurPlaceholder(parts[0])) {
        urls.push(parts[0]);
      }
    }
    if (urls.length > 0) {
      const best = selectBestFromArray(urls);
      if (best) {
        return rewriteImageWidth(best, targetWidth);
      }
    }
  }
  
  // 2. Check for explicit high-res fields
  const highResFields = [
    source.url,
    source.src,
    source.featuredImage,
  ].filter(Boolean) as string[];
  
  if (highResFields.length > 0) {
    const best = selectBestFromArray(highResFields);
    if (best) {
      return rewriteImageWidth(best, targetWidth);
    }
  }
  
  // 3. Check images array (prefer highest quality)
  if (source.images && Array.isArray(source.images) && source.images.length > 0) {
    const best = selectBestFromArray(source.images);
    if (best) {
      return rewriteImageWidth(best, targetWidth);
    }
  }
  
  // 4. Fallback to thumbnail only if nothing else exists
  if (source.thumbnail && !isBlurPlaceholder(source.thumbnail)) {
    return rewriteImageWidth(source.thumbnail, targetWidth);
  }
  
  if (source.thumb && !isBlurPlaceholder(source.thumb)) {
    return rewriteImageWidth(source.thumb, targetWidth);
  }
  
  return null;
}

/**
 * Select best image from a simple string URL or array
 */
export function selectBestImageSimple(
  source: string | string[] | null | undefined,
  targetWidth: number = 900
): string | null {
  if (!source) return null;
  
  if (typeof source === 'string') {
    if (isBlurPlaceholder(source)) return null;
    return rewriteImageWidth(source, targetWidth);
  }
  
  if (Array.isArray(source)) {
    const best = selectBestFromArray(source);
    if (best) {
      return rewriteImageWidth(best, targetWidth);
    }
  }
  
  return null;
}
