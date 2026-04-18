/**
 * Universal TXT authoring: blueprint.txt + content.txt parser surface.
 * Used by the legacy `compileApp` compiler and by target profiles (e.g. Learn bridge).
 */

export type RawNode = {
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
  organId?: string;
  variant?: string;
  nodeId?: string;
  aliasNames?: string[];
};

export type ParseBlueprintResult = {
  nodes: RawNode[];
  sequenceOrder: string[] | null;
};

/**
 * Normalize legacy / mistaken ids like `S1.0` → `1.0` (single letter prefix + dotted number).
 * Plain numeric ids pass through. Returns null if the token cannot be normalized.
 */
export function normalizeTxtAuthoringRawId(token: string): string | null {
  const t = token.trim();
  const prefixed = /^([A-Za-z])([\d.]+)$/.exec(t);
  if (prefixed) return prefixed[2];
  if (/^[\d.]+$/.test(t)) return t;
  return null;
}

/** 🔒 Canonical: NO LOWER-CASING */
export function slugify(name: string): string {
  return "|" + name.replace(/[^a-zA-Z0-9]+/g, "");
}

export function slugifyId(nodeId: string): string {
  return "|" + nodeId.replace(/[^a-zA-Z0-9]+/g, "");
}

export function buildIdMaps(nodes: RawNode[]): {
  idMap: Record<string, string>;
  rawByName: Record<string, string>;
  targetToRaw: Record<string, string>;
} {
  const idMap: Record<string, string> = {};
  const rawByName: Record<string, string> = {};
  const targetToRaw: Record<string, string> = {};
  for (const n of nodes) {
    const id = n.nodeId ? slugifyId(n.nodeId) : slugify(n.name);
    idMap[n.rawId] = id;
    rawByName[n.name] = n.rawId;
    targetToRaw[n.rawId] = n.rawId;
    targetToRaw[n.name] = n.rawId;
    if (n.nodeId) targetToRaw[slugifyId(n.nodeId)] = n.rawId;
    if (n.aliasNames) for (const a of n.aliasNames) targetToRaw[a] = n.rawId;
  }
  return { idMap, rawByName, targetToRaw };
}

/** First column before `|` on a node line: optional letter + dotted number (e.g. S1.0 or 1.2.3). */
const RAW_ID_LEX = "([A-Za-z]?[\\d.]+)";

export function parseBlueprint(text: string): ParseBlueprintResult {
  const lines = text.split("\n");
  const nodes: RawNode[] = [];
  let last: RawNode | null = null;
  let sequenceOrder: string[] | null = null;
  let inSequenceBlock = false;

  const nodeLineStart = new RegExp(`^${RAW_ID_LEX}\\s*\\|`);

  for (const line of lines) {
    if (!line.trim()) {
      if (inSequenceBlock) inSequenceBlock = false;
      continue;
    }
    if (line.startsWith("APP:")) continue;

    if (line.trim().match(/^SEQUENCE:\s*$/i)) {
      inSequenceBlock = true;
      sequenceOrder = [];
      continue;
    }
    if (inSequenceBlock) {
      if (nodeLineStart.test(line.trim())) {
        inSequenceBlock = false;
      } else {
        sequenceOrder!.push(...line.split(",").map((s) => s.trim()).filter(Boolean));
        continue;
      }
    }

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

    const idMatch = line.trim().match(/^@id\s*\(?([^)\s]+)\)?\s*$/i);
    if (idMatch && last) {
      last.nodeId = idMatch[1].trim();
      continue;
    }
    const aliasesMatch = line.trim().match(/^@aliases\s*\(([^)]+)\)\s*$/i);
    if (aliasesMatch && last) {
      last.aliasNames = aliasesMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }

    const organMatch = line
      .trim()
      .match(new RegExp(`^${RAW_ID_LEX}\\s*\\|\\s*(.+?)\\s*\\|\\s*organ:(\\w+)(?:\\s*\\[([^\\]]*)\\])?$`));
    if (organMatch) {
      const [, rawFrag, name, organId, slotsRaw] = organMatch;
      const rawId = normalizeTxtAuthoringRawId(rawFrag);
      if (!rawId) continue;
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

    const match = line
      .trim()
      .match(
        new RegExp(
          `^${RAW_ID_LEX}\\s*\\|\\s*(.+?)\\s*\\|\\s*(\\w+)(?:\\s*\\[([^\\]]*)\\])?(?:\\s*\\(([^)]+)\\))?(?:\\s*@id\\s*\\(([^)]+)\\))?(?:\\s*@aliases\\s*\\(([^)]+)\\))?`
        )
      );
    if (!match) continue;

    const [, rawFrag, name, type, slotsRaw, behaviorTokenRaw, nodeIdInline, aliasesInline] = match as unknown as [
      string,
      string,
      string,
      string,
      string | undefined,
      string | undefined,
      string | undefined,
      string | undefined,
    ];

    const rawId = normalizeTxtAuthoringRawId(rawFrag);
    if (!rawId) continue;

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

    const nodeId = typeof nodeIdInline === "string" && nodeIdInline.trim() ? nodeIdInline.trim() : undefined;
    const aliasNames =
      typeof aliasesInline === "string" && aliasesInline.trim()
        ? aliasesInline.split(",").map((s: string) => s.trim()).filter(Boolean)
        : undefined;

    nodes.push({ indent, rawId, name, type, slots, behaviorToken, nodeId, aliasNames });
    last = nodes[nodes.length - 1];
  }

  return { nodes, sequenceOrder: sequenceOrder?.length ? sequenceOrder : null };
}

export function parseContent(text: string): Record<string, Record<string, string>> {
  const lines = text.split("\n");
  const content: Record<string, Record<string, string>> = {};
  let current: string | null = null;

  const parseScalar = (raw: string) => raw.replace(/^"(.*)"$/, "$1");

  const headerRe = new RegExp(`^${RAW_ID_LEX}\\s*(.*)$`);

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;

    const header = line.match(headerRe);
    if (header) {
      const rawFrag = header[1];
      const norm = normalizeTxtAuthoringRawId(rawFrag);
      if (!norm) continue;
      current = norm;
      content[current] = content[current] ?? {};
      continue;
    }

    if (!current) continue;

    const kv = line.match(/^(-+\s*)?([\w.]+)\s*:\s*(.*)$/);
    if (!kv) continue;

    content[current][kv[2]] = parseScalar(kv[3]);
  }

  return content;
}
