/**
 * Centralized motion scale: applies --motion-duration-scale (set by behavior profile on root)
 * to transition strings. Single place that applies the multiplier; used by atoms only.
 */

/**
 * Wrap each duration in a transition string with the scale variable.
 * E.g. "200ms ease" -> "calc(200ms * var(--motion-duration-scale, 1)) ease"
 * Handles multiple durations: "opacity 200ms ease, transform 150ms ease" -> both scaled.
 */
export function withMotionScale(transitionString: string | undefined | null): string | undefined {
  if (transitionString == null || typeof transitionString !== "string" || !transitionString.trim()) {
    return undefined;
  }
  const scaled = transitionString.replace(
    /(\d+(?:\.\d+)?)(ms|s)\b/g,
    (_, num, unit) => `calc(${num}${unit} * var(--motion-duration-scale, 1))`
  );
  return scaled;
}
