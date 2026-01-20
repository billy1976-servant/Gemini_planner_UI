#!/usr/bin/env ts-node
/**
 * ============================================================
 * BLUEPRINT + CONTENT → app.json (NODE-SAFE COMPILER)
 * ============================================================
 *
 * AUTHORITATIVE:
 * - PRESERVES canonical casing from blueprint
 * - EMITS COMPLETE Action payloads (track, key, valueFrom, fieldKey)
 * - PRESERVES section structure exactly
 * - Produces EXACT JSON shape required by renderer
 * - No DSL changes
 * - No inference
 * - No file collapsing
 *
 * ============================================================
 */
import fs from "fs";
import path from "path";
import readline from "readline";


/* ============================================================
   CONSTANTS
============================================================ */
const APPS_ROOT = path.resolve(process.cwd(), "src/apps-offline");
const SCREEN_ROOT_ID = "screenRoot";
const DEFAULT_VIEW = "|home";


/* ============================================================
   CLI UTILS
============================================================ */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}


function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(d => fs.statSync(path.join(dir, d)).isDirectory());
}


/** 🔒 Canonical: NO LOWER-CASING */
function slugify(name: string) {
  return "|" + name.replace(/[^a-zA-Z0-9]+/g, "");
}


/* ============================================================
   BLUEPRINT PARSER
============================================================ */
type RawNode = {
  indent: number;
  rawId: string;
  name: string;
  type: string;
  target?: string;
  state?: { type: string; key: string }[];
  logic?: { type: string; expr: string }[];
};


function parseBlueprint(text: string): RawNode[] {
  const lines = text.split("\n");
  const nodes: RawNode[] = [];
  let last: RawNode | null = null;


  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith("APP:")) continue;


    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;


    if (line.trim().startsWith("->") && last) {
      last.target = line.trim().replace("->", "").trim();
      continue;
    }


    const bindMatch = line.match(/state\.bind:\s*([a-zA-Z0-9._]+)/);
    if (bindMatch && last) {
      last.state = last.state || [];
      last.state.push({ type: "bind", key: bindMatch[1] });
      continue;
    }


    const logicMatch = line.match(/\(logic\.(\w+):\s*([^)]+)\)/);
    if (logicMatch && last) {
      last.logic = last.logic || [];
      last.logic.push({ type: logicMatch[1], expr: logicMatch[2].trim() });
      continue;
    }


    const match = line.trim().match(/^([\d.]+)\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (!match) continue;


    const [, rawId, name, type] = match;
    nodes.push({ indent, rawId, name, type });
    last = nodes[nodes.length - 1];
  }


  return nodes;
}


/* ============================================================
   CONTENT PARSER (UNCHANGED)
============================================================ */
function parseContent(text: string): Record<string, any> {
  const lines = text.split("\n");
  const content: Record<string, any> = {};
  let current: string | null = null;


  const parseScalar = (raw: string) => raw.replace(/^"(.*)"$/, "$1");


  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;


    const header = line.match(/^([\d.]+)\s+/);
    if (header) {
      current = header[1];
      content[current] = {};
      continue;
    }


    if (!current) continue;


    const kv = line.match(/^-+\s*([\w]+)\s*:\s*(.*)$/);
    if (!kv) continue;


    content[current][kv[1]] = parseScalar(kv[2]);
  }


  return content;
}


/* ============================================================
   TREE BUILDER (CANONICAL — NO AUTO-INSERTION)
============================================================ */
function buildTree(nodes: RawNode[], contentMap: Record<string, any>) {
  const stack: any[] = [];
  const rootChildren: any[] = [];
  const idMap: Record<string, string> = {};
  const rawByName: Record<string, string> = {};


  for (const n of nodes) {
    idMap[n.rawId] = slugify(n.name);
    rawByName[n.name] = n.rawId;
  }


  for (const node of nodes) {
    const entry: any = {
      id: idMap[node.rawId],
      type: node.type,
      children: [],
      content: contentMap[node.rawId] ?? {},
    };


    /* ---------- STATE BIND ---------- */
    if (node.state) {
      for (const s of node.state) {
        if (s.type === "bind") {
          entry.state = { mode: "two-way", key: s.key };
          entry.params = {
            field: {
              multiline: true,
              rows: 4,
              fieldKey: s.key,
            },
          };
        }
      }
    }


    /* ---------- LOGIC ACTION ---------- */
    if (node.logic?.length) {
      const expr = node.logic[0].expr;


      if (expr === "state:journal.add") {
        const track = node.name.replace(/Save$/i, "").toLowerCase();


        entry.behavior = {
          type: "Action",
          params: {
            name: "state:journal.add",
            track,
            key: "entry",
            valueFrom: "input",
            fieldKey: `journal.${track}`,
          },
        };
      } else {
        entry.behavior = {
          type: "Action",
          params: { name: expr },
        };
      }
    }


    /* ---------- NAV TARGET (DO NOT OVERRIDE LOGIC) ---------- */
    if (node.target && !entry.behavior) {
      const raw =
        node.target.match(/^([\d.]+)/)?.[1] ??
        rawByName[node.target] ??
        node.target;


      entry.behavior = {
        type: "Navigation",
        params: {
          verb: "go",
          variant: "screen",
          screenId: idMap[raw],
          to: idMap[raw],  // For behavior-listener compatibility
        },
      };
    }


    while (stack.length && stack[stack.length - 1].indent >= node.indent) {
      stack.pop();
    }


    const parent = stack[stack.length - 1]?.entry;
    parent ? parent.children.push(entry) : rootChildren.push(entry);


    stack.push({ indent: node.indent, entry });
  }


  return rootChildren;
}


/* ============================================================
   MAIN
============================================================ */
async function run() {
  const categories = listDirs(APPS_ROOT);
  categories.forEach((c, i) => console.log(`${i + 1}. ${c}`));


  const cat = categories[(+await prompt("Choose folder number: ")) - 1];
  if (!cat) process.exit(1);


  const catPath = path.join(APPS_ROOT, cat);


  const apps = listDirs(catPath).filter(a =>
    fs.existsSync(path.join(catPath, a, "blueprint.txt"))
  );


  apps.forEach((a, i) => console.log(`${i + 1}. ${a}`));


  const app = apps[(+await prompt("Choose app number: ")) - 1];
  if (!app) process.exit(1);


  const appPath = path.join(catPath, app);
  const blueprintText = fs.readFileSync(path.join(appPath, "blueprint.txt"), "utf8");


  const contentText = fs.existsSync(path.join(appPath, "content.txt"))
    ? fs.readFileSync(path.join(appPath, "content.txt"), "utf8")
    : "";


  const rawNodes = parseBlueprint(blueprintText);
  const contentMap = parseContent(contentText);
  const children = buildTree(rawNodes, contentMap);


  const output = {
    id: SCREEN_ROOT_ID,
    type: "screen",
    state: { currentView: DEFAULT_VIEW },
    children,
  };


  fs.writeFileSync(path.join(appPath, "app.json"), JSON.stringify(output, null, 2));
  console.log("✅ app.json generated (Blueprint-only structure)");
}


run();

