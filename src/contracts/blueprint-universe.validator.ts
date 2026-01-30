/**
 * HIcurv Blueprint Universe v1.0 — WARN-ONLY CONTRACT VALIDATOR
 * -------------------------------------------------------------
 * Purpose:
 * - Detect drift between the locked contract and the current runtime/compiler
 * - Never block rendering (warn-only)
 * - Deduplicate warnings to avoid console spam
 *
 * IMPORTANT:
 * - This validator is intentionally conservative.
 * - It focuses on high-signal contract violations:
 *   - forbidden behaviors on non-actionable molecules
 *   - non-contract action names (e.g. "state:*")
 *   - state declared directly on nodes
 *   - invalid variant/size values for known molecules
 *   - content type mismatches for common keys
 */
/* eslint-disable no-console */

export type ContractViolation = {
  code:
    | "STATE_DECLARED_IN_TREE"
    | "UNKNOWN_MOLECULE_TYPE"
    | "INVALID_VARIANT"
    | "INVALID_SIZE"
    | "FORBIDDEN_BEHAVIOR_ON_MOLECULE"
    | "FORBIDDEN_BEHAVIOR_KIND"
    | "NON_CONTRACT_ACTION_NAME"
    | "INVALID_NAVIGATION_VERB"
    | "INVALID_INTERACTION_VERB"
    | "INVALID_ACTION_VERB"
    | "MISSING_REQUIRED_CONTENT_KEY"
    | "EMPTY_CONTENT_OBJECT"
    | "CONTENT_SHAPE_MISMATCH"
    | "CONTENT_TYPE_MISMATCH";
  path: string;
  message: string;
  nodeType?: string;
  nodeId?: string;
  details?: Record<string, any>;
};

type ValidateOptions = {
  source?: string; // "runtime" | "blueprint-cli" | etc
  maxWarnings?: number;
  dedupeKeyPrefix?: string;
};

const MOLECULES = [
  "button",
  "avatar",
  "card",
  "chip",
  "field",
  "list",
  "modal",
  "section",
  "footer",
  "stepper",
  "toast",
  "toolbar",
] as const;
type Molecule = (typeof MOLECULES)[number];

const MOLECULE_VARIANTS: Record<Molecule, string[]> = {
  button: ["filled", "tonal", "outlined", "text", "icon"],
  avatar: ["circle", "square"],
  card: ["elevated", "outlined"],
  chip: ["elevated", "outlined"],
  field: ["outlined", "filled"],
  list: ["plain", "padded", "dropdown"],
  modal: ["centered", "bottomSheet"],
  section: ["standard", "subtle"],
  footer: ["standard", "dense"],
  stepper: ["primary", "line"],
  toast: ["info", "error"],
  toolbar: ["info", "error"],
};

const MOLECULE_SIZES: Record<Molecule, string[]> = {
  button: ["sm", "md", "lg"],
  avatar: ["sm", "md"],
  card: ["sm", "md", "lg"],
  chip: ["sm", "md", "lg"],
  field: ["sm", "md"],
  list: ["sm", "md"],
  modal: ["md", "lg"],
  section: ["sm", "md", "lg"],
  footer: ["sm", "md"],
  stepper: ["sm", "md"],
  toast: ["sm", "md"],
  toolbar: ["sm", "md"],
};

// Actionable for Interaction/Navigation tokens (per contract’s “actionable molecules” list)
// MOLECULE_CONTRACT: Button, Card, Chip, Footer, List, Stepper, Toast, Toolbar may have behavior; Section, Avatar, Field may not.
const ACTIONABLE_MOLECULES = new Set<Molecule>([
  "button",
  "chip",
  "list",
  "toolbar",
  "footer",
  "stepper",
  "toast",
]);

// Structural/non-actionable molecules (per contract: no behavior except Field state.bind)
const NON_INTERACTIVE_MOLECULES = new Set<Molecule>([
  "section",
  "field",
  "avatar",
]);

/**
 * Contract reconciliation for Card:
 * - "Card → Behavior: none" appears in the molecule table / non-interactive list
 * - but the outline example shows Card with action verbs (crop/filter/...) and interaction-like verbs (swipe/drag)
 *
 * For WARN-ONLY mode we enforce a minimal, reconciling rule:
 * - Card may only carry Action verbs from the Action universe (crop/filter/frame/layout/motion/overlay)
 * - Card may NOT carry Interaction or Navigation behaviors
 */
const CARD_ACTIONS_ONLY = true;

