/**
 * Deep-merge a patch into a screen-like record. Arrays in the patch replace the existing value (no element-wise merge).
 * Used by DevNodePanel and slide builder inspector so patches match NodeInspector semantics.
 */
export function deepMergeRecord<T extends Record<string, unknown>>(
  target: T,
  patch: Partial<T> & Record<string, unknown>
): T {
  const merged = Object.keys(patch as Record<string, unknown>).reduce(
    (acc: Record<string, unknown>, key) => {
      const value = (patch as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        acc[key] = value;
      } else if (value != null && typeof value === "object" && !Array.isArray(value)) {
        acc[key] = deepMergeRecord(
          ((target as Record<string, unknown>)[key] as Record<string, unknown>) || {},
          value as Record<string, unknown>
        );
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
  return { ...target, ...merged } as T;
}

export function patchLandingScreen<C extends { screens: Array<{ id: string } & Record<string, unknown>> }>(
  config: C,
  screenId: string,
  patch: Record<string, unknown>
): C {
  return {
    ...config,
    screens: config.screens.map((s) =>
      s.id === screenId ? (deepMergeRecord(s as Record<string, unknown>, patch) as (typeof config)["screens"][number]) : s
    ),
  };
}
