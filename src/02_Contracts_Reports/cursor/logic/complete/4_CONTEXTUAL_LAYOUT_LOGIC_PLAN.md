# 4 — Contextual Layout Logic Plan

**Execution order:** 4 of 6 (engine: content → traits)  
**Classification:** REFERENCE — Content→traits logic; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Logic (Layout Intelligence)  
**Status:** Complete  
**Scope:** Planning only — no code edits, no runtime changes.

---

## Implementation prerequisites

Before implementation: (1) Add **contextual-layout-rules.json** (condition → traits or trait weights). (2) Optional content metrics (e.g. body word count, card count) require a small extractor if rules use them.

---

## System Purpose

Deterministic logic that, from a section's **content structure** only, suggests layout **patterns** or **trait preferences** (never layout IDs). The output feeds the Layout Decision Engine (Plan 5) so that trait-based scoring can favor "stacked" when content is long text, "split" when media is present, "grid" when there are many cards, and so on. The system is data-driven: rules are defined in JSON (conditions on slots, counts, or content hints → suggested traits or trait weights). Layout IDs are never mentioned in rules or in engine code; the Decision Engine maps traits to layout IDs via the trait registry only.

---

## Inputs

| Input | Description | Source |
|-------|-------------|--------|
| **Section node** | The section tree (children, content, role). | Caller (e.g. renderer or layout pipeline). |
| **Available slots** | Canonical slot names present in the section (e.g. heading, body, image, card_list). | `getAvailableSlots(sectionNode)` from the compatibility layer. |
| **Optional content metrics** | E.g. body word count, image count, card count. Derived from section node if defined. | Extractor or helper; optional. |
| **Rule set** | JSON: conditions (on slots/counts/content descriptors) → suggested trait set or trait weight deltas. | New config file (e.g. `contextual-layout-rules.json`). |

---

## Decision Model

### Rules (data-driven)

Rules map **content structure** to **trait suggestions**. All rules live in JSON. No layout IDs appear in rules.

**Example rules:**

1. **Long text → stacked layouts**  
   Condition: content descriptor "long-text" or body word count above a threshold (e.g. wordCount > 200).  
   Output: suggested traits `["stacked", "narrow"]` or contextual trait weights `{ "stacked": 2, "narrow": 1 }`.  
   Implementation: rule references a content descriptor or a metric (e.g. `bodyWordCountMin: 200`); the engine evaluates it and emits the trait set or weights.

2. **Media present → split layouts**  
   Condition: slot `image` present in available slots.  
   Output: suggested traits `["split", "media-prominent"]` or weights `{ "split": 1, "media-prominent": 1 }`.

3. **Many cards → grid layouts**  
   Condition: slot `card_list` present and optionally card count ≥ 2 or ≥ 3.  
   Output: suggested traits `["grid", "multi-item"]` or weights `{ "grid": 2, "multi-item": 1 }`.

**Rule format (conceptual):**

- **Condition:** Either a list of required slots (all must be present), or a content descriptor (e.g. `long-text`, `media-heavy`), or numeric conditions (e.g. `bodyWordCountMin`, `cardCountMin`). Conditions reference only slots, counts, or named content descriptors — no layout IDs.
- **Output:** Either a list of trait identifiers (suggested traits) or a map of trait id → weight delta (contextual trait weights). The Layout Decision Engine (Plan 5) will use this to score compatible layouts.

**Example rule set shape:**

```json
{
  "description": "Content structure → suggested traits. No layout IDs.",
  "rules": [
    {
      "id": "long-text-stacked",
      "condition": { "contentDescriptor": "long-text" },
      "output": { "traits": ["stacked", "narrow"] }
    },
    {
      "id": "has-image-split",
      "condition": { "slots": ["image"] },
      "output": { "traits": ["split", "media-prominent"] }
    },
    {
      "id": "has-cards-grid",
      "condition": { "slots": ["card_list"], "cardCountMin": 2 },
      "output": { "traits": ["grid", "multi-item"] }
    }
  ]
}
```

Content descriptors (e.g. "long-text") may be defined elsewhere: e.g. body word count band in a small content-metrics extractor that the engine calls, or a slot + length hint. The important point is that the rule set itself only references descriptors and slots, not layout IDs.

### How it remains data-driven

- **Conditions** reference only: slot names (from `getAvailableSlots`), optional counts (e.g. card count, word count), and optional content-type descriptors. No layout IDs.
- **Output** is only trait identifiers or trait weights. Layout IDs are never mentioned. The Layout Decision Engine (Plan 5) is responsible for mapping traits to layout IDs via the trait registry.
- **New behavior** is added by editing the rule set JSON and, if needed, the trait registry; no layout IDs are added to engine code.

### How it works alongside the compatibility engine