// Modal: close only (contract)
function isCloseBehavior(behavior: any): boolean {
  if (!behavior || typeof behavior !== "object") return false;
  // Navigation close (contract verb universe includes "close")
  if (behavior.type === "Navigation") {
    const verb = behavior?.params?.verb;
    return verb === "close";
  }
  // Sometimes close is expressed as an action name; treat literal "close" as acceptable.
  if (behavior.type === "Action") {
    const name = behavior?.params?.name;
    return name === "close";
  }
  return false;
}

const INTERACTION_VERBS = new Set([
  "tap",
  "double",
  "long",
  "drag",
  "scroll",
  "swipe",
]);

const NAVIGATION_VERBS = new Set(["go", "back", "open", "close", "route"]);

const ACTION_VERBS = new Set([
  "crop",
  "filter",
  "frame",
  "layout",
  "motion",
  "overlay",
]);

function requiredContentKeysForMolecule(m: Molecule): string[] {
  // Contract-required keys (independent of outline slot intersection).
  // We warn when missing because your “content derivation system” requires explicit keys (empty "" is allowed).
  switch (m) {
    case "button":
      return ["label"];
    case "avatar":
      return ["media"]; // text optional
    case "chip":
      return ["title"]; // body/media optional
    case "field":
      return ["label"]; // error optional; input is state-driven but appears in your content file patterns
    case "list":
      return ["items"];
    case "stepper":
      return ["steps"];
    case "toast":
      return ["message"];
    case "toolbar":
      return ["actions"];
    case "modal":
      return ["title", "body"];
    case "section":
      // Section [none] is allowed; title is optional
      return [];
    case "footer":
      return ["left", "right"];
    case "card":
      // Title/body/media are optional depending on outline tokens; don't require here.
      return [];
  }
}

function normalizeType(t: any): string | undefined {
  if (typeof t !== "string") return undefined;
  return t.trim().toLowerCase();
}

function isPlainObject(x: any) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function summarizeBehavior(behavior: any) {
  if (!behavior || typeof behavior !== "object") return null;
  const type = behavior.type;
  const params = behavior.params ?? {};
  if (type === "Navigation") return { type, verb: params.verb, variant: params.variant };
  if (type === "Interaction") return { type, verb: params.verb, variant: params.variant };
  if (type === "Action") return { type, name: params.name };
  return { type };
}

function contentKeyTypeRuleForMolecule(m: Molecule): Record<string, "string" | "array" | "object"> {
  // This is contract-derived and intentionally minimal; it checks the highest-signal keys.
  switch (m) {
    case "button":
      return { label: "string" };
    case "avatar":
      return { media: "string", text: "string" };
    case "card":
      return { title: "string", body: "string", media: "string" };
    case "chip":
      return { title: "string", body: "string", media: "string" };
    case "field":
      return { label: "string", input: "string", error: "string" };
    case "list":
      return { items: "array" };
    case "modal":
      return { title: "string", body: "string" };
    case "section":
      return { title: "string" };
    case "footer":
      // Your contract has conflicting footer content shapes; the later binding section says left/right objects.
      return { left: "object", right: "object" };
    case "stepper":
      // Contract says content.steps (array of {label})
      return { steps: "array" };
    case "toast":
      return { message: "string" };
    case "toolbar":
      // Contract says actions nodes array
      return { actions: "array" };
  }
}

