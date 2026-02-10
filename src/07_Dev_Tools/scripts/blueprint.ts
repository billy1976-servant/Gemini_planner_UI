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
// TXT-only apps live under: src/01_App/apps-json/apps
const APPS_ROOT = path.resolve(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "apps"
);
const SCREEN_ROOT_ID = "screenRoot";
const DEFAULT_VIEW = "|home";
const ORGAN_INDEX_PATH = path.resolve(process.cwd(), "src/07_Dev_Tools/scripts/organ-index.json");

/** Organ index shape (read-only; loaded from external JSON). */
type OrganIndex = {
  organs: Record<
    string,
    { slots: string[]; variants: string[] }
  >;
};

function loadOrganIndex(): OrganIndex | null {
  try {
    if (!fs.existsSync(ORGAN_INDEX_PATH)) return null;
    const raw = fs.readFileSync(ORGAN_INDEX_PATH, "utf8");
    const data = JSON.parse(raw) as OrganIndex;
    if (!data?.organs || typeof data.organs !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

/** Contract-derived: allowed content keys per molecule type (empty = no content slots). */
const ALLOWED_CONTENT_KEYS: Record<string, string[]> = {
  button: ["label"],
  avatar: ["media", "text"],
  chip: ["title", "body", "media"],
  field: ["label", "input", "error"],
  list: ["items"],
  stepper: ["steps"],
  toast: ["message"],
  toolbar: ["actions"],
  modal: ["title", "body", "actions"],
  section: ["title"],
  footer: ["left", "right"],
  card: ["title", "body", "media", "actions"],
};


/* ============================================================
   CONTENT.MANIFEST GENERATOR + VALIDATION
============================================================ */
function generateContentManifest(
  rawNodes: RawNode[],
  appPath: string,
  organIndex: OrganIndex | null
): Record<string, Record<string, string>> {
  const manifest: Record<string, Record<string, string>> = {};
  for (const node of rawNodes) {
    if (node.type === "organ" && node.organId && organIndex?.organs[node.organId]) {
      const slots = organIndex.organs[node.organId].slots ?? [];
      if (slots.length) {
        manifest[node.rawId] = Object.fromEntries(slots.map((k) => [k, ""]));
      }
    } else {
      const keys = ALLOWED_CONTENT_KEYS[node.type.toLowerCase()];
      if (keys?.length) {
        manifest[node.rawId] = Object.fromEntries(keys.map((k) => [k, ""]));
      }
    }
  }
  const manifestPath = path.join(appPath, "content.manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

function validateContentKeys(
  contentMap: Record<string, any>,
  manifest: Record<string, Record<string, string>>,
  rawNodes: RawNode[]
): void {
  const idToType: Record<string, string> = Object.fromEntries(rawNodes.map((n) => [n.rawId, n.type]));
  for (const [nodeId, content] of Object.entries(contentMap)) {
    if (!content || typeof content !== "object") continue;
    const allowed = manifest[nodeId];
    const keys = Object.keys(content);
    if (allowed) {
      for (const k of keys) {
        if (!(k in allowed)) {
          console.warn(`[content.manifest] Invented key "${k}" on node ${nodeId} (type: ${idToType[nodeId]}); allowed: ${Object.keys(allowed).join(", ")}`);
        }
      }
      for (const k of Object.keys(allowed)) {
        if (!(k in content)) {
          console.warn(`[content.manifest] Missing key "${k}" on node ${nodeId} (type: ${idToType[nodeId]})`);
        }
      }
    }
  }
}

/** Validate organ nodes: organId in index, slotKeys in definition, variant allowed. Fail or warn per contract. */
function validateOrganNodes(rawNodes: RawNode[], organIndex: OrganIndex | null): void {
  if (!organIndex) return;
  for (const node of rawNodes) {
    if (node.type !== "organ" || !node.organId) continue;
    const organId = node.organId;
    const def = organIndex.organs[organId];
    if (!def) {
      console.error(`[organ] Unknown organId "${organId}" at node ${node.rawId}; not in organ index.`);
      continue;
    }
    const allowedSlots = new Set(def.slots ?? []);
    const allowedVariants = new Set(def.variants ?? []);
    if (node.slots?.length) {
      for (const slot of node.slots) {
        if (!allowedSlots.has(slot)) {
          console.warn(`[organ] Slot "${slot}" on node ${node.rawId} (organ:${organId}) is not in organ definition; allowed: ${def.slots.join(", ")}`);
        }
      }
    }
    const variant = node.variant ?? "default";
    if (!allowedVariants.has(variant)) {
      console.warn(`[organ] Variant "${variant}" on node ${node.rawId} (organ:${organId}) is not in organ variants; allowed: ${def.variants.join(", ")}`);
    }
  }
}


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
  slots?: string[];
  behaviorToken?: string;
  target?: string;
  state?: { type: string; key: string }[];
  logic?: { type: string; expr: string }[];
  role?: string;
  /** Set when type === "organ" */
  organId?: string;
  /** Organ variant; default "default" */
  variant?: string;
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

    const variantMatch = line.trim().match(/^variant:\s*(\S+)$/);
    if (variantMatch && last) {
      last.variant = variantMatch[1].trim();
      continue;
    }

    // Organ line: 1.0 | HeroBlock | organ:hero [hero.title, hero.subtitle, hero.cta]
    const organMatch = line
      .trim()
      .match(/^([\d.]+)\s*\|\s*(.+?)\s*\|\s*organ:(\w+)(?:\s*\[([^\]]*)\])?$/);
    if (organMatch) {
      const [, rawId, name, organId, slotsRaw] = organMatch;
      const slots =
        typeof slotsRaw === "string" && slotsRaw.trim().length
          ? slotsRaw
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : undefined;
      nodes.push({
        indent,
        rawId,
        name,
        type: "organ",
        organId,
        slots,
        variant: "default",
      });
      last = nodes[nodes.length - 1];
      continue;
    }

    // Contract-style: `1.1 | Name | Type [slot,slot] (verb)`
    const match = line
      .trim()
      .match(/^([\d.]+)\s*\|\s*(.+?)\s*\|\s*(\w+)(?:\s*\[([^\]]*)\])?(?:\s*\(([^)]+)\))?/);
    if (!match) continue;


    const [, rawId, name, type, slotsRaw, behaviorTokenRaw] = match as any;

    const slots =
      typeof slotsRaw === "string" && slotsRaw.trim().length
        ? slotsRaw
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined;

    const behaviorToken =
      typeof behaviorTokenRaw === "string" && behaviorTokenRaw.trim().length
        ? behaviorTokenRaw.trim()
        : undefined;

    nodes.push({ indent, rawId, name, type, slots, behaviorToken });
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


    // Header: line starting with numeric id (e.g. "1.0" or "1.0 Section title")
    const header = line.match(/^([\d.]+)\s*(.*)$/);
    if (header) {
      current = header[1];
      content[current] = content[current] ?? {};
      continue;
    }


    if (!current) continue;

    // Key may be dotted for organ slotKeys (e.g. hero.title); optional leading "- "
    const kv = line.match(/^(-+\s*)?([\w.]+)\s*:\s*(.*)$/);
    if (!kv) continue;

    content[current][kv[2]] = parseScalar(kv[3]);
  }


  return content;
}


