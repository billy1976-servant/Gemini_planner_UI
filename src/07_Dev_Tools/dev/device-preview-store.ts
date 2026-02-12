/**
 * Device Preview Store — Presentation-only state
 * 
 * STRICT RULES:
 * - NOT stored in JSON
 * - NOT stored in schema
 * - NOT added to screens
 * - Purely a preview tool
 */

type DeviceMode = "desktop" | "tablet" | "phone";

let currentMode: DeviceMode = "desktop";
const listeners = new Set<() => void>();

export function getDevicePreviewMode(): DeviceMode {
  return currentMode;
}

export function setDevicePreviewMode(mode: DeviceMode): void {
  currentMode = mode;
  listeners.forEach(fn => fn());
}

export function subscribeDevicePreviewMode(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
