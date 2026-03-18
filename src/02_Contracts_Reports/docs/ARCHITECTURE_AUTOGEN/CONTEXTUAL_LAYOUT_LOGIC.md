# Contextual Layout Logic (Content → Traits)

**Source:** Logic Plan 4 — [4_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md](../../cursor/logic/complete/4_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md).  
**Classification:** REFERENCE — Content→traits logic; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN  
**Implementation status:** PLANNED. No contextual engine or contextual-layout-rules.json yet; getAvailableSlots exists for future use; output feeds Layout Decision Engine (Plan 5).

Deterministic logic that, from a section's **content structure** only, suggests layout **patterns** or **trait preferences** (never layout IDs). Output feeds the Layout Decision Engine (Plan 5) for trait-based scoring. Data-driven: rules in JSON (conditions on slots, counts, or content hints → suggested traits or trait weights). Layout IDs are never mentioned in rules or engine code; Decision Engine maps traits to layout IDs via the trait registry only.

---

## System Purpose

- **Input:** Section node (structure, children, content, role); available slots from `getAvailableSlots(sectionNode)`; optional content metrics.
- **Output:** Suggested trait set (e.g. `["stacked", "narrow"]`) or contextual trait weights (e.g. `{ "split": 1, "media-prominent": 1 }`). Never layout IDs.
- **Consumer:** Layout Decision Engine (Plan 5) uses this to score compatible layouts; compatibility engine filters layout IDs; contextual logic suggests traits; decision engine ranks.

---

## Inputs

| Input | Description | Source |
|-------|-------------|--------|
| **Section node** | The section tree (children, content, role). | Caller (e.g. renderer or layout pipeline). |
| **Available slots** | Canonical slot names present in the section (e.g. heading, body, image, card_list). | `getAvailableSlots(sectionNode)` from `src/layout/compatibility/content-capability-extractor.ts`. |
| **Optional content metrics** | E.g. body word count, image count, card count. | Extractor or helper; optional. |
| **Rule set** | JSON: conditions → suggested trait set or trait weight deltas. | New config (e.g. `contextual-layout-rules.json`); not yet implemented. |

---

## Decision Model (Rules)

Rules map **content structure** to **trait suggestions**. All rules in JSON. No layout IDs in rules.

- **Conditions:** Required slots (all must be present), or content descriptor (e.g. `long-text`, `media-heavy`), or numeric conditions (e.g. `bodyWordCountMin`, `cardCountMin`). No layout IDs.
- **Output:** Trait identifiers (suggested traits) or map of trait id → weight delta. Decision Engine uses this to score compatible layouts via trait registry.

**Example rule shape:**

- `long-text` → traits `["stacked", "narrow"]`
- slots include `image` → traits `["split", "media-prominent"]`
- slots include `card_list` and cardCountMin ≥ 2 → traits `["grid", "multi-item"]`

---

## How It Fits With Compatibility and Decision Engine

- **Compatibility engine:** Same section node → `getAvailableSlots`; filters layout IDs to structurally valid (`sectionValid`). Answers: "Which layout IDs are allowed?"
- **Contextual layout logic:** Same section (and slots / optional metrics) → rules → suggested traits or weights. Answers: "Given this content, which traits should we favor?"
- **Decision Engine (Plan 5):** Compatible layout ID set + suggested traits/weights → score by trait registry → one recommended layout ID. No layout IDs from contextual logic.

---

## Data Sources

| Data | Source |
|------|--------|
| Section node | Caller. |
| Available slots | `getAvailableSlots(sectionNode)` from layout/compatibility/content-capability-extractor. |
| Optional content metrics | Extractor/helper; optional. |
| Rule set | New JSON (e.g. contextual-layout-rules.json); implementation prerequisite. |

---

## Safety Rules

1. **No layout store or node mutation:** Engine only reads section node and optionally slots/metrics. Does not write to layout store or node.layout.
2. **Output is suggestion only:** Used only to influence Decision Engine scoring. Override > explicit > suggestion > default.
3. **No layout IDs in rules or engine:** Rules and code reference only slots, counts, content descriptors; output only trait ids or weights. Layout ID set and selection remain in layout system and Decision Engine (JSON registries).
4. **Deterministic and explainable:** For given section and rule set, output is deterministic; each suggestion explainable (e.g. "rule: has image → traits split, media-prominent").

---

## Implementation Prerequisites (when scheduled)

1. Add **contextual-layout-rules.json** (condition → traits or trait weights).
2. Optional content metrics (e.g. body word count, card count) require a small extractor if rules use them.

---

## Verification (Plan 4 completion)

- **Spec published:** This document is the canonical reference.
- **No existing contextual engine:** No runtime code yet implements this; no layout IDs emitted by any "contextual" path.
- **Slot source exists:** `getAvailableSlots(sectionNode)` in content-capability-extractor; used by compatibility-evaluator. Ready for future contextual engine.
- **Compatibility unchanged:** Contextual logic does not replace compatibility; it adds trait suggestions for Decision Engine.
