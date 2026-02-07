/**
 * Error classifier for screen diagnostics.
 * Normalizes error messages into categories and provides fix hints.
 * Diagnostics only — no behavior changes to loaders or runtime.
 */

export type ErrorType =
  | "PATH_MISSING"
  | "MODULE_NOT_FOUND"
  | "JSON_PARSE_ERROR"
  | "RUNTIME_IMPORT_ERROR"
  | "EMPTY_FILE"
  | "UNKNOWN";

const FIX_HINTS: Record<ErrorType, string> = {
  PATH_MISSING:
    "File likely renamed, deleted, or path drift. Check apps-json/apps-tsx alignment.",
  MODULE_NOT_FOUND:
    "Alias or require.context root likely incorrect. Check tsconfig + next.config paths.",
  JSON_PARSE_ERROR:
    "Invalid JSON syntax. Open file and validate structure.",
  RUNTIME_IMPORT_ERROR:
    "TSX file exists but dynamic import failed. Likely dependency break.",
  EMPTY_FILE:
    "File exists but contains no usable content.",
  UNKNOWN:
    "Open console + stack trace.",
};

/**
 * Map common error messages to normalized ErrorType.
 */
export function classifyError(message: string | undefined): ErrorType {
  if (!message || typeof message !== "string") return "UNKNOWN";
  const m = message.toLowerCase();
  if (m.includes("404") || m.includes("file not found") || m.includes("enoent"))
    return "PATH_MISSING";
  if (m.includes("module not found") || m.includes("cannot find module"))
    return "MODULE_NOT_FOUND";
  if (m.includes("unexpected token") || m.includes("invalid json") || m.includes("json"))
    return "JSON_PARSE_ERROR";
  if (m.includes("dynamic import") || m.includes("import failed") || m.includes("failed to fetch dynamically"))
    return "RUNTIME_IMPORT_ERROR";
  if (m.includes("empty file") || m.includes("no usable content"))
    return "EMPTY_FILE";
  return "UNKNOWN";
}

/**
 * Get fix hint for a given error type.
 */
export function getFixHint(errorType: ErrorType): string {
  return FIX_HINTS[errorType];
}

/**
 * Classify an error (string or Error) and return type + hint.
 */
export function classifyAndHint(error: string | Error | undefined): { errorType: ErrorType; fixHint: string } {
  const msg = error == null ? undefined : typeof error === "string" ? error : (error as Error).message;
  const errorType = classifyError(msg);
  return { errorType, fixHint: getFixHint(errorType) };
}
