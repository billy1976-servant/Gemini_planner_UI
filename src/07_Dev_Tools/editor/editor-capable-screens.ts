/**
 * Registry for screens that support Editor vs Preview mode.
 * On /dev, every screen is editor-capable so the toggle applies to every view.
 */

/**
 * Returns true if the current context supports editor mode (Editor / Preview toggle).
 * Rule: when on /dev path, every screen is editor-capable.
 */
export function isEditorCapable(_screenPath: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/dev");
}