- The **compatibility engine** uses the same section node to compute available slots and to filter layout IDs to those that are structurally valid (`sectionValid`). It answers: "Which layout IDs are allowed for this section?"
- **Contextual layout logic** uses the same section node (and available slots / optional metrics) to evaluate rules and produce suggested traits or contextual weights. It answers: "Given this content, which traits should we favor?"
- The **Layout Decision Engine (Plan 5)** takes: (1) the compatible layout ID set from the compatibility engine, and (2) the suggested traits or contextual weights from this plan's engine. It scores compatible IDs by traits and weights and returns a recommended layout ID. So: compatibility filters; contextual logic suggests traits; decision engine ranks. No bypassing of compatibility.

### How it never hardcodes layout IDs

- Rules and engine code **only emit trait ids and/or weights**. They do not emit or reference layout IDs.
- The set of layout IDs is always supplied by the layout system (e.g. from page-layouts JSON and compatibility). The Decision Engine resolves "which layout has these traits?" via the trait registry only. So even if a rule says "prefer split and media-prominent," the engine never says "use hero-split"; it only says "boost traits split, media-prominent," and the Decision Engine finds which compatible layout has those traits.

### How it feeds into the Layout Decision Engine

- **Output of contextual logic:** "Suggested traits" for this section (e.g. `["split", "media-prominent"]`) and/or "contextual trait weights" (e.g. `{ "split": 1, "media-prominent": 1 }`).
- **Decision Engine input (Plan 5):** Accepts this as one input and merges it with user context and preference weights. For each compatible layout, it sums (context weight + preference weight) for each trait the layout has; contextual weights come from this engine. Optional: the Decision Engine could also accept a single "contextual best" layout ID if the contextual layer were to resolve traits → one layout ID via the registry (still no hardcoding — lookup from registry). The plan leaves that as an optional refinement.

---

## Data Sources

| Data | Source |
|------|--------|
| Section node | Caller. |
| Available slots | `getAvailableSlots(sectionNode)` from `src/layout/compatibility/content-capability-extractor.ts`. |
| Optional content metrics | E.g. body word count from section content; card count from children. Defined by a small extractor or helper; optional. |
| Rule set | New JSON: e.g. `contextual-layout-rules.json` (condition → traits or trait weights). |

---

## Integration Points

### Compatibility engine

Contextual logic runs on the same section node used for compatibility. It does **not** replace compatibility. Compatibility still filters to valid layout IDs; contextual logic only produces a trait suggestion or weight vector. The Decision Engine uses both: compatible IDs as candidates, contextual output as one input to scoring.

### Layout Decision Engine (Plan 5)

The Decision Engine receives the contextual output (suggested traits or contextual trait weights) and merges it with user context and preference weights to score and rank compatible layouts. No layout IDs flow from this plan's engine; only traits and weights.

### Trait registry

The trait registry (shared with Decision Engine and User Preference Adaptation, Plan 6) defines which traits exist. Contextual rules only reference trait identifiers that appear in that registry. They do not define new layout IDs.

---

## Safety Rules

1. **No layout store or node mutation:** This engine only reads the section node and optionally slots/metrics. It does not write to the layout store or to node.layout.
2. **Output is suggestion only:** The result is used only to influence scoring in the Decision Engine. It does not force a layout choice; override > explicit > suggestion > default.
3. **No layout IDs in rules or engine logic:** Rules and code reference only content descriptors (slots, counts, content-type) and output only trait ids or weights. Layout ID set and layout ID selection remain in the layout system and Decision Engine, driven by JSON registries.
4. **Deterministic and explainable:** For a given section and rule set, output is deterministic. Each suggestion can be explained (e.g. "rule: has image → traits split, media-prominent").

---

## Future Expansion

- **More content descriptors:** e.g. "has-cta," "has-video," "role=hero" (still no layout IDs; role might map to a trait hint).
- **Viewport-aware rules:** e.g. on narrow viewport, prefer "stacked" even when image is present; rule condition includes viewport band. Weights or rules still output only traits.
- **Optional ML layer:** A future ML model could predict "suggested traits" from content; as long as it outputs only trait ids or weights and does not emit layout IDs, it fits this plan. The Decision Engine would consume that output like any other contextual source.

---

## Verification (Plan 4 completion)

- **Spec published:** [src/docs/ARCHITECTURE_AUTOGEN/CONTEXTUAL_LAYOUT_LOGIC.md](../../docs/ARCHITECTURE_AUTOGEN/CONTEXTUAL_LAYOUT_LOGIC.md) is the canonical reference.
- **No existing engine:** No runtime code implements contextual layout logic yet; no layout IDs emitted on a "contextual" path.
- **Slot source:** getAvailableSlots(sectionNode) exists in layout/compatibility/content-capability-extractor; ready for future engine.
- **Compatibility unchanged:** Contextual logic spec does not replace compatibility; adds trait suggestions for Decision Engine.

---

## Change Log

- [2025-02-04] Plan created.
- [2025-02-04] Spec formalized in ARCHITECTURE_AUTOGEN; audits passed; marked complete; moved to logic/complete.
