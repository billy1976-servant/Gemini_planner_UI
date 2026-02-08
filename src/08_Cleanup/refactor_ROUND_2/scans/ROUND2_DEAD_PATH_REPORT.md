# ROUND 2 — Dead Path Report

**Purpose:** Mark unused resolvers, unused engine wrappers, legacy content/calc-resolver, ScreenRenderer, onboarding-engines duplicates. Planning only.

---

## 1. Unused resolvers

| Resolver | File | Status | Evidence | Action (R2) |
|----------|------|--------|----------|------------|
| **content/content-resolver** | content/content-resolver.ts | Legacy / unused | @deprecated in file; all callers use @/logic/content/content-resolver. Zero runtime imports from content/. | Remove from build or stub with @deprecated re-export; ensure zero imports. |
| **calc-resolver** | logic/runtime/calc-resolver.ts | Unused on main path | No callers of resolveCalcs in codebase; comment in file: "Legacy/unused on main JSON screen path." | Remove or add top-level comment "Optional; not on main JSON screen path"; do not wire. |

---

## 2. Unused engine wrappers

| Wrapper / path | File(s) | Status | Action (R2) |
|----------------|---------|--------|-------------|
| **ScreenRenderer** | screens/core/ScreenRenderer.tsx | DEAD | Not on main path; page → loadScreen → JsonRenderer. Only used by GibsonSiteScreen (tsx-screens/sites/generated). Document as DEAD; do not remove in R2 (optional R3). |
| **EngineRunner** | (engine-runner references) | DEAD / PARTIAL | Document only; no removal in R2. |
| **renderFromSchema / GeneratedSiteViewer** | (lib/screens, etc.) | SECONDARY | Not dead; TSX/flow path. No change. |

---

## 3. Legacy content / content-resolver

| Item | Location | Status | Action (R2) |
|------|----------|--------|-------------|
| content/content-resolver.ts | content/content-resolver.ts | Legacy; no main-path imports | Remove or stub. |
| content/text.content.json, media.content.json, data.content.json | content/*.content.json | Consumed only by content/content-resolver.ts | If content-resolver removed: document as legacy or remove if unused. |

---

## 4. Calc-resolver

| Item | Location | Status | Action (R2) |
|------|----------|--------|-------------|
| resolveCalcs | logic/runtime/calc-resolver.ts | No callers | Remove file or document "Optional; flow integration only; not on main JSON screen path." |

---

## 5. ScreenRenderer

| Item | Location | Status | Action (R2) |
|------|----------|--------|-------------|
| ScreenRenderer | screens/core/ScreenRenderer.tsx | DEAD (not on main app path) | Document DEAD; do not remove. GibsonSiteScreen imports it for TSX route only. |
| loadScreenConfig | ScreenRenderer internal | Alternate screen path | Not used by page.tsx / loadScreen (JSON). |

---

## 6. Onboarding-engines duplicates

| Item | Location | Status | Action (R2) |
|------|----------|--------|-------------|
| logic/onboarding-engines/abc.engine.ts | Same name as logic/engines/abc.engine.ts | Duplicate | **R3:** Remove or re-export from logic/engines. **R2:** Document only; do not remove. |
| logic/onboarding-engines/calculator.engine.ts | Same as logic/engines/calculator | Duplicate | Same. |
| logic/onboarding-engines/learning.engine.ts | Same as logic/engines/learning.engine | Duplicate | Same. |
| logic/onboarding-engines/summary.engine.ts | Same as logic/engines/summary | Duplicate | Same. |

**Evidence:** engine-registry.ts imports from `../engines/` (learning, calculator, abc, summary), not from onboarding-engines. No runtime imports of onboarding-engines found. R2: list in dead path report; no code change.

---

## 7. Summary: dead path actions (ROUND 2)

| # | Path | Action |
|---|------|--------|
| 1 | content/content-resolver.ts | Remove or stub; zero imports. |
| 2 | content/*.content.json | If content-resolver removed: document or remove. |
| 3 | logic/runtime/calc-resolver.ts | Remove or document optional; no main-path callers. |
| 4 | ScreenRenderer | Document DEAD; no removal. |
| 5 | logic/onboarding-engines | Document as duplicate; removal in R3. |

---

*End of ROUND2_DEAD_PATH_REPORT.md — scan only; no changes.*
