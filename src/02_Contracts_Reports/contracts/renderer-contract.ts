/**
 * Renderer contract slice (non-actionable types, etc.).
 * Single source for JsonRenderer behavior boundary; read from config so renderer does not import config.
 */
import config from "@/config/config.json";

const rendererContract = config.rendererContract as { nonActionableTypes: string[] };
export const NON_ACTIONABLE_TYPES = new Set(rendererContract.nonActionableTypes ?? []);
