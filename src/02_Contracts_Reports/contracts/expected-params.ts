/**
 * Expected params per molecule — single source for JsonRenderer diagnostics and param-key-mapping test.
 * Must align with PARAM_KEY_MAPPING.md and JSON_SCREEN_CONTRACT allowedParams.
 */
export const EXPECTED_PARAMS: Record<string, string[]> = {
  button: ["surface", "label", "trigger"],
  section: ["surface", "title"],
  card: ["surface", "title", "body", "media"],
  toolbar: ["surface", "item"],
  list: ["surface", "item"],
  footer: ["surface", "item"],
  chip: ["surface", "text", "body", "media"],
  avatar: ["surface", "media", "text"],
  field: ["surface", "label", "field", "error"],
  toast: ["surface", "text"],
  modal: ["surface", "title", "body"],
};
