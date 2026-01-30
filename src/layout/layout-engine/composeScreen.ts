/**
 * LayoutEngine.composeScreen (layout-first)
 *
 * Input: role-tagged molecule JSON nodes (content only)
 * - nodes may be a flat array or already nested; roles are read from `node.role`.
 *
 * Output: a composed JsonRenderer node tree:
 * - screen root
 * - region sections (header/nav/hero/content/etc.)
 * - original nodes placed into regions
 *
 * This is a PURE function: no stores, no DOM, no hooks.
 */

import type { LayoutExperience, RegionKey, RegionPolicyState } from "@/layout/layout-engine/region-policy";
import {
  getNavPlacement,
  getRegionOrder,
  isRegionEnabled,
  resolveRegionForRole,
} from "@/layout/layout-engine/region-policy";

export type RoleTaggedNode = {
  id?: string;
  type: string;
  role?: string;
  layout?: any;
  params?: any;
  content?: any;
  behavior?: any;
  children?: RoleTaggedNode[];
  [key: string]: any;
};

export type LayoutState = {
  experience?: LayoutExperience;
  type?: string; // global layout flow (optional)
  preset?: string | null;
  regionPolicy?: RegionPolicyState;
};

type ComposeArgs = {
  roleTaggedNodes: RoleTaggedNode[]; // content nodes only
  layoutState: LayoutState;
  experienceProfile?: any;
};

function flattenNodes(nodes: RoleTaggedNode[]): RoleTaggedNode[] {
  // Layout engine operates on “content nodes”; if callers pass nested trees,
  // we preserve nesting by leaving children intact (only region assignment uses top-level role).
  return Array.isArray(nodes) ? nodes : [];
}

function ensureRegionRole(region: RegionKey, experience: LayoutExperience): string {
  // JsonRenderer applies profile defaults only for `type:"section"` with `role` matching profile keys.
  // This mapping lets a single region key map onto a profile section role (when profiles are sparse).
  if (experience === "website") {
    if (region === "products") return "features";
    return region;
  }
  return region;
}

function makeRegionSection(region: RegionKey, experience: LayoutExperience, nodes: RoleTaggedNode[]): RoleTaggedNode {
  return {
    id: `region:${region}`,
    type: "section",
    role: ensureRegionRole(region, experience),
    // Default child layout inside the region is derived via profile in JsonRenderer.
    children: nodes,
  };
}

export function composeScreen({ roleTaggedNodes, layoutState, experienceProfile }: ComposeArgs): RoleTaggedNode {
  const experience: LayoutExperience = layoutState.experience ?? "website";
  const policy = layoutState.regionPolicy ?? {};
  const order = getRegionOrder(experience);
  const navPlacement = getNavPlacement(policy, experience);

  const nodes = flattenNodes(roleTaggedNodes);
  const buckets: Partial<Record<RegionKey, RoleTaggedNode[]>> = {};

  for (const n of nodes) {
    const region = resolveRegionForRole(n?.role, experience);
    const arr = buckets[region] ?? [];
    arr.push(n);
    buckets[region] = arr;
  }

  // If a region is disabled, deterministically merge its nodes into the primary content region.
  const primaryFallback: RegionKey = experience === "app" ? "primary" : "content";
  for (const region of Object.keys(buckets) as RegionKey[]) {
    if (!isRegionEnabled(region, policy, experience)) {
      const moved = buckets[region] ?? [];
      if (moved.length) {
        buckets[primaryFallback] = [...(buckets[primaryFallback] ?? []), ...moved];
      }
      delete buckets[region];
    }
  }

  // Build region sections in canonical order, but only include regions with content (except nav/header/footer can be empty).
  const regionSections: RoleTaggedNode[] = [];
  for (const region of order) {
    const enabled = isRegionEnabled(region, policy, experience);
    if (!enabled) continue;

    const content = buckets[region] ?? [];

    // For nav/header/footer: include only if there is content OR if policy says enabled explicitly.
    const includeEvenEmpty = region === "nav" || region === "header" || region === "footer";
    if (!includeEvenEmpty && content.length === 0) continue;

    regionSections.push(makeRegionSection(region, experience, content));
  }

  // Compose shell
  // Website/Learning: simple vertical page shell
  if (experience !== "app" || navPlacement === "top" || navPlacement === "bottom" || navPlacement === "none") {
    return {
      id: "composed:screen",
      type: "screen",
      // Page-level container layout should come from experience defaults.
      // We pass the experienceProfile through the caller into JsonRenderer; JsonRenderer uses profile for sections.
      // No hardcoded maxWidth here.
      children: regionSections,
    };
  }

  // App with side nav: row shell
  // We construct: screen(Row) -> [navSection, mainColumnSection]
  const nav = regionSections.find((s) => s.role === ensureRegionRole("nav", experience)) ?? null;
  const main = regionSections.filter((s) => s !== nav);

  return {
    id: "composed:screen",
    type: "screen",
    layout: { type: "row", params: { gap: "1rem", align: "stretch", justify: "flex-start", wrap: "nowrap" } },
    children: [
      ...(nav ? [nav] : []),
      {
        id: "region:main",
        type: "section",
        role: "content",
        layout: { type: "column", params: { gap: "1rem", align: "stretch" } },
        children: main,
      },
    ],
  };
}

