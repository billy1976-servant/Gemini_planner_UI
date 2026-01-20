// src/map/engine/live-content-generator.ts
import fs from "fs";
import path from "path";


type Node = {
  id: string;
  name: string;
  molecule: string;
  children: string[];
};


const LABELS_PATH = path.resolve(
  process.cwd(),
  "src/map/map-molecule-labels.json"
);


const LABELS: Record<string, string[]> = JSON.parse(
  fs.readFileSync(LABELS_PATH, "utf8")
);


function indent(level: number) {
  return "  ".repeat(level);
}


export function generateContent(nodes: Record<string, Node>): string {
  const lines: string[] = [];
  lines.push("APP: Content\n");


  function walk(id: string, level: number) {
    const n = nodes[id];
    if (!n) return;


    lines.push(
      `${indent(level)}${n.id} | ${n.name} (${n.molecule})`
    );


    const slots = LABELS[n.molecule] || [];
    for (const slot of slots) {
      lines.push(`${indent(level + 1)}- ${slot}: ""`);
    }


    for (const child of n.children || []) {
      walk(child, level + 1);
    }
  }


  const roots = Object.values(nodes).filter(
    n => !Object.values(nodes).some(p => p.children?.includes(n.id))
  );


  roots.forEach(r => walk(r.id, 0));
  return lines.join("\n");
}


