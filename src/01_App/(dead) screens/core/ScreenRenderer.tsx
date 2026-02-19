/**
 * Re-export ScreenRenderer from runtime (single source of truth)
 * 
 * This maintains the @/apps-tsx/core/ScreenRenderer alias (via tsconfig)
 * while delegating to the runtime implementation.
 */
export { default } from "@/runtime/screens/ScreenRenderer";
