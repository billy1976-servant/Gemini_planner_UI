# ROUND 2 — Resolver Surface Map

**Purpose:** List all resolvers by domain; identify which can become one public API per domain. Planning only.

---

## 1. Layout resolvers

| Resolver | File | Exports / role | Callers | Single public API? |
|----------|------|----------------|---------|--------------------|
| Layout (unified) | layout/resolver/layout-resolver.ts, layout/resolver/index.ts | resolveLayout, getSectionLayoutIds, getDefaultSectionLayoutId | JsonRenderer, page.tsx, OrganPanel, section-layout-dropdown | **Yes** — keep as single public API. |
| Page layout | layout/page/page-layout-resolver.ts | getPageLayoutId, getPageLayoutById, getDefaultSectionLayoutId | layout-resolver (internal) | Internal; no second public API. |
| Component layout | layout/component/component-layout-resolver.ts | resolveComponentLayout | layout-resolver (internal) | Internal. |
| Molecule layout | lib/layout/molecule-layout-resolver.ts | resolveMoleculeLayout | LayoutMoleculeRenderer | Could be wrapped by layout/resolver index; optional. |
| Screen layout | lib/layout/screen-layout-resolver.ts | (screen layout resolution) | See reachability | Secondary/lib; keep or document. |
| Organ layout | layout-organ/organ-layout-resolver.ts | resolveInternalLayoutId | Organ internal layout | Separate domain (organ-internal); single. |
| Profile | lib/layout/profile-resolver.ts | getExperienceProfile, getTemplateProfile | page.tsx, layout (getDefaultSectionLayoutId) | Option: layout consumes profile for default; else one entry. |

**Target:** One public API per domain: **layout** = `layout/resolver` (resolveLayout, getSectionLayoutId after R2). Page/component/molecule stay internal or behind same index.

---

## 2. Preset resolvers

| Resolver | File | Role | Single public API? |
|----------|------|------|--------------------|
| Card preset | lib/layout/card-preset-resolver.ts | Card presets | Group: "preset resolvers" — one facade optional. |
| Visual preset | lib/layout/visual-preset-resolver.ts | Visual presets | Same. |
| Spacing scale | lib/layout/spacing-scale-resolver.ts | Spacing scales | Same. |

**Target:** No mandatory merge; all under lib/layout. Optional: single `lib/layout/preset-resolver.ts` re-exporting card, visual, spacing. R2: plan only.

---

## 3. Content resolvers

| Resolver | File | Role | Callers | Single public API? |
|----------|------|------|---------|--------------------|
| Content (active) | logic/content/content-resolver.ts | resolveContent(key) | landing-page-resolver, education-resolver | **Yes** — single entry. |
| Content (legacy) | content/content-resolver.ts | resolveContent(kind, key, valueOverride) | **None** (unused) | **Remove/stub** — no second API. |
| Education | logic/content/education-resolver.ts | Education content | Uses logic/content/content-resolver | Internal/specialized. |
| Landing page | logic/runtime/landing-page-resolver.ts | resolveLandingPage | page.tsx | Single entry; keep. |

**Target:** One public content entry: **logic/content/content-resolver**. content/content-resolver removed or stubbed.

---

## 4. Calculator resolvers

| Resolver | File | Role | Callers | Single public API? |
|----------|------|------|---------|--------------------|
| Calc resolver | logic/runtime/calc-resolver.ts | resolveCalcs(flow) | **None** (no callers) | **Dead** — remove or document optional. |

**Target:** No calculator "resolver" on main path; runCalculator uses calculator.engine + calculator.registry/calc-registry. calc-resolver removed or marked optional.

---

## 5. Profile / presentation resolvers

| Resolver | File | Role | Single public API? |
|----------|------|------|--------------------|
| Profile | lib/layout/profile-resolver.ts | getExperienceProfile, getTemplateProfile, resolveProfileLayout | Single; optionally consumed by layout. |

**Target:** One profile entry; no duplication.

---

## 6. Other resolvers (state, flow, view, behavior)

| Resolver | File | Role | Single public API? |
|----------|------|------|--------------------|
| State | state/state-resolver.ts | deriveState(log) | Single. |
| Flow | logic/runtime/flow-resolver.ts | resolveView, flow step resolution | Single (secondary path). |
| View | logic/runtime/view-resolver.ts | Immediate/Expanded/Export view | Legacy/secondary; document. |
| Behavior verb | behavior/behavior-verb-resolver.ts | Verb → execution | Single. |
| Palette | engine/core/palette-resolver.ts | Palette/token resolution | Single. |

No consolidation required for state, flow, view, behavior, palette.

---

## 7. Summary: one public API per domain

| Domain | Current surface | Target (one public API) |
|--------|-----------------|-------------------------|
| Layout | layout/resolver (resolveLayout, getSectionLayoutIds) + page + component + molecule + profile | layout/resolver/index: resolveLayout, getSectionLayoutId (new), getSectionLayoutIds; rest internal. |
| Content | logic/content/content-resolver + content/content-resolver (legacy) | logic/content/content-resolver only. |
| Presets | card, visual, spacing (lib/layout) | Unchanged or optional single facade. |
| Calculator | calc-resolver (no callers) | Remove or optional; no public resolver. |
| Profile | lib/layout/profile-resolver | Unchanged; optionally called by layout only. |
| State | state-resolver | Unchanged. |
| Flow / view | flow-resolver, view-resolver | Unchanged (secondary). |

---

*End of ROUND2_RESOLVER_SURFACE.md — scan only; no changes.*
