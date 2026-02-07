// src/behavior/behavior-runner.ts
"use client";


import behaviorData from "./behavior.json";

const interactions = behaviorData.interactions;
const navigations = behaviorData.navigations;
import { BehaviorEngine } from "./behavior-engine";
import { resolveBehaviorVerb } from "./behavior-verb-resolver";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";


/**
 * Resolve the "variant" for nested navigation verbs based on args.
 * This honors your contract: Verb + Variant -> Handler.
 */
function resolveNavVariant(action: string, args: any): string | undefined {
  if (!args || typeof args !== "object") return undefined;


  // Allow explicit variant if JSON provides it
  const explicit =
    args.variant ||
    args.navVariant ||
    args.subverb ||
    args.mode ||
    args.kind ||
    args.type ||
    args.targetType;


  if (typeof explicit === "string" && explicit) return explicit;


  // Infer by presence of known params (stable + minimal)
  switch (action) {
    case "go": {
      if (args.screenId || args.screen || args.toScreen) return "screen";
      if (args.modalId || args.modal || args.toModal) return "modal";
      if (args.flowId || args.flow || args.toFlow) return "flow";
      return undefined;
    }


    case "open": {
      if (args.panelId || args.panel) return "panel";
      if (args.sheetId || args.sheet) return "sheet";
      return undefined;
    }


    case "close": {
      if (args.panelId || args.panel) return "panel";
      if (args.sheetId || args.sheet) return "sheet";
      return undefined;
    }


    case "route": {
      if (args.path) return "internal";
      if (args.url) return "external";
      return undefined;
    }


    case "back": {
      // If your JSON supplies one/all/root explicitly, honor it
      if (args.one === true) return "one";
      if (args.all === true) return "all";
      if (args.root === true) return "root";


      // If a count is supplied, treat 1 as back.one
      if (args.count === 1) return "one";


      return undefined;
    }


    default:
      return undefined;
  }
}


function fireNavigation(ctx: any, target: any) {
  if (!target) return;


  // Prefer single navigate() so semantic targets (back:1, root, panel:close) reach the callback
  if (typeof ctx?.navigate === "function") return ctx.navigate(target);
  if (typeof ctx?.setScreen === "function") return ctx.setScreen(target);
  if (typeof ctx?.router?.push === "function") return ctx.router.push(target);


  console.warn(
    "⚠️ Navigation target resolved but no ctx navigation hook found:",
    target
  );
}


export function runBehavior(
  domain: string,
  action: string,
  ctx: any = {},
  args: any = {}
) {
  // 1) Resolve ACTION via universal verb resolver (media primitives OR flat verbs)
  const fromAction = resolveBehaviorVerb(domain as any, action);


  // 2) Resolve INTERACTION (flat or variant map: drag, scroll, swipe)
  let fromInteraction: { handler: string } | null = null;
  const interactionEntry = (interactions as any)?.[action];
  if (interactionEntry) {
    if (typeof interactionEntry === "string") {
      fromInteraction = { handler: interactionEntry };
    } else if (interactionEntry && typeof interactionEntry === "object") {
      const variant =
        args?.variant ||
        args?.direction ||
        args?.mode ||
        "default";
      const handlerName =
        interactionEntry[variant] || interactionEntry.default;
      if (typeof handlerName === "string") {
        fromInteraction = { handler: handlerName };
      } else {
        console.warn("⚠️ Interaction missing variant:", {
          action,
          variant,
          args,
        });
      }
    }
  }


  // 3) Resolve NAVIGATION (nested: verb + variant)
  let fromNavigation: any = null;


  if (domain === "navigation" || domain === "navigate") {
    const verb = action;
    const variant = resolveNavVariant(verb, args);


    if (variant && (navigations as any)?.[verb]?.[variant]) {
      fromNavigation = { handler: (navigations as any)[verb][variant] };
    } else {
      // Helpful diagnostics (keeps it obvious when JSON is missing a required key)
      if (!variant) {
        console.warn("⚠️ Navigation missing variant:", { verb, args });
      } else {
        console.warn("⚠️ Navigation verb/variant not mapped:", { verb, variant });
      }
    }
  }


  const map = fromAction || fromInteraction || fromNavigation;
  const source = fromAction ? "fromAction" : fromInteraction ? "fromInteraction" : "fromNavigation";
  if (!map) {
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "behavior-runner",
      decisionType: "behavior-dispatch",
      inputsSeen: { domain, action, argsKeys: args ? Object.keys(args) : [] },
      ruleApplied: "no map (fromAction | fromInteraction | fromNavigation)",
      decisionMade: null,
      downstreamEffect: "none",
    });
    console.warn("⚠️ No behavior found:", { domain, action, args });
    return;
  }


  const handlerName = map.handler;
  logRuntimeDecision({
    timestamp: Date.now(),
    engineId: "behavior-runner",
    decisionType: "behavior-dispatch",
    inputsSeen: { domain, action, argsKeys: args ? Object.keys(args) : [] },
    ruleApplied: source,
    decisionMade: { handlerName },
    downstreamEffect: "invoke handler",
  });
  console.log("✔ Behavior Triggered:", { domain, action, handlerName, args });


  const fn = (BehaviorEngine as any)?.[handlerName];
  if (!fn) {
    console.warn("⚠️ Handler not implemented:", handlerName);
    return;
  }


  // Pass ctx into the engine (required for navigation handlers)
  const result = fn.length >= 2 ? fn(ctx, args) : fn(args, ctx);


  // If navigation is declared, execute it (supports: result.target OR args.target)
  if (domain === "navigate" || domain === "navigation") {
    fireNavigation(ctx, result?.target ?? args?.target);
  }


  return result;
}


export default runBehavior;


