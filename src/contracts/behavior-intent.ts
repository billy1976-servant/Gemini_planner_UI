/**
 * Canonical behavior intent model (Phase 2)
 *
 * Goal:
 * - Give the runtime a single, contract-shaped representation of "what to do"
 * - Allow translation from legacy `behavior.type` objects (`Action`/`Navigation`/`Interaction`)
 * - Keep behavior execution separate (listener/engine decides how to run)
 */

export type InteractionVerb =
  | "tap"
  | "double"
  | "long"
  | "drag"
  | "scroll"
  | "swipe";

export type NavigationVerb = "go" | "back" | "open" | "close" | "route";

export type ActionVerb = "crop" | "filter" | "frame" | "layout" | "motion" | "overlay";

export type MutationVerb =
  | "append"
  | "update"
  | "remove"
  | "clear"
  | "replace"
  | "merge"
  | "reorder"
  | "toggle"
  | "increment"
  | "decrement"
  | "undo"
  | "redo";

export type StateScope = "local" | "screen" | "flow" | "global";
export type StateLifetime = "transient" | "session" | "persistent";

export type InteractionIntent = {
  kind: "interaction";
  verb: InteractionVerb;
  variant?: string;
  args?: Record<string, any>;
};

export type NavigationIntent = {
  kind: "navigation";
  verb: NavigationVerb;
  variant?: "screen" | "modal" | "flow" | "panel" | "sheet" | "internal" | "external" | string;
  args?: Record<string, any>;
};

export type ActionIntent = {
  kind: "action";
  domain: "image" | "video" | "audio" | "document" | "canvas" | "map" | "camera" | string;
  verb: ActionVerb;
  args?: Record<string, any>;
};

export type MutationIntent = {
  kind: "mutation";
  verb: MutationVerb;
  scope?: StateScope;
  lifetime?: StateLifetime;
  target?: string; // contract-level state target path (e.g. "journal.think.entry")
  valueFrom?: "input" | "const" | "state";
  value?: any;
  args?: Record<string, any>;
};

export type LegacyIntent = {
  kind: "legacy";
  description: string;
  raw?: any;
};

export type BehaviorIntent =
  | InteractionIntent
  | NavigationIntent
  | ActionIntent
  | MutationIntent
  | LegacyIntent;

