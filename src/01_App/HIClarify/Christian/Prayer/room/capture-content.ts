/**
 * Capture a video or image element to a data URL (PNG) for "Save page" snapshots.
 * Uses getBoundingClientRect() when videoWidth/videoHeight or naturalWidth/naturalHeight are 0.
 */
export function captureElementToDataURL(
  element: HTMLVideoElement | HTMLImageElement
): string | null {
  try {
    const rect = element.getBoundingClientRect();
    const fallbackW = Math.max(0, Math.floor(rect.width));
    const fallbackH = Math.max(0, Math.floor(rect.height));

    let width: number;
    let height: number;

    if (element instanceof HTMLVideoElement) {
      width = element.videoWidth > 0 ? element.videoWidth : fallbackW;
      height = element.videoHeight > 0 ? element.videoHeight : fallbackH;
    } else {
      width = element.naturalWidth > 0 ? element.naturalWidth : fallbackW;
      height = element.naturalHeight > 0 ? element.naturalHeight : fallbackH;
    }

    if (width === 0 || height === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(element, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Find the first video or img inside a container (for snapshot source).
 */
export function findCaptureSource(container: HTMLElement | null): HTMLVideoElement | HTMLImageElement | null {
  if (!container) return null;
  try {
    const video = container.querySelector("video");
    if (video) return video;
    const img = container.querySelector("img");
    return img ?? null;
  } catch {
    return null;
  }
}
