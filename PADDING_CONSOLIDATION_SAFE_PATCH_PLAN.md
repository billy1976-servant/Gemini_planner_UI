# System Refactor Plan — Padding Consolidation (Safe Mode)

**STRICT: Analysis + patch plan only. No removals. No edits to atoms, molecules, or TSX. No defaults inserted.**

**Objective:** Prepare a safe, reversible path so layout becomes the only horizontal padding authority.

---

# STAGE 1 — Live Padding Owners Report

Scanned for: `padding`, `paddingLeft`, `paddingRight`, `paddingInline`, `gap`, `maxWidth`, `marginLeft`, `marginRight`.

Legend: **H** = horizontal padding, **V** = vertical padding, **W** = width constraint, **G** = gap, **R** = radius, **Token** = CSS var or palette token, **Hardcode** = px/rem/number.

---

## A) layout.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 224 | `style={{ padding: 0 }}` (app-content) | — | — | — | — | — | Hardcode 0 (no padding) |
| 242 | `padding: "12px"` (phone frame device) | **H** | **V** | — | — | — | **Hardcode** 12px |

**Do NOT change (per requirements):** Phone frame inset (242), debug panels, nav bars, chrome.

**Content-flow impact:** app-content is already 0; phone frame 12px is device chrome only.

---

## B) page.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 769 | `gap: "var(--spacing-8)"` (website wrapper) | — | — | — | **G** | — | Token |
| 786 | `paddingRight: contentPaddingRight` (app content div) | **H** (R only) | — | — | — | — | Dynamic 0 or 424 |
| 833 | `paddingRight: contentPaddingRight` (learning wrapper) | **H** (R only) | — | — | — | — | Dynamic |
| 843 | `paddingRight: contentPaddingRight` (website content div) | **H** (R only) | — | — | — | — | Dynamic |

**Stacks with:** ExperienceRenderer, shells. `contentPaddingRight` is sidebar offset, not general inset.

---

## C) ExperienceRenderer

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 103 | `gap: "var(--spacing-8)"` (website) | — | — | — | **G** | — | Token |
| 110 | `gap: "var(--spacing-4)"` (app) | — | — | — | **G** | — | Token |
| 113 | `padding: "var(--spacing-4)"` (app wrapper) | **H** | **V** | — | — | — | Token |
| 112 | `maxWidth: "100%"` (app) | — | — | **W** | — | — | Hardcode |
| 122 | `maxWidth: "min(820px, 100%)"` (learning) | — | — | **W** | — | — | Hardcode |
| 124 | `padding: "var(--spacing-8)"` (learning wrapper) | **H** | **V** | — | — | — | Token |
| 201 | `gap: "var(--spacing-4)"` (learning footer) | — | — | — | **G** | — | Token |
| 202 | `padding: "var(--spacing-4) var(--spacing-6)"` (learning footer) | **H** | **V** | — | — | — | Token |
| 214, 231 | `padding: "var(--spacing-2) var(--spacing-4)"` (buttons) | **H** | **V** | — | — | — | Token (footer UI) |

**Stacks with:** AppShell/LearningShell below, page above. App + Learning wrappers add **horizontal** padding to content flow.

---

## D) Shells

### WebsiteShell.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 49–50 | `paddingTop: "var(--spacing-6)"`, `paddingBottom: "var(--spacing-16)"` | — | **V** | — | — | — | Token |
| 42, 53 | `maxWidth: "100%"` | — | — | **W** | — | — | Hardcode |

No horizontal padding in shell (CSS strips site-container-inner L/R). **Vertical only.**

### AppShell.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 37 | `padding: 12` (aside nav) | **H** | **V** | — | — | — | **Hardcode** |
| 55 | `padding: "8px 16px"` (header) | **H** | **V** | — | — | — | **Hardcode** |
| 66 | `padding: 16` (content grid) | **H** | **V** | — | — | — | **Hardcode** |
| 78 | `padding: 12` (sidebar panel) | **H** | **V** | — | — | — | **Hardcode** |
| 92 | `padding: "12px 16px"` (footer strip) | **H** | **V** | — | — | — | **Hardcode** |

**All inject horizontal padding** into content flow (except nav aside, which is chrome-adjacent).

### LearningShell.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 32 | `padding: "16px 16px"` (header div) | **H** | **V** | — | — | — | **Hardcode** |
| 35 | `padding: "32px 16px 40px"` (main) | **H** | **V** | — | — | — | **Hardcode** |
| 51 | `padding: "16px 16px"` (footer div) | **H** | **V** | — | — | — | **Hardcode** |
| 32, 35, 51 | `maxWidth: 820`, `margin: "0 auto"` | — | — | **W** | — | — | Hardcode |

