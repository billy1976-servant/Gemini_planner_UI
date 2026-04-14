/**
 * Pure helpers for landing flow deck edits (dev slide builder).
 * JSON shape stays the source of truth; these only mutate in-memory config + order ids.
 */

export type LandingScreenLike = { id: string };

export function getEffectiveScreenOrder(
  screens: LandingScreenLike[],
  orderOverride: string[] | undefined
): string[] {
  const base = screens.map((s) => s.id);
  if (!orderOverride?.length) return base;
  const set = new Set(base);
  const head = orderOverride.filter((id) => set.has(id));
  const tail = base.filter((id) => !head.includes(id));
  return [...head, ...tail];
}

/** Reorder screens[] to match visual order (for export). */
export function mergeScreenOrderIntoScreens<T extends LandingScreenLike>(
  screens: T[],
  orderOverride: string[] | undefined
): T[] {
  const order = getEffectiveScreenOrder(screens, orderOverride);
  const map = new Map(screens.map((s) => [s.id, s]));
  return order.map((id) => map.get(id)).filter((s): s is T => s != null);
}

function uniqueScreenId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function newStubScreen(id: string): Record<string, unknown> {
  return {
    id,
    stepLabel: "New slide",
    layout: "textOnly",
    title: "New slide",
    content: [{ type: "paragraph", text: "Edit this slide." }],
    media: [],
    buttons: [],
  };
}

export function addScreenAtEnd<C extends { screens: Record<string, unknown>[] }>(
  config: C,
  currentOrder: string[] | undefined
): { config: C; newOrder: string[]; newId: string } {
  const ids = new Set(config.screens.map((s) => String(s.id)));
  const newId = uniqueScreenId("new-slide", ids);
  const screen = newStubScreen(newId);
  const order = getEffectiveScreenOrder(
    config.screens as LandingScreenLike[],
    currentOrder
  );
  return {
    config: { ...config, screens: [...config.screens, screen] } as C,
    newOrder: [...order, newId],
    newId,
  };
}

export function duplicateScreenById<C extends { screens: Record<string, unknown>[] }>(
  config: C,
  screenId: string,
  currentOrder: string[] | undefined
): { config: C; newOrder: string[]; newId: string } | null {
  const idx = config.screens.findIndex((s) => String(s.id) === screenId);
  if (idx < 0) return null;
  const orig = config.screens[idx];
  const ids = new Set(config.screens.map((s) => String(s.id)));
  const newId = uniqueScreenId(`${String(orig.id)}-copy`, ids);
  const clone = JSON.parse(JSON.stringify(orig)) as Record<string, unknown>;
  clone.id = newId;
  const newScreens = [...config.screens];
  newScreens.splice(idx + 1, 0, clone);
  const order = getEffectiveScreenOrder(
    config.screens as LandingScreenLike[],
    currentOrder
  );
  const pos = order.indexOf(screenId);
  const newOrder =
    pos >= 0
      ? [...order.slice(0, pos + 1), newId, ...order.slice(pos + 1)]
      : [...order, newId];
  return { config: { ...config, screens: newScreens } as C, newOrder, newId };
}

export function deleteScreenById<C extends { screens: Record<string, unknown>[] }>(
  config: C,
  screenId: string,
  currentOrder: string[] | undefined
): { config: C; newOrder: string[] } | null {
  if (config.screens.length <= 1) return null;
  const order = getEffectiveScreenOrder(
    config.screens as LandingScreenLike[],
    currentOrder
  ).filter((id) => id !== screenId);
  const map = new Map(config.screens.map((s) => [String(s.id), s]));
  const screens = order.map((id) => map.get(id)).filter((s): s is Record<string, unknown> => s != null);
  return { config: { ...config, screens } as C, newOrder: order };
}

export function moveIdInOrder(order: string[], screenId: string, direction: "up" | "down"): string[] {
  const idx = order.indexOf(screenId);
  if (idx < 0) return order;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}

export function downloadLandingJson(filename: string, jsonText: string): void {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
