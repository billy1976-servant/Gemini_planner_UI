/**
 * Structural validation for LandingDeckV1 JSON (CI / `npm run deck:check`).
 * Does not validate URLs, media paths, or palette ids.
 */

import { LANDING_LAYOUT_IDS } from "@/lib/landing-layout-catalog";
import type { LandingDeckButtonBlock, LandingDeckScreen, LandingDeckV1 } from "@/lib/landing-deck/schema";

export type DeckValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

const LAYOUT_SET = new Set<string>(LANDING_LAYOUT_IDS as readonly string[]);

function walkthroughInputIds(screen: LandingDeckScreen): Set<string> {
  const ids = new Set<string>();
  for (const input of screen.walkthrough?.inputs ?? []) {
    if (input?.id) ids.add(input.id);
  }
  return ids;
}

/** Buttons that hero allows: link (first only in practice), goto — not next/back in loop */
function screenUsesDisallowedButtonsForLayout(
  layout: string,
  buttons: LandingDeckButtonBlock[]
): LandingDeckButtonBlock[] {
  const bad: LandingDeckButtonBlock[] = [];
  if (layout === "hero") {
    for (const b of buttons) {
      if (b.type === "next" || b.type === "back") bad.push(b);
    }
  }
  if (layout === "textOnly") {
    for (const b of buttons) {
      if (b.type === "next" || b.type === "back" || b.type === "goto") bad.push(b);
    }
  }
  return bad;
}

/**
 * Validate a parsed deck object. Pass unknown from JSON.parse after a typeof object check.
 */
export function validateLandingDeck(deck: unknown, opts?: { pathLabel?: string }): DeckValidationIssue[] {
  const label = opts?.pathLabel ?? "deck";
  const issues: DeckValidationIssue[] = [];

  if (deck == null || typeof deck !== "object" || Array.isArray(deck)) {
    issues.push({ path: label, message: "Root must be a JSON object.", severity: "error" });
    return issues;
  }

  const d = deck as Partial<LandingDeckV1>;
  if (!Array.isArray(d.screens) || d.screens.length === 0) {
    issues.push({ path: `${label}.screens`, message: "`screens` must be a non-empty array.", severity: "error" });
    return issues;
  }

  const screens = d.screens as LandingDeckScreen[];
  const ids = screens.map((s) => s?.id).filter((id): id is string => typeof id === "string");
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        issues.push({ path: `${label}.screens`, message: `Duplicate screen id: "${id}".`, severity: "error" });
      }
      seen.add(id);
    }
  }

  screens.forEach((screen, idx) => {
    const p = `${label}.screens[${idx}]`;
    if (!screen || typeof screen !== "object") {
      issues.push({ path: p, message: "Screen must be an object.", severity: "error" });
      return;
    }
    if (typeof screen.id !== "string" || !screen.id.trim()) {
      issues.push({ path: `${p}.id`, message: "Screen id must be a non-empty string.", severity: "error" });
    }
    const layout = typeof screen.layout === "string" ? screen.layout : "";
    if (!layout) {
      issues.push({ path: `${p}.layout`, message: "layout is required.", severity: "error" });
    } else if (!LAYOUT_SET.has(layout)) {
      issues.push({
        path: `${p}.layout`,
        message: `Unknown layout "${layout}". Expected one of: ${LANDING_LAYOUT_IDS.join(", ")}.`,
        severity: "error",
      });
    }

    if (!Array.isArray(screen.content)) {
      issues.push({ path: `${p}.content`, message: "`content` must be an array.", severity: "error" });
    }
    if (!Array.isArray(screen.media)) {
      issues.push({ path: `${p}.media`, message: "`media` must be an array.", severity: "error" });
    }
    if (!Array.isArray(screen.buttons)) {
      issues.push({ path: `${p}.buttons`, message: "`buttons` must be an array.", severity: "error" });
    }

    const buttons = (screen.buttons ?? []) as LandingDeckButtonBlock[];
    const disallowed = screenUsesDisallowedButtonsForLayout(layout, buttons);
    if (disallowed.length) {
      issues.push({
        path: `${p}.buttons`,
        message: `Layout "${layout}" does not render these button types: ${disallowed.map((b) => b.type).join(", ")}.`,
        severity: "warn",
      });
    }

    for (let bi = 0; bi < buttons.length; bi++) {
      const b = buttons[bi];
      if (!b || typeof b !== "object") continue;
      if (b.type === "goto" && typeof b.target === "string" && b.target && !idSet.has(b.target)) {
        issues.push({
          path: `${p}.buttons[${bi}].target`,
          message: `goto target "${b.target}" is not a screen id.`,
          severity: "error",
        });
      }
    }

    if (typeof screen.nextScreenId === "string" && screen.nextScreenId && !idSet.has(screen.nextScreenId)) {
      issues.push({
        path: `${p}.nextScreenId`,
        message: `nextScreenId "${screen.nextScreenId}" is not a screen id.`,
        severity: "error",
      });
    }

    const wt = screen.walkthrough;
    if (wt?.gate?.required?.length) {
      const inputIds = walkthroughInputIds(screen);
      for (const req of wt.gate.required) {
        if (!inputIds.has(req)) {
          issues.push({
            path: `${p}.walkthrough.gate.required`,
            message: `gate.required references unknown input id "${req}".`,
            severity: "error",
          });
        }
      }
    }

    const pres = screen.presentation;
    if (pres?.reveal === "custom" && Array.isArray(pres.revealSequence)) {
      for (let ri = 0; ri < pres.revealSequence.length; ri++) {
        const key = pres.revealSequence[ri];
        if (typeof key !== "string" || !/^block:\d+$/.test(key)) {
          issues.push({
            path: `${p}.presentation.revealSequence[${ri}]`,
            message: `Invalid reveal key "${key}" (expected block:0, block:1, …).`,
            severity: "error",
          });
        }
      }
    }

    const modes = screen.modes;
    if (Array.isArray(modes)) {
      for (let mi = 0; mi < modes.length; mi++) {
        const m = modes[mi];
        if (m !== "short" && m !== "long") {
          issues.push({
            path: `${p}.modes[${mi}]`,
            message: `Invalid mode "${String(m)}" (expected "short" or "long").`,
            severity: "error",
          });
        }
      }
    }
  });

  return issues;
}

export function formatValidationReport(issues: DeckValidationIssue[]): string {
  if (issues.length === 0) return "OK: no issues.\n";
  return issues
    .map((i) => `${i.severity.toUpperCase()} ${i.path}: ${i.message}`)
    .join("\n");
}
