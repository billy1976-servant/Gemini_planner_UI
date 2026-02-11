/**
 * Experience visibility filter — runtime-only.
 * Decides per node: render, collapse, hide, or step (learning).
 * Inputs: experience, node.type, node.depth, node.slot (if present), stepIndex, sectionKeys, activeSectionKey.
 * No mutation of the JSON tree.
 *
 * Depth semantics:
 * - Website: all depths render (full page).
 * - App: depth 0 = shell, depth 1 = panels (one expanded, rest collapsed), depth 2+ = widgets/cards.
 * - Learning: depth 1 = step, depth 2+ = lesson content.
 */

export type ExperienceVisibilityResult = "render" | "collapse" | "hide" | "step";

export function getExperienceVisibility(
  experience: string,
  node: { type?: string; id?: string; role?: string; slot?: string; slotKey?: string },
  depth: number,
  stepIndex: number,
  sectionKeys: string[] = [],
  activeSectionKey?: string | null
): ExperienceVisibilityResult {
  const type = (node?.type ?? "").toString().toLowerCase();
  const sectionKey = (node?.id ?? node?.role) ?? "";

  // website: full page, all visible (control baseline)
  if (experience === "website") {
    return "render";
  }

  // app: dashboard — depth 0 = shell, depth 1 = panels (active full, others collapsed), depth 2+ = widgets
  if (experience === "app") {
    if (depth === 0) return "render";
    if (depth === 1 && type !== "section") return "hide";
    if (depth === 1 && type === "section") {
      const active = activeSectionKey ?? sectionKeys[0] ?? "";
      return sectionKey === active ? "render" : "collapse";
    }
    return "render";
  }

  // learning: step engine — only one section at a time (stepIndex)
  if (experience === "learning") {
    if (depth === 0) return "render";
    if (depth === 1) {
      if (type !== "section") return "hide";
      const currentKey = sectionKeys[stepIndex];
      if (currentKey === undefined || sectionKey !== currentKey) return "hide";
      return "render";
    }
    return "render";
  }

  // focus: only one section visible, no navigation (use currentStepIndex or activeSectionKey as single source)
  if (experience === "focus") {
    if (depth === 0) return "render";
    if (depth === 1) {
      if (type !== "section") return "hide";
      const currentKey = sectionKeys[stepIndex] ?? sectionKeys[0];
      return sectionKey === currentKey ? "render" : "hide";
    }
    return "render";
  }

  // presentation: one section = one slide (same as learning step model)
  if (experience === "presentation") {
    if (depth === 0) return "render";
    if (depth === 1) {
      if (type !== "section") return "hide";
      const currentKey = sectionKeys[stepIndex];
      if (currentKey === undefined || sectionKey !== currentKey) return "hide";
      return "render";
    }
    return "render";
  }

  // kids: hide deep nodes, big blocks only (depth 0–2 render, depth 3+ hide)
  if (experience === "kids") {
    if (depth <= 2) return "render";
    return "hide";
  }

  return "render";
}