function validateNode(node: any, path: string, out: ContractViolation[]) {
  if (!node || typeof node !== "object") return;

  const nodeTypeRaw = node.type;
  const nodeType = normalizeType(nodeTypeRaw);
  const nodeId = typeof node.id === "string" ? node.id : undefined;

  // State must not be declared in-tree (contract)
  if (node.state !== undefined) {
    out.push({
      code: "STATE_DECLARED_IN_TREE",
      path,
      nodeType: typeof nodeTypeRaw === "string" ? nodeTypeRaw : undefined,
      nodeId,
      message:
        "Contract violation: state must not be declared directly in the tree (state exists only as behavior targets).",
      details: { state: node.state },
    });
  }

  // Only validate molecules against universe rules
  const isMolecule = nodeType ? (MOLECULES as readonly string[]).includes(nodeType) : false;
  if (!isMolecule) {
    // Not a molecule (atoms/layout/root/etc.) → ignore for now (warn-only validator is molecule-scoped).
  } else {
    const m = nodeType as Molecule;

    // Variant/size checks (if explicitly present)
    if (node.variant !== undefined) {
      const v = normalizeType(node.variant);
      if (!v || !MOLECULE_VARIANTS[m].includes(v)) {
        out.push({
          code: "INVALID_VARIANT",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Invalid variant "${String(node.variant)}" for molecule "${m}".`,
          details: { allowed: MOLECULE_VARIANTS[m] },
        });
      }
    }

    if (node.size !== undefined) {
      const s = normalizeType(node.size);
      if (!s || !MOLECULE_SIZES[m].includes(s)) {
        out.push({
          code: "INVALID_SIZE",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Invalid size "${String(node.size)}" for molecule "${m}".`,
          details: { allowed: MOLECULE_SIZES[m] },
        });
      }
    }

    // Behavior permission checks
    const hasBehavior = node.behavior && isPlainObject(node.behavior) && Object.keys(node.behavior).length > 0;
    if (hasBehavior) {
      if (NON_INTERACTIVE_MOLECULES.has(m)) {
        out.push({
          code: "FORBIDDEN_BEHAVIOR_ON_MOLECULE",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Contract violation: molecule "${m}" must not carry behavior.`,
          details: { behavior: summarizeBehavior(node.behavior) },
        });
      }

      // Card: actions-only (see comment above)
      if (m === "card" && CARD_ACTIONS_ONLY) {
        const bt = node.behavior?.type;
        if (bt === "Navigation" || bt === "Interaction") {
          out.push({
            code: "FORBIDDEN_BEHAVIOR_ON_MOLECULE",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Contract violation: Card may not carry ${bt} behavior (actions-only).`,
            details: { behavior: summarizeBehavior(node.behavior) },
          });
        }
      }

      if (m === "modal" && !isCloseBehavior(node.behavior)) {
        out.push({
          code: "FORBIDDEN_BEHAVIOR_ON_MOLECULE",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Contract violation: Modal may only have "close" behavior.`,
          details: { behavior: summarizeBehavior(node.behavior) },
        });
      }

      // Kind-level checks (warn-only): Action is not part of the “actionable molecule” interaction/navigation list.
      const bType = node.behavior?.type;
      if (bType === "Action") {
        // Non-contract "state:*" is common in current repo; flag explicitly.
        const name = node.behavior?.params?.name;
        if (typeof name === "string" && name.startsWith("state:")) {
          out.push({
            code: "NON_CONTRACT_ACTION_NAME",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Non-contract action name "${name}". Contract actions must be one of: ${Array.from(
              ACTION_VERBS
            ).join(", ")} (domain inferred).`,
            details: { name },
          });
        } else if (typeof name === "string" && !ACTION_VERBS.has(name)) {
          out.push({
            code: "INVALID_ACTION_VERB",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Action verb "${name}" is not in the contract Action universe.`,
            details: { allowed: Array.from(ACTION_VERBS) },
          });
        }

        // Card-only action semantics (warn-only): flag Action on other molecules as drift.
        if (m !== "card" && typeof name === "string" && ACTION_VERBS.has(name)) {
          out.push({
            code: "FORBIDDEN_BEHAVIOR_ON_MOLECULE",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Contract drift: Action verb "${name}" is being used on "${m}". Contract examples show Action verbs on Card (media) only.`,
            details: { behavior: summarizeBehavior(node.behavior) },
          });
        }
      } else if (bType === "Navigation") {
        const verb = node.behavior?.params?.verb;
        if (typeof verb === "string" && !NAVIGATION_VERBS.has(verb)) {
          out.push({
            code: "INVALID_NAVIGATION_VERB",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Navigation verb "${verb}" is not in the contract Navigation universe.`,
            details: { allowed: Array.from(NAVIGATION_VERBS) },
          });
        }
        // If a non-actionable molecule somehow has nav behavior, we already warned above.
        // If an actionable molecule uses nav, that's fine.
      } else if (bType === "Interaction") {
        const verb = node.behavior?.params?.verb;
        if (typeof verb === "string" && !INTERACTION_VERBS.has(verb)) {
          out.push({
            code: "INVALID_INTERACTION_VERB",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Interaction verb "${verb}" is not in the contract Interaction universe.`,
            details: { allowed: Array.from(INTERACTION_VERBS) },
          });
        }
      } else if (bType) {
        out.push({
          code: "FORBIDDEN_BEHAVIOR_KIND",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Unknown/unsupported behavior kind "${String(bType)}" (expected Navigation | Interaction | Action).`,
          details: { behavior: summarizeBehavior(node.behavior) },
        });
      }

      // If an actionable molecule carries behavior but is not in ACTIONABLE_MOLECULES, warn.
      // (Modal/Card/Field/Section handled above; this catches drift if universe expands accidentally.)
      if (!ACTIONABLE_MOLECULES.has(m) && !NON_INTERACTIVE_MOLECULES.has(m) && m !== "modal" && m !== "card") {
        out.push({
          code: "FORBIDDEN_BEHAVIOR_ON_MOLECULE",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message: `Molecule "${m}" is not listed as actionable in the contract but carries behavior.`,
          details: { behavior: summarizeBehavior(node.behavior) },
        });
      }
    }

    // Content type checks (best-effort, warn-only)
    const content = node.content;
    if (content !== undefined && content !== null && !isPlainObject(content)) {
      out.push({
        code: "CONTENT_SHAPE_MISMATCH",
        path,
        nodeType: nodeTypeRaw,
        nodeId,
        message: `Content must be an object when present (got ${Array.isArray(content) ? "array" : typeof content}).`,
      });
    } else if (isPlainObject(content)) {
      // Warn on empty content objects for renderable molecules (your contract says this produces blank UI).
      // This is not "invalid" in runtime terms, but it is a contract drift signal for the generator pipeline.
      if (Object.keys(content).length === 0 && m !== "section") {
        out.push({
          code: "EMPTY_CONTENT_OBJECT",
          path,
          nodeType: nodeTypeRaw,
          nodeId,
          message:
            "Content object is empty. Per contract, renderable molecules must receive content keys (empty string values allowed) or the UI will be blank.",
        });
      }

      // Required keys (warn-only)
      const requiredKeys = requiredContentKeysForMolecule(m);
      for (const key of requiredKeys) {
        if (!(key in content)) {
          out.push({
            code: "MISSING_REQUIRED_CONTENT_KEY",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Missing required content key "${key}" for molecule "${m}" (contract)`,
            details: { requiredKeys },
          });
        }
      }

      const rules = contentKeyTypeRuleForMolecule(m);
      for (const [key, expected] of Object.entries(rules)) {
        if (!(key in content)) continue; // contract also permits omission depending on outline slots
        const value = (content as any)[key];
        if (value === undefined || value === null) continue;
        const actual =
          Array.isArray(value) ? "array" : isPlainObject(value) ? "object" : typeof value;
        if (expected !== actual) {
          out.push({
            code: "CONTENT_TYPE_MISMATCH",
            path,
            nodeType: nodeTypeRaw,
            nodeId,
            message: `Content key "${key}" must be ${expected} (got ${actual}).`,
            details: { key, expected, actual },
          });
        }
      }
    }
  }

  // Recurse
  const children = node.children;
  if (Array.isArray(children)) {
    children.forEach((child, i) => validateNode(child, `${path}.children[${i}]`, out));
  }
}

