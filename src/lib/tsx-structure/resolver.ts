/**
 * TSX App Structure Engine — universal control hub.
 * Thin re-export from resolver/index so existing imports (from "./resolver") keep working.
 */

export {
  resolveAppStructure,
  setResolverConfig,
  getResolverConfig,
} from "./resolver/index";
