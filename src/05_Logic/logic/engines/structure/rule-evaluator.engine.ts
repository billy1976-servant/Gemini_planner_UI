/**
 * Rule evaluator — when/then conditions and derived values. Pure; no state.
 */

import type { ResolvedRuleset, RuleContext, RuleMatch, WhenClause } from "./structure.types";

/**
 * Evaluate a single when clause against context (e.g. date equals, item.categoryId in list).
 */
export function evaluateCondition(when: WhenClause, context: RuleContext): boolean {
  if (!when || typeof when !== "object") return true;
  for (const [key, raw] of Object.entries(when)) {
    if (key.startsWith("$")) continue;
    const ctxVal = (context as Record<string, unknown>)[key];
    if (raw === null || raw === undefined) {
      if (ctxVal != null) return false;
      continue;
    }
    if (typeof raw === "object" && raw !== null && "equals" in (raw as object)) {
      const v = (raw as { equals: unknown }).equals;
      if (ctxVal !== v) return false;
      continue;
    }
    if (ctxVal !== raw) return false;
  }
  return true;
}

/**
 * Evaluate rule set: return matched rules and derived key/values from then clauses.
 */
export function evaluateRules(
  ruleSet: ResolvedRuleset,
  context: RuleContext
): { matched: RuleMatch[]; derived: Record<string, unknown> } {
  const matched: RuleMatch[] = [];
  const derived: Record<string, unknown> = {};
  const rules = (ruleSet as Record<string, unknown>).rules as Array<{ id?: string; when?: WhenClause; then?: Record<string, unknown> }> | undefined;
  if (!Array.isArray(rules)) return { matched, derived };

  for (const r of rules) {
    if (!r.when) continue;
    if (evaluateCondition(r.when, context)) {
      matched.push({
        ruleId: r.id ?? "anonymous",
        when: r.when,
        then: r.then,
      });
      if (r.then && typeof r.then === "object") {
        for (const [k, v] of Object.entries(r.then)) {
          if (!k.startsWith("$")) derived[k] = v;
        }
      }
    }
  }
  return { matched, derived };
}