**All inject horizontal padding** (16px L/R).

### GlobalAppSkin.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 153, 170 | `padding: 0` (root/content) | — | — | — | — | — | Stripped |
| 179 (Tailwind) | `px-2` (nav) | **H** | — | — | — | — | **Hardcode** (nav bar) |

**Do NOT change:** Nav bar (chrome). Content wrappers already 0.

---

## E) LayoutMoleculeRenderer.tsx

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 285, 317 | `moleculeLayout.params.padding` → splitLayoutStyle.padding | **H** | **V** | — | — | — | From layout JSON (token/rem) |
| 284, 316, 451 | `gap` from moleculeLayout.params | — | — | — | **G** | — | From layout JSON |
| 297–299, 491, 497 | `padding: 0` (wrappers / combinedOuter) | — | — | — | — | — | Stripped (no padding applied) |
| 393–425, 430–439 | maxWidth, marginLeft, marginRight from container | — | — | **W** | — | — | Token / layout |

**Note:** Outer padding is currently **stripped** (491, 497). Layout-owned padding would be applied here when enabled (single authority). Horizontal padding today only appears when split layout has `moleculeLayout.params.padding`.

---

## F) Layout JSON

### template-profiles.json

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 40, 989, 1992, 2045, 2054, 2103, 2160, 2168, 2272, 2281, 2330, 2338, 2387, 2395, 2445, 2453 | `"padding": "Nrem 0"` (section params) | — | **V** | — | — | — | **Hardcode** rem |

All section padding in template-profiles is **vertical only** (e.g. "3rem 0", "2rem 0"). No horizontal in this file.

### layout-definitions.json

No padding in definitions; contentColumn has `gap` only (e.g. `var(--spacing-6)`). **G** only, no padding.

---

## G) molecules.json

| Location | Property | H | V | W | G | R | Token / Hardcode |
|----------|----------|---|---|---|---|---|-------------------|
| 5, 10, 24, 29, 34, 39, 44, 50–52, 59, 65, 71, 77, 83, 90–92, 99, 103, 108–109, 118, 123–125, 133, 138, 143–144, 160, 164, 201, 206, 212–214, 252, 257, 262, 265, 270, 273, 278, 281, 286, 289, 294, 297, 302, 305, 336, 340, 345, 346 | `surface.padding` or `field.padding` | **H** | **V** | — | — | — | **Token** (padding.xs/sm/md/lg, spacing.cardPadding, spacing.inlinePadding, or "4rem 2rem 2rem", "0.75rem 1.5rem") |

These are **defaults** passed to atoms (Surface/Field). They drive horizontal + vertical padding when atoms apply `params.padding`. Radius is separate (e.g. radius.lg) in same file.

---

## H) Atoms (pass-through only)

| File | Location | Property | H | V | W | G | R | Token / Hardcode |
|------|----------|----------|---|---|---|---|---|-------------------|
| surface.tsx | 25 | `padding: resolveToken(params.padding)` | **H** | **V** | — | — | — | Pass-through (token from caller) |
| field.tsx | 46 | `padding: resolveToken(params.padding)` | **H** | **V** | — | — | — | Pass-through |
| shell.tsx | 16 | `padding: resolveToken(params.padding)` | **H** | **V** | — | — | — | Pass-through |
| sequence.tsx | 36–37, 56, 78 | `padding: tok(p.padding)` | **H** | **V** | — | — | — | Pass-through |
| collection.tsx | 37, 53 | `padding: toCssGapOrPadding(params.padding)` | **H** | **V** | — | — | — | Pass-through |
| sequence.tsx | 36 | `gap: tok(p.gap)` | — | — | — | **G** | — | Pass-through |
| collection.tsx | 36, 53 | `gap: toCssGapOrPadding(params.gap)` | — | — | — | **G** | — | Pass-through |

Atoms do **not** hardcode padding; they apply only what is passed. Callers (molecules + layout) supply values from molecules.json or layout JSON.

---

# STAGE 2 — Safe Migration Patch Plan (No Execution)

## Phase A — Remove horizontal padding only from wrappers

**Scope:** ExperienceRenderer, AppShell, LearningShell, WebsiteShell, page.tsx wrappers.  
**Do NOT change:** layout.tsx phone frame, debug panels, nav bars, chrome.

### Exact file list that injects horizontal padding (content flow)