export function validateBlueprintTree(root: any): ContractViolation[] {
  const out: ContractViolation[] = [];
  validateNode(root, "$", out);
  return out;
}

function getDedupeSet(prefix: string) {
  const g = globalThis as any;
  const key = "__HICURV_CONTRACT_WARN_DEDUPE__";
  if (!g[key]) g[key] = new Map<string, Set<string>>();
  const map: Map<string, Set<string>> = g[key];
  if (!map.has(prefix)) map.set(prefix, new Set<string>());
  return map.get(prefix)!;
}

export function warnBlueprintViolations(root: any, opts: ValidateOptions = {}) {
  const source = opts.source ?? "unknown";
  const maxWarnings = opts.maxWarnings ?? 50;
  const dedupePrefix = opts.dedupeKeyPrefix ?? source;

  const violations = validateBlueprintTree(root);
  if (!violations.length) return;

  const dedupe = getDedupeSet(dedupePrefix);
  let emitted = 0;

  for (const v of violations) {
    const dedupeKey = `${v.code}|${v.path}|${v.nodeType ?? ""}|${v.message}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    if (emitted === 0) {
      console.groupCollapsed(
        `[ContractValidator][${source}] ${violations.length} contract violation(s) detected`
      );
    }

    console.warn(
      `[ContractValidator][${v.code}] ${v.path} ${v.nodeType ? `(${v.nodeType})` : ""} - ${v.message}`,
      v.details ?? {}
    );

    emitted++;
    if (emitted >= maxWarnings) {
      console.warn(
        `[ContractValidator] Warning cap reached (${maxWarnings}). Remaining violations are suppressed.`
      );
      break;
    }
  }

  if (emitted > 0) {
    console.groupEnd();
  }
}

