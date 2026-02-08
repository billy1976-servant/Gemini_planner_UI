/**
 * Contract verb set — single source for behavior-listener routing.
 * Action names in this set are routed through BehaviorRunner (runBehavior);
 * all others fall through to interpretRuntimeVerb.
 * Do not add inline verb arrays in behavior-listener.
 */

/** Verbs that use the "image" domain when domain is not supplied (behavior-actions-6x7). */
export const CONTRACT_VERBS_IMAGE_DOMAIN = [
  "crop",
  "filter",
  "frame",
  "layout",
  "motion",
  "overlay",
] as const;

/** Verbs that use the "interaction" domain (tap, double, long, etc.). */
export const CONTRACT_VERBS_INTERACTION = [
  "tap",
  "double",
  "long",
  "drag",
  "scroll",
  "swipe",
] as const;

/** Verbs that use the "navigation" domain (go, back, open, close, route). */
export const CONTRACT_VERBS_NAVIGATION = [
  "go",
  "back",
  "open",
  "close",
  "route",
] as const;

/** All contract verb tokens in one array. */
export const CONTRACT_VERB_LIST: readonly string[] = [
  ...CONTRACT_VERBS_INTERACTION,
  ...CONTRACT_VERBS_NAVIGATION,
  ...CONTRACT_VERBS_IMAGE_DOMAIN,
];

/** Set for O(1) lookup in behavior-listener. */
export const CONTRACT_VERBS = new Set<string>(CONTRACT_VERB_LIST);

/** Infer domain for contract verb when params.domain is not set. */
export function inferContractVerbDomain(
  actionName: string,
  paramsDomain?: string
): string {
  if (paramsDomain) return paramsDomain;
  if (CONTRACT_VERBS_IMAGE_DOMAIN.includes(actionName as any)) return "image";
  if (CONTRACT_VERBS_INTERACTION.includes(actionName as any)) return "interaction";
  return "navigation";
}