1. **src/03_Runtime/engine/core/ExperienceRenderer.tsx**
   - Line 113: `padding: "var(--spacing-4)"` (app wrapper) — **H + V**
   - Line 124: `padding: "var(--spacing-8)"` (learning wrapper) — **H + V**
   - Lines 202, 214, 231: learning footer padding — **H + V** (footer UI; can treat as chrome or leave for Phase A.1)

2. **src/06_Data/site-skin/shells/AppShell.tsx**
   - Line 37: `padding: 12` (aside) — **H + V** (nav chrome; per rules do not change nav — so **exclude** from Phase A or mark “optional later”.)
   - Line 55: `padding: "8px 16px"` (header) — **H + V**
   - Line 66: `padding: 16` (content grid) — **H + V**
   - Line 78: `padding: 12` (sidebar panel) — **H + V**
   - Line 92: `padding: "12px 16px"` (footer strip) — **H + V**

3. **src/06_Data/site-skin/shells/LearningShell.tsx**
   - Line 32: `padding: "16px 16px"` (header) — **H + V**
   - Line 35: `padding: "32px 16px 40px"` (main) — **H + V**
   - Line 51: `padding: "16px 16px"` (footer) — **H + V**

4. **src/06_Data/site-skin/shells/WebsiteShell.tsx**
   - Lines 49–50: vertical only — **no horizontal**; no change for H. (Optional: move V to layout later.)

5. **src/app/page.tsx**
   - Lines 786, 833, 843: `paddingRight: contentPaddingRight` — **H (right only)** for sidebar offset. Either keep as-is (sidebar is chrome) or document as “single reserved R offset” and do not add any other horizontal padding here.

### Which ones stack together

- **App path:** AppShell content grid (16) + ExperienceRenderer app (16) → **32px L + 32px R** before any layout/molecule/atom.
- **Learning path:** LearningShell main (16 L/R) + ExperienceRenderer learning (32) → **48px L + 48px R**.
- **Website path:** No shell horizontal (already 0); ExperienceRenderer website has no padding, only gap. page.tsx only adds paddingRight for sidebar.

### Safe removal order (Phase A)

1. **ExperienceRenderer** — remove horizontal from app wrapper (113) and learning wrapper (124). Replace with `paddingLeft: 0`, `paddingRight: 0` or remove padding and set only vertical if desired. **First** so shell padding is the only remaining wrapper padding.
2. **LearningShell** — remove horizontal from header (32), main (35), footer (51). Keep vertical or set to 0 and let layout own later.
3. **AppShell** — remove horizontal from **content grid** (66) and **header** (55), **footer strip** (92), **sidebar panel** (78). Do **not** remove nav aside (37) per “do not change nav bars.”
4. **page.tsx** — no removal of horizontal padding unless contentPaddingRight is refactored to layout/shell contract; otherwise leave as-is.

### Risk level per removal

| Removal | Risk | Reason |
|---------|------|--------|
| ExperienceRenderer app padding (113) | **Medium** | Content will touch wrapper edges until layout supplies padding. Revert single file. |
| ExperienceRenderer learning padding (124) | **Medium** | Same. Revert single file. |
| LearningShell header/main/footer horizontal | **Medium** | Same. One file revert. |
| AppShell content grid padding (66) | **Medium** | Primary content area; layout must supply. One file revert. |
| AppShell header (55), footer (92), sidebar (78) | **Low–Medium** | Smaller surfaces; layout or section can supply. One file revert. |

### Revert strategy (Phase A)

- **Per file:** Git revert the commit that changed that file (e.g. `git revert <commit> -- src/03_Runtime/engine/core/ExperienceRenderer.tsx`).
- **Full Phase A:** Tag before Phase A (e.g. `pre-padding-consolidation-phase-a`). To revert entire phase: `git revert --no-commit <range>` over the Phase A commits, then commit “Revert Phase A padding consolidation.”
- **Branch:** Do Phase A on a branch; merge only after layout is supplying horizontal padding and visual QA passes.

---

## Phase B — Remove padding defaults from molecules.json

**Scope:** molecules.json only. No TSX, no atoms.

- Remove or null out every `surface.padding` and `field.padding` in presets/variants so that no default padding is passed to atoms. Layout/section-level config must supply padding via layout JSON or section params.
- **Risk:** **High** — all cards/fields/buttons that rely on preset padding will lose it until layout provides it. Do **after** Phase D (layout authority) is in place, or in lockstep with it.
- **Safe removal order:** After Phase D is done (layout defines horizontal padding), remove preset paddings in one commit; if layout does not yet pass padding to molecules, follow with a second change that wires layout padding into molecule params.
- **Revert:** Single file revert of molecules.json.

