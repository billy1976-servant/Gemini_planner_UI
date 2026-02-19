# Cursor Rules Update Report: Structure-Driven by Default

**Date:** 2025-02-18  
**Scope:** `.cursor/rules/` only. No changes to Planner, Onboarding, or existing TSX screens.

---

## Objective

Update the Cursor rules so that **all newly generated TSX screens automatically consume the TSX Structure Engine by default**, without requiring manual instruction. The rules now encode the existing architecture (`src/lib/tsx-structure/`: resolver, envelope, context, `useAutoStructure`) as the mandatory path for new TSX.

---

## Files Audited

- **src/lib/tsx-structure/** — Resolver (`resolveAppStructure`, convention, templateLoader), engines (per-type normalizers, `getEngine`), contracts (per-type boundaries), `useAutoStructure`, `StructureConfigContext`, `TSXScreenWithEnvelope`, `getDefaultTsxEnvelopeProfile`, types, index.
- **docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md** — Single source of truth for JSON control plane, 8 structure types, resolution order, envelope flow, Phase 2 automation (`useAutoStructure`).
- **.cursor/rules/TSX_BUILD_SYSTEM.md** — Permanent law for building TSX screens.
- **.cursor/rules/TSX_CREATION_CHECKLIST.md** — Step-by-step checklist for new TSX.
- **.cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md** — Short overview for AI.

---

## Changes Made

### 1. TSX_BUILD_SYSTEM.md

| Change | Description |
|--------|-------------|
| **New §1.1 "DEFAULT FOR NEW TSX (MANDATORY)"** | States that all newly generated TSX screens are structure-driven by default with no opt-out. New screens MUST be mounted via `TSXScreenWithEnvelope` and MUST consume resolved structure via `useAutoStructure()` or envelope props. References `src/lib/tsx-structure/` and `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`. Explicit exception: Planner and Onboarding (existing) are not refactored. |
| **§2 "HOW ALL FUTURE TSX FILES MUST BE BUILT"** | "Optionally" removed; consumption is **mandatory** for new screens. "Preferred" replaced with "default" for `useAutoStructure()`. Added: "Use this for all new TSX." |
| **§2 "TSX must"** | Added: "New screens must not bypass the structure system." Added: "Rely on the existing system: resolver, envelope, context, and hook — no custom wiring or duplicate resolution logic in TSX." |
| **§6 "HOW CURSOR MUST CREATE NEW TSX FILES"** | Opening sentence added: "When the user says 'create a TSX screen', **the new screen is structure-driven by default.** No manual instruction is needed to 'use the structure system' — it is the default." Step 2 rewritten: "Generate TSX that **consumes the structure system**"; use `useAutoStructure()` (default); component **must** consume context provided by envelope. |

### 2. TSX_CREATION_CHECKLIST.md

| Change | Description |
|--------|-------------|
| **Default assumption (new paragraph)** | After the intro: "All newly generated TSX screens are **structure-driven by default**. They MUST be wrapped by `TSXScreenWithEnvelope` and MUST consume the resolved structure via `useAutoStructure()` or envelope props. No opt-out for new screens. Planner and Onboarding are not refactored." |
| **§2 "Apply template contract"** | Title updated to "(mandatory for new screens)". "Consumes" → "**MUST** consume"; "Prefer" → "Use … by default"; added "New screens do not bypass the structure system." |
| **§3 "Accept appStructure / use structureConfig"** | First bullet: assume screen runs inside envelope; config from `StructureConfigProvider`. Second bullet: read from `useAutoStructure().config` or envelope props. Third bullet: added "Follow the architecture in `src/lib/tsx-structure/` and `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`." |
| **Quick reference table** | New row: "Default | New TSX = structure-driven by default; MUST consume via envelope + `useAutoStructure()` or structureProps". "Prefer" → "**MUST** use … (no bypass)". |

### 3. TSX_STRUCTURE_ENGINE_OVERVIEW.md

| Change | Description |
|--------|-------------|
| **"What the engine is"** | New bullet: **Single consumption hook:** `useAutoStructure()` — one hook for all structure types; use by default; no need to pick a specific engine. |
| **New section "Default for new screens"** | All new TSX screens are structure-driven by default. Cursor must: assume mount via `TSXScreenWithEnvelope`, generate component to consume via `useAutoStructure()` or envelope/context, follow `src/lib/tsx-structure/` and final architecture doc, no custom resolution. Planner/Onboarding unchanged. |
| **"How new screens plug into it"** | Opening line: "New screens **must** consume the structure system; it is the default. No manual instruction to 'add structure support' is needed." Step 1: use **`useAutoStructure()`** (default); "All new TSX screens consume the resolved structure — do not generate screens that ignore it." Step 3: read from `useAutoStructure().config` or envelope props. Step 5: "new TSX screens, which are structure-driven by default." |

---

## Summary

- **Default:** New TSX = structure-driven by default; no opt-out.
- **Consumption:** MUST use `useAutoStructure()` or envelope/structureProps; no bypass.
- **Architecture:** Follow existing `src/lib/tsx-structure/` and `docs/TSX_STRUCTURE_ENGINE_FINAL_ARCHITECTURE.md`; no duplicate resolution or custom wiring in TSX.
- **Exceptions:** Planner and Onboarding (and existing TSX) are not refactored; rule applies to **new** TSX only.

Future TSX generation by Cursor will treat the structure system as the default path for new screens, without requiring separate instructions to use it.
