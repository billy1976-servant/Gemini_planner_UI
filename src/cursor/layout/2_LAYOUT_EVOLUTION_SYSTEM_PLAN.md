# Layout Evolution & Preference Engine Plan

**Classification:** REFERENCE — Future preference/trait engine; on top of existing layout.

## System Purpose

The Layout Preference Engine allows users to give **"more like this"** and **"less like this"** feedback on rendered layouts. The system records liked and disliked layout traits and a future layout engine step recalibrates section and component layout choices dynamically based on those preferences.

**Scope:**

- Works **on top of** the existing layout system.
- Does **not** replace the layout engine.
- Does **not** affect logic engine decisions.
- Only influences how chosen sections render visually (which layout variant is selected when multiple candidates exist).

---

## Preference Signal Model

**Signals** are user reactions that map to layout traits:

- **"More like this"** — increase preference for the traits present in the current layout.
- **"Less like this"** — decrease preference for those same traits.

**Traits to capture:**

- Spacing density
- Alignment (left / center / split)
- Media prominence
- Text length
- Visual intensity
- Grid vs stack
- Symmetry vs asymmetry

**Capture and translation (conceptual):** When the user triggers "more like this" or "less like this," the system looks up the traits of the currently rendered layout (from the Layout Trait Mapping). It then applies a delta (e.g. +1 for "more like this," -1 for "less like this") to each of those traits in the Preference Memory. No specific UI or API is defined here; this describes the data flow only.

---

## Layout Trait Mapping

Traits are defined in **JSON**, not TypeScript. Each layout ID (page-level or component-level) maps to a set of trait identifiers. A separate trait registry (e.g. a JSON file such as `trait-registry.json`) holds these mappings so the evolution layer can score layouts by traits without hardcoding layout IDs in code.

**Example:**

```json
"hero-split": {
  "traits": ["media-prominent", "split", "high-contrast"]
}
```

The evolution layer uses this registry to answer: "Which traits does layout ID X have?" All layout–trait associations live in this data; the engine never embeds layout IDs in application or resolver code.

---

## Preference Memory Model

Preference weights are stored per-session and/or per-user, keyed by trait id. Positive values mean the user prefers that trait; negative values mean they prefer to avoid it.

**Example structure:**

```json
{
  "media-prominent": 2,
  "dense-text": -3,
  "asymmetrical": 1
}
```

Exact storage (e.g. sessionStorage, backend user profile) is out of scope for this plan. The model only defines the shape and semantics of the weights.

---

## Evolution Scoring Concept

A **future** engine step will:

1. Receive a set of candidate layouts from the existing layout resolver (e.g. page resolver, component resolver, or layout-2).
2. For each candidate, look up its traits in the Layout Trait Mapping.
3. Score the candidate by summing the user’s preference weight for each trait that the layout has (missing traits contribute 0).
4. Select the highest-scoring layout for rendering.

**Rules:**

- Never hardcode layout IDs in code; selection is always trait-driven and data-driven via JSON.
- This layer works **on top of** the existing layout resolver by filtering or ranking its outputs, not by replacing it.

---

## Integration Points (Future)

The preference engine would plug in at these points (conceptually):

- **After** the layout resolver returns one or more candidate layout IDs (e.g. from [src/layout/page/page-layout-resolver.ts](src/layout/page/page-layout-resolver.ts), [src/layout/component/component-layout-resolver.ts](src/layout/component/component-layout-resolver.ts), or layout-2).
- **Before** a single layout is chosen for rendering.

The existing resolvers and layout-2 remain unchanged; the preference layer sits between "candidates available" and "final layout selected."

---

## Safety Rules (No Hardcoding)

- Do **not** hardcode layout IDs in application or engine code. Layout selection is driven by trait scores and JSON data only.
- Do **not** replace the layout engine; only add a preference layer on top.
- Do **not** affect logic engine decisions; this system only influences visual layout choice.
- Trait definitions and layout–trait mappings live in **JSON/config only** (e.g. trait registry, optional preference-weights persistence). No layout IDs or trait lists are encoded in TypeScript/JavaScript.
