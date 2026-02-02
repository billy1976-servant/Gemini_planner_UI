/**
 * Build a template profile from the current expanded/composed tree.
 * Used by "Save Current Layout as Template" to capture section layouts per role.
 */
import type { TemplateProfile, LayoutDef } from "./template-profiles";

function isSectionNode(node: unknown): node is { type?: string; role?: string; layout?: any; params?: any; children?: unknown[] } {
  if (!node || typeof node !== "object") return false;
  const t = (node as { type?: string }).type;
  return typeof t === "string" && t.toLowerCase() === "section";
}

function collectSectionsFromTree(
  nodes: unknown[],
  acc: Record<string, LayoutDef> = {}
): Record<string, LayoutDef> {
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    if (isSectionNode(n) && n.role && typeof n.role === "string") {
      const role = n.role as string;
      const layout = n.layout as { type?: string; params?: Record<string, unknown> } | undefined;
      const moleculeLayout = (n.params as { moleculeLayout?: { type?: string; params?: Record<string, unknown> } })?.moleculeLayout;
      const type = layout?.type ?? moleculeLayout?.type ?? "column";
      const params = layout?.params ?? moleculeLayout?.params ?? {};
      const normalizedType = type === "stacked" ? "stack" : type;
      if (!acc[role]) {
        acc[role] = { type: normalizedType as "row" | "column" | "grid" | "stack", params: { ...params } };
      }
    }
    if (Array.isArray(n.children)) {
      collectSectionsFromTree(n.children as unknown[], acc);
    }
  }
  return acc;
}

/**
 * Build a template profile object from a composed screen tree.
 * Traverses the tree, collects each Section's layout (type + params) by role.
 */
export function buildTemplateFromTree(
  root: unknown,
  options: {
    id?: string;
    label?: string;
    containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split";
    visualPreset?: "default" | "compact" | "spacious" | "editorial" | "prominent";
  } = {}
): Omit<TemplateProfile, "id" | "label"> & { id: string; label: string } {
  const nodes = Array.isArray((root as any)?.children)
    ? (root as any).children
    : [];
  const sections = collectSectionsFromTree(nodes);
  const id = options.id ?? `user-template-${Date.now()}`;
  const label = options.label ?? `User Template ${new Date().toLocaleDateString()}`;
  return {
    id,
    label,
    visualPreset: options.visualPreset ?? "default",
    containerWidth: options.containerWidth ?? "contained",
    sections,
  };
}

/**
 * Return profile as JSON string for download or API.
 */
export function serializeTemplateProfile(profile: ReturnType<typeof buildTemplateFromTree>): string {
  return JSON.stringify(profile, null, 2);
}
