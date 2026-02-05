# 7 — Override System Alignment Plan

**Execution order:** 7 of 10  
**Classification:** FOUNDATIONAL — Section/card/organ override stores and precedence; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN, src/cursor/logic/planned

**Domain:** Layout (State, Overrides)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define how section, card, and organ internal layout overrides are stored, keyed, and passed into the render pipeline. Align with Logic Plan 2 (State and Override Orchestration): overrides are user-authored; resolver reads them and applies precedence; no engine overwrites user overrides.

---

## Current Runtime (Verified)

| Store | Path | Keying | Purpose |
|-------|------|--------|---------|
| Section layout preset overrides | `src/state/section-layout-preset-store.ts` | screenId → { sectionKey → layoutId } | Per-screen, per-section: section container layout ID. getOverridesForScreen(screenId), setSectionLayoutPresetOverride(screenId, sectionKey, presetId). |
| Card layout preset overrides | Same file | screenId → { sectionKey → cardPresetId } | Per-screen, per-section: card layout preset for cards in that section. getCardOverridesForScreen(screenId). |
| Organ internal layout overrides | `src/state/organ-internal-layout-store.ts` | screenId → { sectionKey → internalLayoutId } | Per-screen, per-section: organ internal layout ID. getOrganInternalLayoutOverridesForScreen(screenId), setOrganInternalLayoutOverride(screenId, sectionKey, internalLayoutId). |

Section key = node.id ?? node.role ?? "" (stable after assignSectionInstanceKeys in resolve-organs). Overrides are passed into JsonRenderer as sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides; applyProfileToNode reads them when resolving layout.

---

## Contract: Override Storage and Keying

- **Keying:** All override maps are keyed by screenId (or screen key) and section key (sectionKey = node.id ?? node.role). Organ internal and card overrides are "per parent section" so sectionKey identifies the section that contains the cards or the organ.
- **Persistence:** Section and card overrides persisted to localStorage (section-layout-preset-store); organ internal overrides persisted (organ-internal-layout-store). Load on read; save on write; no layout store or logic store holds overrides.
- **Passing into render:** App/page passes getOverridesForScreen(screenKey), getCardOverridesForScreen(screenKey), getOrganInternalLayoutOverridesForScreen(screenKey) into JsonRenderer. These are plain objects (Record<string, string> per screen); resolver uses them only for precedence, does not mutate them.

---

## What Override System Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Store user-chosen layout IDs per screen and section; persist and pass into resolver. | Be overwritten by Logic or by automatic "fix" when compatibility is invalid; user override wins. |
| Be the first step in precedence (override → explicit → suggestion → default). | Be cleared or changed by any path other than user action (e.g. OrganPanel or section layout dropdown). |

---

## How It Connects to Logic and Resolver

- **Logic Plan 2 (State and Override Orchestration):** Overrides are user-authored; Logic recommendation is not written to override store; resolver uses override when present.
- **Resolver (Plan 5):** applyProfileToNode reads sectionLayoutPresetOverrides[sectionKey] first; if present and non-empty, that is the section layout ID. Same idea for card and organ internal where applicable.
- **Layout store:** Holds experience, templateId, mode, regionPolicy. It does not hold per-section overrides; overrides live in dedicated stores and are passed as props.

---

## Determinism Rules

- Same screen, same section key, same override map ⇒ same resolved layout. Override map is input to resolution; no non-deterministic reads.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
