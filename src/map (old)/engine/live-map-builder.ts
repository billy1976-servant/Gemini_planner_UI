// src/map/engine/live-map-builder.ts


import { BlueprintTree } from "./map-blueprint-parser";


export function buildRuntime(tree: BlueprintTree) {
  const flow = tree.edges.map(e => ({
    from: e.from,
    action: e.action,
    to: e.to
  }));


  const renderGraph = Object.values(tree.nodes).map(n => ({
    id: n.id,
    name: n.name,
    molecule: n.molecule,
    parentId: n.parentId,
    children: n.children
  }));


  return { flow, renderGraph };
}
