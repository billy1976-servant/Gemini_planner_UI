/**
 * Content Capability Extractor: given a section node, produces the set of
 * available content slots. Used by the Layout Compatibility Engine.
 * Read-only; does not modify the node.
 */

import { getOrganLayoutProfile } from "@/layout-organ";

/** Section node shape as used by JsonRenderer / SectionCompound. */
export type SectionNode = {
  id?: string;
  role?: string;
  type?: string;
  children?: unknown[];
  content?: Record<string, unknown>;
  params?: Record<string, unknown>;
};

export type GetAvailableSlotsOptions = {
  /** Include organ capability slot names (title, items, primary) when section.role is an organ. Default true. */
  includeOrganSlots?: boolean;
};

const CHILD_TYPE_TO_SLOT: Record<string, string> = {
  heading: "heading",
  title: "heading",
  body: "body",
  image: "image",
  card: "card_list",
};

/** Normalize child type or content key to canonical section/card slot. */
function normalizeToSlot(typeOrKey: string): string | null {
  const t = (typeOrKey ?? "").trim().toLowerCase();
  return CHILD_TYPE_TO_SLOT[t] ?? (t ? t : null);
}

/** Map our canonical slots to organ profile slot names when we have that content. */
function addOrganSlots(slots: Set<string>, role: string): void {
  const profile = getOrganLayoutProfile(role);
  if (!profile?.capabilities?.slots) return;
  const organSlotList = (profile.capabilities.slots as string[]) ?? [];
  for (const os of organSlotList) {
    if (!os || typeof os !== "string") continue;
    const satisfied =
      (os === "title" && slots.has("heading")) ||
      (os === "items" && slots.has("card_list")) ||
      (os === "primary" && (slots.has("body") || slots.has("heading"))) ||
      (os === "logo" && (slots.has("heading") || slots.has("body"))) ||
      (os === "cta" && slots.has("body")) ||
      slots.has(os);
    if (satisfied) slots.add(os);
  }
}

/**
 * Returns the list of content slot names that this section actually has.
 * Uses first-level children and content only. Normalizes per SLOT_NAMES.md.
 */
export function getAvailableSlots(
  sectionNode: SectionNode | null | undefined,
  options?: GetAvailableSlotsOptions
): string[] {
  const includeOrganSlots = options?.includeOrganSlots !== false;
  const slots = new Set<string>();

  if (!sectionNode || typeof sectionNode !== "object") {
    return [];
  }

  const content = sectionNode.content;
  if (content && typeof content === "object") {
    for (const key of Object.keys(content)) {
      const slot = normalizeToSlot(key) ?? key;
      if (slot && content[key] != null) slots.add(slot);
    }
    if (content.title != null && !slots.has("heading")) slots.add("heading");
  }

  const children = sectionNode.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (!child || typeof child !== "object") continue;
      const type = (child as { type?: string }).type;
      const role = (child as { role?: string }).role;
      const t = (type ?? role ?? "").trim().toLowerCase();
      const slot = normalizeToSlot(t);
      if (slot) slots.add(slot);
    }
  }

  if (includeOrganSlots && sectionNode.role) {
    addOrganSlots(slots, sectionNode.role);
  }

  return Array.from(slots);
}
