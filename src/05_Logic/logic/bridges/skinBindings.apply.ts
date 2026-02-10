import type { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import type { SiteSkinDocument, SiteSkinNode, SlotNode } from "@/lib/site-skin/siteSkin.types";
import { siteDataToSlots } from "@/lib/site-skin/mappers/siteDataToSlots";

function getByPath(obj: any, path: string): any {
  if (!path) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isSlotNode(n: SiteSkinNode): n is SlotNode {
  return !!n && typeof n === "object" && (n as any).type === "slot" && typeof (n as any).slotKey === "string";
}

function resolveSlotNode(slot: SlotNode, data: Record<string, any>): any[] {
  const value = getByPath(data, slot.slotKey);
  const hasData = value !== undefined;
  const resolved = (() => {
    // Allow engines/mappers to directly supply molecule nodes
    if (Array.isArray(value) && value.every((x) => x && typeof x === "object" && typeof (x as any).type === "string")) {
      return value as any[];
    }
    // Default: unresolved slot renders nothing (deterministic, safe)
    return [];
  })();
  // DEV: Template content misfire trace (3) — per slot: slotKey, whether data exists, resolved length
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[applySkinBindings] DEV slot", { slotKey: slot.slotKey, dataExists: hasData, resolvedLength: resolved.length });
  }
  return resolved;
}

function resolveNodes(nodes: SiteSkinNode[], data: Record<string, any>): any[] {
  const out: any[] = [];
  for (const n of nodes) {
    if (isSlotNode(n)) {
      out.push(...resolveSlotNode(n, data));
      continue;
    }

    const obj: any = { ...(n as any) };
    if (Array.isArray(obj.children)) {
      obj.children = resolveNodes(obj.children, data);
    }
    out.push(obj);
  }
  return out;
}

/**
 * Apply engine/data bindings into a SiteSkin document.
 *
 * Contract:
 * - Input doc may contain `type: "slot"` nodes.
 * - Output doc MUST contain only renderable molecule nodes (no slot nodes).
 */
export function applySkinBindings(doc: SiteSkinDocument, data: Record<string, any>): SiteSkinDocument {
  return {
    ...doc,
    ...(Array.isArray((doc as any).nodes)
      ? { nodes: resolveNodes((doc as any).nodes, data) as any }
      : {}),
    ...(Array.isArray((doc as any).regions)
      ? {
          regions: (doc as any).regions.map((r: any) => ({
            ...r,
            nodes: resolveNodes(r.nodes, data) as any,
          })),
        }
      : {}),
  };
}

export type EngineOutput = Record<string, any>;

/**
 * Build a pure JSON data bag for SiteSkin slot resolution.
 * Engines decide *what* to include/feature; mappers decide *how* to render.
 */
export function buildSiteSkinDataBag(args: {
  siteData: NormalizedSite;
  engineOutput?: EngineOutput;
}) {
  const { siteData, engineOutput } = args;
  return {
    ...siteDataToSlots(siteData),
    site: siteData,
    engine: engineOutput ?? {},
  };
}

/**
 * Convenience helper: apply bindings to a skin using the standard data bag.
 * Returns a skin document with all slots resolved (renderable by JsonRenderer).
 */
export function resolveSiteSkin(args: {
  skin: SiteSkinDocument;
  siteData: NormalizedSite;
  engineOutput?: EngineOutput;
}) {
  const dataBag = buildSiteSkinDataBag({ siteData: args.siteData, engineOutput: args.engineOutput });
  const resolvedSkin = applySkinBindings(args.skin, dataBag);
  return { dataBag, resolvedSkin };
}

