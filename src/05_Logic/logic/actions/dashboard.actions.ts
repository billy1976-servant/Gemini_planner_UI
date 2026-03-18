/**
 * Dashboard actions — widget layout state via dashboard.layout / dashboard.updateWidget.
 * Persisted in derived state.dashboardLayout (separate from layoutByScreen).
 */

import { getState, dispatchState } from "@/state/state-store";

export type WidgetRect = { id: string; x: number; y: number; w: number; h: number };

/** Full replace of widget layout for a screen. Payload: { screenKey?, widgets: { id, x, y, w, h }[] }. */
export function dashboardSetLayout(
  action: { screenKey?: string; widgets?: WidgetRect[] },
  _state: Record<string, any>
): void {
  const screenKey = typeof action.screenKey === "string" ? action.screenKey : "default";
  const widgets = Array.isArray(action.widgets) ? action.widgets : [];
  dispatchState("dashboard.layout", { screenKey, widgets });
}

/** Add one widget to the layout. Payload: { screenKey?, widgetId, rect?: { x, y, w, h } }. */
export function dashboardAddWidget(
  action: { screenKey?: string; widgetId?: string; rect?: Partial<WidgetRect> },
  _state: Record<string, any>
): void {
  const screenKey = typeof action.screenKey === "string" ? action.screenKey : "default";
  const widgetId = action.widgetId;
  if (!widgetId) return;
  const current = getState()?.dashboardLayout?.[screenKey]?.widgets ?? [];
  const rect = action.rect ?? {};
  const entry: WidgetRect = {
    id: widgetId,
    x: typeof rect.x === "number" ? rect.x : 0,
    y: typeof rect.y === "number" ? rect.y : 0,
    w: typeof rect.w === "number" ? rect.w : 2,
    h: typeof rect.h === "number" ? rect.h : 1,
  };
  const widgets = [...current.filter((w) => w.id !== widgetId), entry];
  dispatchState("dashboard.layout", { screenKey, widgets });
}

/** Remove one widget from the layout. Payload: { screenKey?, widgetId }. */
export function dashboardRemoveWidget(
  action: { screenKey?: string; widgetId?: string },
  _state: Record<string, any>
): void {
  const screenKey = typeof action.screenKey === "string" ? action.screenKey : "default";
  const widgetId = action.widgetId;
  if (!widgetId) return;
  const current = getState()?.dashboardLayout?.[screenKey]?.widgets ?? [];
  const widgets = current.filter((w) => w.id !== widgetId);
  dispatchState("dashboard.layout", { screenKey, widgets });
}
