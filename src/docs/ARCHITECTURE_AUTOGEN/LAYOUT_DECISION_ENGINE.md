# Layout Decision Engine

**Source:** Logic Plan 5 — [5_LAYOUT_DECISION_ENGINE_PLAN.md](../../cursor/logic/complete/5_LAYOUT_DECISION_ENGINE_PLAN.md).  
**Classification:** REFERENCE — Future decision engine; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN  
**Implementation status:** PLANNED. No runtime code implements layout-ID scoring by traits; compatible ID source (getSectionLayoutIds, evaluateCompatibility) and precedence slot exist; trait registry and context→weights JSON are prerequisites.

The Layout Decision Engine scores **compatible** layout IDs (from the compatibility engine) using traits, user context, and optional preference weights, and produces a single **recommended** layout ID (or ranked list). It never forces a choice: precedence remains **override > explicit > suggestion > default**. No hardcoded layout IDs; all from JSON or compatibility/layout resolvers.

---

## System Purpose

- **Input:** Compatible layout ID set (from compatibility engine); optional section node; optional user context (viewport band, density); optional contextual suggestion (Plan 4); optional preference weights (Plan 6).
- **Output:** One recommended layout ID (or ordered list by score). Optional explanation (traits, score) for debugging and "suggested" badge.
- **Consumer:** Layout resolver and dropdowns call the engine when override and explicit are absent; use result only for suggestion; user choice always overrides.

---

## Inputs

| Input | Description | Source |
|-------|-------------|--------|
| **Section node** | Section tree; used when combining with contextual logic. | Caller. |
| **User context** | Optional: viewport band, density preference, content type. | UI, viewport API, or defaults. |
| **Compatible layout IDs** | Set where `evaluateCompatibility(..., sectionLayoutId: id).sectionValid === true`. | Compatibility engine + filter over `getLayout2Ids()`. |
| **Optional contextual suggestion** | Trait set or trait weights from Contextual Layout Logic (Plan 4). | Plan 4 output. |
| **Optional preference weights** | Trait id → number from User Preference Adaptation (Plan 6). | Plan 6 output. |

The engine does not read layout store or node.layout to determine candidates; the caller supplies compatible IDs. Engine only scores and ranks.

---

## Decision Model

### Trait registry (JSON)

Single source of truth (e.g. `layout-traits.json` or `trait-registry.json`) maps each layout ID to a set of trait identifiers. Example traits: `media-prominent`, `split`, `stacked`, `grid`, `narrow`, `centered`, `full-bleed`. No layout IDs in engine code; engine loads registry and looks up traits by layout ID at runtime. New layouts added by editing JSON only.

### Context mapping (JSON)

Config maps user-context dimensions to preferred trait sets or trait weights (e.g. viewport `narrow` → prefer `stacked`, `narrow`). Data-driven; no layout IDs in config.

### Scoring

For each compatible layout ID: (1) Look up layout's traits from trait registry. (2) For each trait, combined weight = context weight + preference weight (missing → 0). (3) Score = sum over layout's traits of combined weight. (4) Sort by score descending; first is recommended. Tie-breaker (e.g. registry order) for determinism. Formula is data-driven; no layout IDs or magic numbers in code.

### Output

- **Primary:** One recommended layout ID (or ordered list by score).
- **Optional:** Explanation object (recommendedId, matchedTraits, score) for debugging and dropdown "suggested" badge.

---

## Data Sources

| Data | Source |
|------|--------|
| Compatible layout IDs | Caller filters `getLayout2Ids()` by `evaluateCompatibility(..., sectionLayoutId).sectionValid`. |
| Trait registry | New JSON (e.g. layout-traits.json or trait-registry.json). |
| Context → weights | New JSON/config (e.g. context-trait-weights.json). |
| Preference weights | Plan 6 (read-only for this engine). |

No layout IDs or trait lists hardcoded in TypeScript; all from JSON or compatibility/layout resolvers.

---

## Integration Points

- **Compatibility engine:** Decision Engine runs only on already-compatible layouts. Does not bypass compatibility; only ranks within compatible set.
- **Contextual Layout Logic (Plan 4):** Accepts suggested traits or contextual weights; merges into scoring. No layout IDs from Plan 4.
- **User Preference Adaptation (Plan 6):** Preference weights optional input; additive to per-trait sum.
- **Resolver / dropdown:** Resolver may call engine when override and explicit absent; uses recommendation for suggestion only. Order: **override > explicit > suggestion > default**.

---

## Safety Rules

1. **No hardcoded layout IDs** in engine or scoring code. Layout IDs only in JSON and in runtime data.
2. **No writing** to layout store or node.layout. Engine is read-only for layout state.
3. **No override** of user override, explicit node.layout, or template default. Engine only provides recommendation; resolver applies precedence.
4. **Explainable output:** Engine can return why a layout was recommended (traits, score) for debugging and UX.

---

## Implementation Prerequisites (when scheduled)

- **Suggestion step:** Insert suggestion step in `applyProfileToNode` (after explicit node.layout, before template default); wire resolver to call Decision Engine when override and explicit absent.
- **Data artifacts:** Add trait registry JSON and context→trait-weights config before implementation.

---

## Verification (Plan 5 completion)

- **Spec published:** This document is the canonical reference.
- **No existing Layout Decision Engine:** No runtime code implements layout-ID scoring by traits; `src/logic/engines/decision-engine.ts` is for onboarding, not layout.
- **Compatible ID source:** `getLayout2Ids()` and `evaluateCompatibility` exist; dropdown/OrganPanel already filter compatible options; ready for future engine to score them.
- **Resolver:** Current precedence override → explicit → default (no suggestion step); slot reserved for Plan 8 integration.
