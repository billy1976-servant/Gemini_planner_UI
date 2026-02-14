/**
 * Helpers for native capabilities (contacts, camera, filesystem).
 * Capacitor detection only. No UI.
 */

let isNative: boolean | null = null;

function getIsNative(): boolean {
  if (isNative !== null) return isNative;
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = require("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch {
    isNative = false;
  }
  return isNative;
}

/** Whether the app is running in a native (Capacitor) container (e.g. Android). */
export function isNativePlatform(): boolean {
  return getIsNative();
}

export function canUseContacts(): boolean {
  if (getIsNative()) return true;
  return !!(typeof navigator !== "undefined" && (navigator as { contacts?: { select?: unknown } }).contacts?.select);
}

export function canUseCamera(): boolean {
  return getIsNative();
}

export function canUseFilesystem(): boolean {
  return getIsNative();
}

/** Request camera/photo permissions. Capacitor only. Returns true if granted. */
export async function requestCameraPermission(): Promise<boolean> {
  if (!getIsNative()) return false;
  try {
    const { Camera } = await import("@capacitor/camera");
    const status = await Camera.requestPermissions();
    return status.camera === "granted" || status.photos === "granted";
  } catch {
    return false;
  }
}

/** Request contacts permission. Capacitor only. Returns true if granted. */
export async function requestContactsPermission(): Promise<boolean> {
  if (!getIsNative()) return false;
  try {
    const { Contacts } = await import("@capacitor-community/contacts");
    const r = await Contacts.requestPermissions();
    return r.contacts === "granted";
  } catch {
    return false;
  }
}
