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

---

## Verification Report (Step 7)

**Plan:** [7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md](7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md)  
**Scope:** Verify section/card/organ override stores, keying (screenId + sectionKey), persistence, and pass-into-render; align with Logic Plan 2.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Section layout overrides: path, keying, API | ✅ PASS |
| Card layout overrides: path, keying, API | ✅ PASS |
| Organ internal overrides: path, keying, API | ✅ PASS |
| Keying: screenId + sectionKey; sectionKey = node.id ?? node.role | ✅ PASS |
| Persistence: localStorage; load on read, save on write | ✅ PASS |
| Overrides passed into JsonRenderer; applyProfileToNode reads first in precedence | ✅ PASS |
| Layout store does not hold per-section overrides | ✅ PASS |
| Resolver does not mutate override objects | ✅ PASS |

**Overall: PASS** — Override system matches the plan; keying, persistence, and render pipeline aligned.

---

### 1. Store verification

#### 1.1 Section layout preset overrides

| Contract | Implementation | Verified |
|----------|----------------|----------|
| Path | `src/state/section-layout-preset-store.ts` | ✅ |
| Keying | screenId → { sectionKey → layoutId } (OverridesMap = Record<string, Record<string, string>>) | ✅ |
| getOverridesForScreen(screenId) | Returns Record<string, string> for that screen; empty object when none | ✅ |
| setSectionLayoutPresetOverride(screenId, sectionKey, presetId) | Updates in-memory map and saves to localStorage | ✅ |

#### 1.2 Card layout preset overrides

| Contract | Implementation | Verified |
|----------|----------------|----------|
| Path | Same file (section-layout-preset-store.ts); separate map and storage key | ✅ |
| Keying | screenId → { sectionKey → cardPresetId } | ✅ |
| getCardOverridesForScreen(screenId) | Returns Record<string, string> for that screen | ✅ |
| setCardLayoutPresetOverride(screenId, sectionKey, presetId) | Updates and persists | ✅ |

#### 1.3 Organ internal layout overrides

| Contract | Implementation | Verified |
|----------|----------------|----------|
| Path | `src/state/organ-internal-layout-store.ts` | ✅ |
| Keying | screenId → { sectionKey → internalLayoutId } | ✅ |
| getOrganInternalLayoutOverridesForScreen(screenId) | Returns Record<string, string> for that screen | ✅ |
| setOrganInternalLayoutOverride(screenId, sectionKey, internalLayoutId) | Updates and persists | ✅ |

---

### 2. Keying and section key

| Contract | Verified |
|----------|----------|
| All override maps keyed by screenId (or screen key) and sectionKey | ✅ Both stores use OverridesMap = Record<screenId, Record<sectionKey, string>> |
| sectionKey = node.id ?? node.role (stable after assignSectionInstanceKeys) | ✅ applyProfileToNode: sectionKey = (node.id ?? node.role) ?? ""; collectSectionKeysAndNodes uses (node.id ?? node.role) ?? ""; assignSectionInstanceKeys (resolve-organs) sets id = node.id ?? section-${index} before expand |
| Card/organ overrides are "per parent section"; sectionKey identifies the section | ✅ Card: parentSectionKey passed through applyProfileToNode; organ: sectionKey from section node |

---

### 3. Persistence

| Contract | Verified |
|----------|----------|
| Section and card overrides persisted to localStorage | ✅ SECTION_STORAGE_KEY, CARD_STORAGE_KEY; loadFromStorage/saveToStorage |
| Organ internal overrides persisted | ✅ STORAGE_KEY; loadFromStorage/saveToStorage |
| Load on read (ensureLoaded), save on write (set* functions) | ✅ |
| No layout store or logic store holds overrides | ✅ layout-store holds experience, templateId, mode, regionPolicy only; no per-section overrides |

---

### 4. Passing into render

| Contract | Verified |
|----------|----------|
| App/page passes getOverridesForScreen(screenKey), getCardOverridesForScreen(screenKey), getOrganInternalLayoutOverridesForScreen(screenKey) into JsonRenderer | ✅ page.tsx: sectionLayoutPresetOverrides = getOverridesForScreen(screenKey); cardLayoutPresetOverrides = getCardOverridesForScreen(screenKey); organInternalLayoutOverridesProp = getOrganInternalLayoutOverridesForScreen(screenKey); passed as props to JsonRenderer |
| screenKey used consistently (screen path or hash-based) | ✅ screenKey = screen ? screen.replace(...) : screen-${hashJson(json)}; used for get* and set* |
| Plain objects (Record<string, string> per screen); resolver does not mutate | ✅ applyProfileToNode only reads sectionLayoutPresetOverrides[sectionKey], etc.; no assignment to override maps |

---

### 5. Precedence and resolver

| Contract | Verified |
|----------|----------|
| Override is first step in precedence (override → explicit → suggestion → default) | ✅ applyProfileToNode: layoutId = overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId |
| applyProfileToNode reads sectionLayoutPresetOverrides[sectionKey] first; same idea for card and organ | ✅ Section: overrideId from sectionLayoutPresetOverrides[sectionKey]; card: cardLayoutPresetOverrides[parentSectionKey]; organ: organInternalLayoutOverrides[sectionKey] in expandOrgans and compatibility |

---

### 6. Override system can / cannot

| Can | Verified |
|-----|----------|
| Store user-chosen layout IDs per screen and section; persist and pass into resolver | ✅ |
| Be first step in precedence | ✅ |

| Cannot | Verified |
|--------|----------|
| Be overwritten by Logic or by automatic "fix" when compatibility invalid | ✅ No code path writes to override stores except setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride (user actions) |
| Be cleared or changed by any path other than user action (OrganPanel / section layout dropdown) | ✅ Only the set* functions and subscribe*; callers are page.tsx (handlers from OrganPanel) and dev dropdown |

---

### 7. Determinism

| Contract | Verified |
|----------|----------|
| Same screen, same section key, same override map ⇒ same resolved layout | ✅ Override map is input; resolution is pure given node + profile + override props |

---

### Conclusion

Step 7 (Override System Alignment) is **verified**. Stores, keying (screenId + sectionKey), persistence (localStorage), and passing into JsonRenderer match the plan. Layout store does not hold per-section overrides; resolver reads overrides first and does not mutate them. Aligns with Logic Plan 2 (overrides user-authored; resolver uses override when present).

**Next:** Proceed to Step 8 — [8_EXPLAINABILITY_AND_TRACE_PLAN.md](8_EXPLAINABILITY_AND_TRACE_PLAN.md) when ready.
