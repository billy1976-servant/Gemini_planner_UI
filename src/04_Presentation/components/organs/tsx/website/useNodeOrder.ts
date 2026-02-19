import { useMemo, useSyncExternalStore } from "react";
import { getOverride, subscribe } from "./node-order-override-store";
import type { TsxWebsiteNode } from "./types";

export function useNodeOrder(
  nodes: TsxWebsiteNode[],
  nodeOrder: string[],
  screenPath: string
): TsxWebsiteNode[] {
  const override = useSyncExternalStore(
    subscribe,
    () => getOverride(screenPath),
    () => getOverride(screenPath)
  );
  return useMemo(() => {
    const effectiveOrder = override ?? nodeOrder;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const ordered: TsxWebsiteNode[] = [];
    const seen = new Set<string>();
    for (const id of effectiveOrder) {
      const node = byId.get(id);
      if (node) {
        ordered.push(node);
        seen.add(id);
      }
    }
    for (const node of nodes) {
      if (!seen.has(node.id)) ordered.push(node);
    }
    return ordered;
  }, [nodes, nodeOrder, screenPath, override]);
}
