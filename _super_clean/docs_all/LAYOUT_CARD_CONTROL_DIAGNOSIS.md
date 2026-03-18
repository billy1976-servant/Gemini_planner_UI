# Layout ↔ Card Dropdown Control — Diagnosis (Phase 1)

## Who is deciding section layout?

| Source | Location | Role |
|--------|----------|------|
| **Override** | `state.layoutByScreen[screenKey].section` (from `layout.override`) **or** legacy `section-layout-preset-store` when state empty | User selection from section dropdown; page merges state-first then legacy |
| **Template default** | `getSectionLayoutId()` in `section-layout-id.ts`: `defaultSectionLayoutIdFromProfile` or `getDefaultSectionLayoutId(templateId)` | When no override and no node.layout |
| **Template role** | `getPageLayoutId(null, { templateId, sectionRole })` in same resolver | When no override, no node.layout, template + role present |
| **Explicit node.layout** | Same resolver: `node.layout` | JSON/descriptor supplies layout |
| **Fallback** | `undefined` if nothing else | No implicit hardcoded section id |

**Single authority:** `getSectionLayoutId()` in `src/04_Presentation/layout/section-layout-id.ts`. Consumed only by `applyProfileToNode` in `json-renderer.tsx`. No duplicate section resolution elsewhere.

---

## Who is deciding card layout?

| Source | Location | Role |
|--------|----------|------|
| **Override** | `cardLayoutPresetOverrides[sectionKey]` passed from page (state `layoutByScreen[screenKey].card` or legacy `getCardOverridesForScreen`) | User selection from card dropdown; only source used in renderer today |
| **Compatibility filter** | `getAllowedCardPresetsForSectionPreset(sectionLayoutId)` in `capabilities.ts` → `SECTION_TO_CARD_CAPABILITIES[id] ?? [...ALL_CARD_PRESETS]` | Drives **dropdown options** and validity; does not set rendered card (only override does) |
| **Fallback (chaos)** | `getAllowedCardPresetsForSectionPreset(unknown)` returns `[...ALL_CARD_PRESETS]` (7 options) | Unknown section id ⇒ all 7 card presets shown |
| **Implicit component default** | None in renderer when override missing — cards get no preset merge (no mediaPosition/contentAlign from preset) | No auto-default in renderer today |

**Conflict:** Card layout for **rendering** is override-only. Card **options** come from capabilities; for unknown section, capabilities return all presets (chaos). No other code path sets card layout except override.

---

## Where are conflicts happening?

1. **Dual write paths**  
   - `handleSectionLayoutPresetOverride` / `handleCardLayoutPresetOverride` in `page.tsx` write to **both** `dispatchState("layout.override", ...)` and `setSectionLayoutPresetOverride` / `setCardLayoutPresetOverride` (legacy store).  
   - Read path merges: state first, then legacy. So decision path is single at read time, but two writers must stay in sync (already done in same handler).

2. **Chaos fallback for card options**  
   - `getAllowedCardPresetsForSectionPreset(sectionLayoutId)` in `capabilities.ts`: `return allowed ?? [...ALL_CARD_PRESETS]`.  
   - Unknown or unlisted section (e.g. `content-stack` not in map) ⇒ 7 card options.  
   - **Desired:** unknown section ⇒ empty list (or one safe default); do not expose all 7.

3. **Secondary fallback in layoutDependencies**  
   - `getAllowedCardLayouts(sectionLayoutId, allCardLayouts)` in `layoutDependencies.ts`: when `filtered.length === 0 && allCardLayouts.length > 0` it returns `allCardLayouts`.  
   - So even if capabilities returned [], this could still expose all options.  
   - **Desired:** return only filtered list; no fallback to full list.

4. **Section change correctly updates card**  
   - When section layout changes, `handleSectionLayoutPresetOverride` already: updates section override, then if current card not in `allowedCards`, sets card override to `allowedCards[0]` and dispatches card override.  
   - No conflict here; this is the desired “section → allowed cards → if invalid pick first allowed” behavior.

5. **Card dropdown**  
   - Only updates card override (and state); does not touch section. No conflict.

---

## Summary map

- **Section layout:** Decided by `getSectionLayoutId()` using override (state/legacy) → node.layout → template role → template default. Single authority; no duplicate.
- **Card layout:** Decided only by override map at render time. Options come from `getAllowedCardPresetsForSectionPreset`; chaos when section unknown (ALL_CARD_PRESETS). No renderer default when override missing.
- **Conflicts to fix:**  
  - Remove ALL_CARD_PRESETS fallback for unknown section (return [] or one safe default).  
  - Remove layoutDependencies fallback to allCardLayouts.  
  - Add single auto-default for card when no override: first allowed for section (in renderer).  
  - Keep dropdown handlers as-is: section → section + optional card correction; card → card only.

---

# Stabilization pass — completed

## Conflicting decision points removed / neutralized

1. **ALL_CARD_PRESETS fallback** — `getAllowedCardPresetsForSectionPreset(unknown)` now returns `[]` instead of all 7 presets. Unknown section no longer gets 7 card options.
2. **layoutDependencies chaos fallback** — `getAllowedCardLayouts()` now returns only the filtered list; removed `filtered.length > 0 ? filtered : allCardLayouts` so we never expose the full list when allowed is empty or no match.
3. **Card layout source** — Renderer now has a single chain: override → first allowed for section (`getDefaultCardPresetForSectionPreset`) → `SAFE_DEFAULT_CARD_PRESET_ID` ("centered-card"). No component-inferred or implicit defaults elsewhere.

## Files modified

| File | Change |
|------|--------|
| `src/04_Presentation/layout/page/capabilities.ts` | `getAllowedCardPresetsForSectionPreset` returns `allowed ?? []`; added `SAFE_DEFAULT_CARD_PRESET_ID` and JSDoc. |
| `src/04_Presentation/layout/page/index.ts` | Export `SAFE_DEFAULT_CARD_PRESET_ID`. |
| `src/app/ui/control-dock/layout/layoutDependencies.ts` | `getAllowedCardLayouts` returns `filtered` only (no fallback to `allCardLayouts`). |
| `src/03_Runtime/engine/core/json-renderer.tsx` | `applyProfileToNode` takes `parentSectionLayoutId`; card preset = override → default for section → safe default; repeater uses same chain; imports for `getDefaultCardPresetForSectionPreset`, `SAFE_DEFAULT_CARD_PRESET_ID`. |
| `src/app/page.tsx` | Comment documenting section vs card dropdown contract; section handler only corrects card when allowed list non-empty and current invalid/missing. |

## Final control chain (verified)

- **Section dropdown** → updates section override only (+ optional card correction when current card invalid for new section).
- **Card dropdown** → updates card override only; no section changes.
- **Renderer** → section layout from `getSectionLayoutId(override → node → template)`; card layout from override → first allowed for section → `SAFE_DEFAULT_CARD_PRESET_ID`.
- **Dropdown options** — Section: registry filtered by compatibility. Card: `getAllowedCardPresetsForSectionPreset(sectionLayoutId)` (unknown section ⇒ []).
- No hidden defaults, no silent overrides, no duplicate authorities. Single flow: section layout → allowed cards → card override (or auto-default) → renderer reads override/default only.
