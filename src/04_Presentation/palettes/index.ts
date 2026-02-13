/**
 * Palette set derived from all JSON files in this directory.
 * Add a new palette by adding a new .json file; no code changes required.
 */
const context = (require as any).context(".", false, /\.json$/);

const palettesRaw: Record<string, unknown> = {};
context.keys().forEach((key: string) => {
  const name = key.replace(/^\.\//, "").replace(/\.json$/, "");
  const mod = context(key);
  palettesRaw[name] = mod?.default ?? mod;
});

export const palettes = palettesRaw as Record<string, Record<string, unknown>>;

export type PaletteName = keyof typeof palettes;
