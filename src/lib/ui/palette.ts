/**
 * Prayer platform palette system.
 * Components reference these tokens via ThemeProvider context instead of hard-coded colors.
 */

export interface PrayerPalette {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  /** Optional: record/stop actions */
  danger?: string;
  /** Optional: success state */
  success?: string;
  /** Optional: waveform and play button */
  playBg?: string;
  playBgHover?: string;
  wave?: string;
  waveActive?: string;
}

const dark: PrayerPalette = {
  background: "#0c0a14",
  surface: "rgba(24, 22, 36, 0.72)",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  accent: "#a78bfa",
  border: "rgba(148, 163, 184, 0.08)",
  danger: "#ef4444",
  success: "#22c55e",
  playBg: "#7c3aed",
  playBgHover: "#8b5cf6",
  wave: "rgba(167, 139, 250, 0.45)",
  waveActive: "#a78bfa",
};

const light: PrayerPalette = {
  background: "#f8fafc",
  surface: "rgba(255, 255, 255, 0.9)",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  accent: "#7c3aed",
  border: "rgba(15, 23, 42, 0.12)",
  danger: "#dc2626",
  success: "#16a34a",
  playBg: "#6d28d9",
  playBgHover: "#7c3aed",
  wave: "rgba(124, 58, 237, 0.35)",
  waveActive: "#7c3aed",
};

const church: PrayerPalette = {
  background: "#1c1917",
  surface: "rgba(41, 37, 36, 0.85)",
  textPrimary: "#fafaf9",
  textSecondary: "#a8a29e",
  accent: "#d97706",
  border: "rgba(168, 162, 158, 0.15)",
  danger: "#b91c1c",
  success: "#15803d",
  playBg: "#b45309",
  playBgHover: "#d97706",
  wave: "rgba(217, 119, 6, 0.4)",
  waveActive: "#d97706",
};

export const palettes = {
  dark,
  light,
  church,
} as const;

export type PaletteId = keyof typeof palettes;

export const DEFAULT_PALETTE_ID: PaletteId = "dark";