/* ============================================================
   TREE BUILDER (CANONICAL — NO AUTO-INSERTION)
============================================================ */
function buildTree(
  nodes: RawNode[],
  contentMap: Record<string, any>,
  organIndex: OrganIndex | null
) {
  const stack: any[] = [];
  const rootChildren: any[] = [];
  const idMap: Record<string, string> = {};
  const rawByName: Record<string, string> = {};


  for (const n of nodes) {
    idMap[n.rawId] = slugify(n.name);
    rawByName[n.name] = n.rawId;
  }


  for (const node of nodes) {
    if (node.type === "organ") {
      const organId = node.organId ?? "";
      const variant = node.variant ?? "default";
      const def = organIndex?.organs[organId];
      const slotKeys = def?.slots ?? [];
      const rawContent = contentMap[node.rawId] ?? {};
      const content: Record<string, any> = {};
      for (const key of slotKeys) {
        if (key in rawContent) content[key] = rawContent[key];
      }
      const entry: any = {
        id: idMap[node.rawId],
        type: "organ",
        organId,
        variant,
        content,
        children: [],
      };
      while (stack.length && stack[stack.length - 1].indent >= node.indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1]?.entry;
      parent ? parent.children.push(entry) : rootChildren.push(entry);
      stack.push({ indent: node.indent, entry });
      continue;
    }

    const entry: any = {
      id: idMap[node.rawId],
      type: node.type,
      children: [],
      content: contentMap[node.rawId] ?? {},
    };

    /* ---------- ROLE (Phase 5) ---------- */
    if (node.role) {
      entry.role = node.role;
    }


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
   COMPILE APP (EXPORTED — ADDITIVE)
   Call this from module-system or API to compile an app folder.
   appPath: absolute path to folder containing blueprint.txt + content.txt.
============================================================ */
export function compileApp(appPath: string): void {
  const blueprintPath = path.join(appPath, "blueprint.txt");
  if (!fs.existsSync(blueprintPath)) {
    throw new Error(`No blueprint.txt at ${appPath}`);
  }
  const blueprintText = fs.readFileSync(blueprintPath, "utf8");
  const contentPath = path.join(appPath, "content.txt");
  const contentText = fs.existsSync(contentPath)
    ? fs.readFileSync(contentPath, "utf8")
    : "";

  const organIndex = loadOrganIndex();
  const rawNodes = parseBlueprint(blueprintText);
  validateOrganNodes(rawNodes, organIndex);
  const contentMap = parseContent(contentText);
  const manifest = generateContentManifest(rawNodes, appPath, organIndex);
  validateContentKeys(contentMap, manifest, rawNodes);
  const children = buildTree(rawNodes, contentMap, organIndex);

  const output = {
    id: SCREEN_ROOT_ID,
    type: "screen",
    state: { currentView: DEFAULT_VIEW },
    children,
  };

  fs.writeFileSync(path.join(appPath, "app.json"), JSON.stringify(output, null, 2));
}

/* ============================================================
   MAIN (CLI)
============================================================ */
async function run() {
  let appPath: string;

  // Optional non-interactive: node blueprint.ts <category>/<app> (e.g. apps/journal_track)
  const relativePath = process.argv[2];
  let cat: string;
  let app: string;
  if (relativePath) {
    const parts = relativePath.replace(/\\/g, "/").split("/");
    cat = parts[0] ?? "";
    app = parts[1] ?? "";
    appPath = path.isAbsolute(relativePath)
      ? path.resolve(relativePath)
      : path.join(APPS_ROOT, relativePath);
    if (!fs.existsSync(path.join(appPath, "blueprint.txt"))) {
      console.error("No blueprint.txt at", appPath);
      process.exit(1);
    }
  } else {
    const categories = listDirs(APPS_ROOT);
    categories.forEach((c, i) => console.log(`${i + 1}. ${c}`));


    cat = categories[(+await prompt("Choose folder number: ")) - 1];
    if (!cat) process.exit(1);


    const catPath = path.join(APPS_ROOT, cat);


    const apps = listDirs(catPath).filter(a =>
      fs.existsSync(path.join(catPath, a, "blueprint.txt"))
    );


    apps.forEach((a, i) => console.log(`${i + 1}. ${a}`));


    app = apps[(+await prompt("Choose app number: ")) - 1];
    if (!app) process.exit(1);


    appPath = path.join(catPath, app);
  }

  compileApp(appPath);
  console.log("✅ app.json generated (Blueprint-only structure)");
}

const isMain = typeof require !== "undefined" && require.main === module;
if (isMain) run();

