"use client";

import { dispatchOrganAction } from "@/engine/core/organ-action-bridge";

/** Params so Card renders with visible surface when used as placeholder in organisms (avoids "just text"). */
export const ORGAN_CARD_PLACEHOLDER_PARAMS = {
  surface: {
    background: "var(--color-surface-2, #f1f5f9)",
    padding: "var(--spacing-2, 8px)",
    radius: "var(--radius-md, 6px)",
  },
} as const;

export function createOnAction() {
  return (name: string, payload?: unknown) => {
    const payloadObj =
      payload != null && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : undefined;
    if (process.env.NODE_ENV !== "production") {
      console.log("[tsx-organisms] dispatchOrganAction", name, payloadObj ?? "");
    }
    dispatchOrganAction(name, payloadObj);
  };
}

/** Order items by itemOrder if present, else by array order. */
export function orderItemsById<T extends { id: string }>(items: T[], itemOrder?: string[]): T[] {
  if (!itemOrder?.length) return items;
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered: T[] = [];
  for (const id of itemOrder) {
    const item = byId.get(id);
    if (item) ordered.push(item);
  }
  for (const item of items) {
    if (!itemOrder.includes(item.id)) ordered.push(item);
  }
  return ordered;
}
