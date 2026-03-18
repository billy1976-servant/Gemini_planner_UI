/**
 * Closed set of 12 molecule types — single source of truth for RENDERING_PURITY_CONTRACT.
 * Authority: RENDERING_PURITY_CONTRACT.md §6. Any molecule outside this set = HARD VIOLATION.
 */
export const ALLOWED_MOLECULES: readonly string[] = [
  "section",
  "button",
  "card",
  "avatar",
  "chip",
  "field",
  "footer",
  "list",
  "modal",
  "stepper",
  "toast",
  "toolbar",
] as const;

export type AllowedMoleculeId = (typeof ALLOWED_MOLECULES)[number];
