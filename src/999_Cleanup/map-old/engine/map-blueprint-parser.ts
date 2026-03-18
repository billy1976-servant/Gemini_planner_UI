// src/map/engine/map-blueprint-parser.ts


export type BlueprintNode = {
  id: string;
  name: string;
  molecule: string;
  slots: string[];
  parentId: string | null;
  children: string[];
  edges: Record<string, string>; // action → targetId
};


export type BlueprintEdge = {
  from: string;
  action: string;
  to: string;
};


export type BlueprintTree = {
  nodes: Record<string, BlueprintNode>;
  edges: BlueprintEdge[];
};


function parseSlots(raw: string): string[] {
  const m = raw.match(/\[(.*?)\]/);
  if (!m) return [];
  return m[1].split(",").map(s => s.trim()).filter(Boolean);
}


export function parseBlueprint(text: string): BlueprintTree {
  const lines = text.split(/\r?\n/);


  const nodes: Record<string, BlueprintNode> = {};
  const edges: BlueprintEdge[] = [];
  const stack: BlueprintNode[] = [];


  let current: BlueprintNode | null = null;


  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("APP:")) continue;


    // Node line
    if (/^\d+(\.\d+)*\s*\|/.test(line)) {
      const [id, name, right = ""] = line.split("|").map(s => s.trim());
      const molecule = right.split(/\s+/)[0];
      const slots = parseSlots(right);


      const depth = id.split(".").length;
      while (stack.length && stack[stack.length - 1].id.split(".").length >= depth) {
        stack.pop();
      }


      const parent = stack.length ? stack[stack.length - 1] : null;


      const node: BlueprintNode = {
        id,
        name,
        molecule,
        slots,
        parentId: parent ? parent.id : null,
        children: [],
        edges: {}
      };


      nodes[id] = node;
      if (parent) parent.children.push(id);


      stack.push(node);
      current = node;
      continue;
    }


    // Edge line
    if (line.startsWith("->") && current) {
      const parts = line.replace(/^->\s*/, "").split(/\s+/);
      const action = parts.length === 1 ? "press" : parts[0];
      const to = parts.length === 1 ? parts[0] : parts[1];


      current.edges[action] = to;
      edges.push({ from: current.id, action, to });
    }
  }

  console.log("PARSED TREE:", { nodes, edges });




  return { nodes, edges };
}

