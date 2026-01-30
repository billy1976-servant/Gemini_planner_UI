/**
 * Legacy → Canonical behavior normalization (Phase 2)
 *
 * This module does NOT execute behavior.
 * It converts legacy payloads into contract-shaped intents so the runtime can
 * progressively migrate off `state:*` action names and ad-hoc params.
 */

import type {
  ActionIntent,
  ActionVerb,
  BehaviorIntent,
  InteractionIntent,
  InteractionVerb,
  MutationIntent,
  MutationVerb,
  NavigationIntent,
  NavigationVerb,
} from "./behavior-intent";

const INTERACTION_VERBS: Set<string> = new Set([
  "tap",
  "double",
  "long",
  "drag",
  "scroll",
  "swipe",
]);

const NAVIGATION_VERBS: Set<string> = new Set(["go", "back", "open", "close", "route"]);

const ACTION_VERBS: Set<string> = new Set([
  "crop",
  "filter",
  "frame",
  "layout",
  "motion",
  "overlay",
]);

const MUTATION_VERBS: Set<string> = new Set([
  "append",
  "update",
  "remove",
  "clear",
  "replace",
  "merge",
  "reorder",
  "toggle",
  "increment",
  "decrement",
  "undo",
  "redo",
]);

function isObj(x: any): x is Record<string, any> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function asString(x: any): string | undefined {
  return typeof x === "string" && x.trim() ? x.trim() : undefined;
}

export type NormalizeResult = {
  intent: BehaviorIntent;
  warnings: string[];
  legacy: boolean;
};

/**
 * Normalize legacy behavior objects:
 * - `{ type: "Navigation", params: {...} }`
 * - `{ type: "Interaction", params: {...} }`
 * - `{ type: "Action", params: { name: "state:*" | <verb> } }`
 */
export function normalizeBehaviorPayload(payload: any): NormalizeResult {
  const warnings: string[] = [];

  // Contract-style canonical payloads (already normalized)
  if (isObj(payload) && typeof payload.kind === "string") {
    return { intent: payload as any, warnings, legacy: false };
  }

  if (!isObj(payload)) {
    return {
      intent: { kind: "legacy", description: "Non-object behavior payload", raw: payload },
      warnings: ["Behavior payload is not an object"],
      legacy: true,
    };
  }

  const type = asString(payload.type);
  const params = isObj(payload.params) ? payload.params : {};

  // Navigation (legacy)
  if (type === "Navigation") {
    const verb = asString(params.verb) ?? "go";
    const variant = asString(params.variant);

    const intent: NavigationIntent = {
      kind: "navigation",
      verb: (NAVIGATION_VERBS.has(verb) ? verb : "go") as NavigationVerb,
      variant: (variant as any) ?? undefined,
      args: { ...params },
    };

    if (!NAVIGATION_VERBS.has(verb)) {
      warnings.push(`Unknown navigation verb "${verb}" (defaulting to "go")`);
    }

    return { intent, warnings, legacy: true };
  }

  // Interaction (legacy)
  if (type === "Interaction") {
    const verb = asString(params.verb) ?? "tap";
    const intent: InteractionIntent = {
      kind: "interaction",
      verb: (INTERACTION_VERBS.has(verb) ? verb : "tap") as InteractionVerb,
      variant: asString(params.variant),
      args: { ...params },
    };

    if (!INTERACTION_VERBS.has(verb)) {
      warnings.push(`Unknown interaction verb "${verb}" (defaulting to "tap")`);
    }

    return { intent, warnings, legacy: true };
  }

  // Action (legacy)
  if (type === "Action") {
    const name = asString(params.name);
    if (!name) {
      return {
        intent: { kind: "legacy", description: "Action payload missing params.name", raw: payload },
        warnings: ["Action behavior is missing params.name"],
        legacy: true,
      };
    }

    // Legacy state:* protocol → mutation intent (contract direction)
    if (name.startsWith("state:")) {
      const op = name.replace(/^state:/, "");

      // Normalize common legacy ops into contract mutation verbs
      // NOTE: This is a bridge; Phase 3/4 will enforce strict contract syntax at source.
      const mutationVerb: MutationVerb | undefined = (MUTATION_VERBS.has(op)
        ? op
        : op === "currentView"
        ? "replace"
        : op === "journal.add"
        ? "append"
        : op === "update"
        ? "update"
        : undefined) as any;

      if (!mutationVerb) {
        warnings.push(`Legacy state action "${name}" does not map to a known mutation verb`);
      }

      const intent: MutationIntent = {
        kind: "mutation",
        verb: mutationVerb ?? "update",
        // Provide legacy hints for executor:
        valueFrom: asString(params.valueFrom) as any,
        target: asString(params.target) ?? asString(params.fieldKey) ?? asString(params.key),
        args: { ...params, __legacyActionName: name },
      };

      return { intent, warnings, legacy: true };
    }

    // Contract action verbs (media-domain). Domain inference comes later (Phase 3/4),
    // but we can normalize the verb now.
    if (ACTION_VERBS.has(name)) {
      const intent: ActionIntent = {
        kind: "action",
        domain: asString(params.domain) ?? "image",
        verb: name as ActionVerb,
        args: { ...params },
      };
      return { intent, warnings, legacy: true };
    }

    // Everything else stays legacy (e.g. logic:* engines), but we keep it observable.
    return {
      intent: {
        kind: "legacy",
        description: `Non-contract action name "${name}"`,
        raw: payload,
      },
      warnings: [`Non-contract action name "${name}"`],
      legacy: true,
    };
  }

  return {
    intent: { kind: "legacy", description: `Unknown behavior.type "${String(type)}"`, raw: payload },
    warnings: [`Unknown behavior.type "${String(type)}"`],
    legacy: true,
  };
}

/**
 * Normalize navigation event payloads.
 * Current runtime uses `CustomEvent("navigate", { detail })` with detail shapes:
 * - `{ to: string }` (common)
 * - `{ screenId: string }` (some legacy)
 * - contract-ish `{ verb:"go", variant:"screen", screenId:"..." }` (future)
 */
export function normalizeNavigateDetail(detail: any): NormalizeResult {
  const warnings: string[] = [];
  if (!isObj(detail)) {
    return {
      intent: { kind: "legacy", description: "navigate detail not an object", raw: detail },
      warnings: ["navigate.detail is not an object"],
      legacy: true,
    };
  }

  // Preferred: explicit to
  const to = asString(detail.to) ?? asString(detail.target);
  if (to) {
    const intent: NavigationIntent = {
      kind: "navigation",
      verb: "go",
      variant: "screen",
      args: { to },
    };
    return { intent, warnings, legacy: true };
  }

  // Contract-ish
  const verb = asString(detail.verb);
  if (verb && NAVIGATION_VERBS.has(verb)) {
    const intent: NavigationIntent = {
      kind: "navigation",
      verb: verb as NavigationVerb,
      variant: asString(detail.variant) as any,
      args: { ...detail },
    };
    return { intent, warnings, legacy: false };
  }

  // Legacy: screenId
  const screenId = asString(detail.screenId);
  if (screenId) {
    const intent: NavigationIntent = {
      kind: "navigation",
      verb: "go",
      variant: "screen",
      args: { screenId },
    };
    return { intent, warnings, legacy: true };
  }

  return {
    intent: { kind: "legacy", description: "navigate detail missing destination", raw: detail },
    warnings: ["navigate.detail missing destination (to/screenId)"],
    legacy: true,
  };
}