---

## Phase C — Convert atoms to pass-through only

**Scope:** Atoms: apply padding only if param exists (no resolveToken when param is undefined).

- **surface.tsx:** `padding: params.padding != null ? resolveToken(params.padding) : undefined` (or omit key when undefined).
- **field.tsx:** Same.
- **shell.tsx:** Same.
- **sequence.tsx:** `padding` only when `p.padding` is defined.
- **collection.tsx:** `padding` only when `params.padding` is defined.

**Do NOT** add defaults (0 or any fallback). Pass-through only.

- **Risk:** **Medium** — any caller that relied on implicit default (e.g. from palette) will see no padding until they pass it. Revert per file.
- **Revert:** Revert each atom file independently.

---

## Phase D — Layout as single horizontal padding owner

**Scope:** Layout JSON + LayoutMoleculeRenderer (and optionally template-profiles).

- Define in layout-definitions.json or template-profiles a single **content inset** (e.g. horizontal padding) per layout or template.
- In LayoutMoleculeRenderer, **apply** that padding on the section/layout wrapper (e.g. outerStyle or inner wrapper). **Stop stripping** outer padding (remove or relax the DEBUG strip at 491/497) so that layout-driven padding is the only horizontal padding in the content flow.
- Ensure no other layer (ExperienceRenderer, shells, page) re-adds horizontal padding to main content.

- **Risk:** **Medium** — depends on correct wiring from template/layout to renderer. Revert layout JSON + LayoutMoleculeRenderer changes.
- **Revert:** Revert layout-definitions/template-profiles and LayoutMoleculeRenderer commits.

---

# OUTPUT SUMMARY

## 1) Exact file list that injects horizontal padding (content flow)

| # | File | Lines | Notes |
|---|------|-------|--------|
| 1 | ExperienceRenderer.tsx | 113, 124, 202, 214, 231 | App/Learning wrappers + learning footer |
| 2 | AppShell.tsx | 37, 55, 66, 78, 92 | Nav (exclude), header, content grid, sidebar, footer |
| 3 | LearningShell.tsx | 32, 35, 51 | Header, main, footer |
| 4 | WebsiteShell.tsx | — | Vertical only; no H |
| 5 | page.tsx | 786, 833, 843 | paddingRight only (sidebar offset) |
| 6 | LayoutMoleculeRenderer.tsx | 285, 317 | When moleculeLayout.params.padding set (layout JSON) |
| 7 | molecules.json | Many | Preset padding → atoms (indirect H+V) |
| 8 | Atoms (surface, field, shell, sequence, collection) | — | Pass-through only; no intrinsic H |

## 2) Which ones stack together

- **App:** AppShell content (16) + ExperienceRenderer (16) → 32px L+R; then layout/molecule/atom if present.
- **Learning:** LearningShell main (16) + ExperienceRenderer (32) → 48px L+R; then layout/molecule/atom.
- **Website:** No shell H; page only paddingRight for sidebar. Gap from page + ExperienceRenderer.
- **Layout + molecules.json + atoms:** Section padding (if any) + card/field preset padding + atom pass-through → additional stack when all present.

## 3) Safe removal order

1. Phase A: ExperienceRenderer (app + learning horizontal) → LearningShell (header/main/footer H) → AppShell (content grid, header, footer, sidebar H; keep nav).
2. Phase D: Layout as single owner (define + apply in layout, stop stripping in renderer).
3. Phase B: molecules.json padding defaults (after or with Phase D).
4. Phase C: Atoms pass-through only (can be before or after B; after D is safer).

## 4) Risk level per removal

| Item | Risk | Revert |
|------|------|--------|
| ExperienceRenderer app/learning padding | Medium | Single file |
| LearningShell horizontal | Medium | Single file |
| AppShell (non-nav) horizontal | Low–Medium | Single file |
| molecules.json defaults | High | Single file |
| Atoms pass-through | Medium | Per file |
| Layout authority (Phase D) | Medium | Layout + renderer |

## 5) Revert strategy

- **Per change:** `git revert <commit> -- <file>`.
- **Phase A:** Branch + tag before; revert branch or revert commit range.
- **Phase B/C/D:** Same; tag before each phase. Keep a single “padding-consolidation” branch and revert by reverting the merge or the range of commits.

**No file edits were made. Plan only.**
