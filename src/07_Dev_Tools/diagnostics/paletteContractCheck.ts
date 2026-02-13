export type PaletteCheckResult = {
  ok: boolean;
  failures: string[];
};

export function validatePaletteContract(palette: any): PaletteCheckResult {
  const failures: string[] = [];

  if (!palette) {
    failures.push("No palette loaded");
    return { ok: false, failures };
  }

  if (!palette.color) failures.push("Missing color root");
  if (!palette.surface) failures.push("Missing surface tokens");
  if (!palette.radius) failures.push("Missing radius tokens");
  if (!palette.padding) failures.push("Missing padding tokens");
  if (!palette.textSize) failures.push("Missing textSize tokens");
  if (!palette.textWeight) failures.push("Missing textWeight tokens");
  if (!palette.textRole) failures.push("Missing textRole tokens");

  return {
    ok: failures.length === 0,
    failures
  };
}
