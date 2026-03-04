/**
 * Derives card-level device from shell device and editor mode.
 * Shell device (Desktop/Tablet/Phone) controls only stage width / phone frame.
 * Editor mode forces card content to always render at phone width.
 */

export type ShellDevice = "desktop" | "tablet" | "phone";
export type CardDevice = "desktop" | "tablet" | "phone";

/**
 * Returns the effective device for card/content layout.
 * - When editorMode === "editor": cards are always phone-width (e.g. 3-up editor view).
 * - When editorMode === "preview": cards follow the shell (desktop/tablet/phone).
 */
export function getCardDevice(
  shellDevice: ShellDevice,
  editorMode: "editor" | "preview"
): CardDevice {
  return editorMode === "editor" ? "phone" : shellDevice;
}
