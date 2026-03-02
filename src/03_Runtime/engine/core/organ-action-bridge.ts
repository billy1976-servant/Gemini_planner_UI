/**
 * Organ Action Bridge — wires TSX organ onAction calls into the global action pipeline.
 * Organ → onAction → dispatchOrganAction → CustomEvent("action") → behavior-listener → action-registry → dispatchState → re-render
 */

export function dispatchOrganAction(
  name: string,
  payload?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("action", {
      detail: {
        type: "Action",
        params: {
          name,
          ...payload,
        },
      },
    })
  );
}
