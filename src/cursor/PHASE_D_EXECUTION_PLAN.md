# Phase D — Optional Surface Reduction + Glue Absorption (Safe Mode)

**Mode:** Analysis only. No code modifications until this plan is approved.

**Objectives:** Identify absorbable glue, config surface, organs/compounds reduction strategy; produce file reduction estimate, exact files to touch, and risk labels.

---

## 1. Glue layer classification

### 1.1 layout-bridge (`lib/site-renderer/layout-bridge.tsx`)

| Attribute | Finding |
|-----------|---------|
| **Role** | Connects layout-store and experience profiles to site renderer. Exposes `useSectionLayout(sectionType, experience, override)` and `useContainerLayout(experience)`. Converts resolved layout to React CSS properties. |
| **Consumers** | **Single:** `engine/site-runtime/GeneratedSiteViewer.tsx` — imports `useContainerLayout` only. `useSectionLayout` is documented as "Currently unused in the main app." |
| **Classification** | **B) Can be absorbed into parent module** |
| **Absorption option** | Move `useContainerLayout` (and optionally `useSectionLayout`) into `GeneratedSiteViewer.tsx` as local helpers or into a new `lib/site-renderer/site-layout-hooks.tsx`; delete `layout-bridge.tsx`. If inlined into GeneratedSiteViewer, one less file and no new file. |
| **Risk** | **Medium** — Secondary path only; but we touch the only consumer and remove a documented API. Reversible. |
| **Label** | **Medium** (absorb only if secondary-path simplification is desired) |

### 1.2 palette-bridge (`lib/site-renderer/palette-bridge.tsx`)

| Attribute | Finding |
|-----------|---------|
| **Role** | Applies active palette (from state.values.paletteName or palette-store) to CSS variables on document root. Single hook `usePaletteCSS(containerRef?)`. |
| **Consumers** | **Single:** `app/layout.tsx` — calls `usePaletteCSS()` on trunk. |
| **Classification** | **A) Must remain** |
| **Reason** | Clear boundary between state/palette-store and DOM CSS. Inlining into `layout.tsx` would add ~130 lines to the root layout; moving to another file is a rename, not reduction. No safe absorption that reduces surface without blurring boundaries. |
| **Risk** | N/A — do not change. |
| **Label** | **Do-not-touch** |

### 1.3 engineToSkin.bridge (`logic/bridges/engineToSkin.bridge.ts`)

| Attribute | Finding |
|-----------|---------|
| **Role** | Thin wrapper: `buildSiteSkinDataBag({ siteData, engineOutput })` (calls `siteDataToSlots` + merges site/engine); `resolveSiteSkin({ skin, siteData, engineOutput })` (builds data bag + `applySkinBindings`). |
| **Consumers** | **Single:** `screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx` — imports `buildSiteSkinDataBag` only. |
| **Classification** | **B) Can be absorbed into parent module** |
| **Absorption option** | Move `buildSiteSkinDataBag` and `resolveSiteSkin` into `logic/bridges/skinBindings.apply.ts` (or export from there after re-exporting from a small engine-to-skin module in lib/site-skin). Update `SiteSkinPreviewScreen.tsx` to import from `skinBindings.apply`. Delete `engineToSkin.bridge.ts`. |
| **Risk** | **Low** — Single consumer; pure helper functions; no behavior change. |
| **Label** | **Safe** |

### 1.4 runtime-verb-interpreter (`logic/runtime/runtime-verb-interpreter.ts`)

| Attribute | Finding |
|-----------|---------|
| **Role** | Normalizes verb (Action-style or direct) and calls `runAction(verb, state)`. Pure pass-through; no branching beyond normalization. |
| **Consumers** | **Two:** `engine/core/behavior-listener.ts` (dynamic require), `logic/runtime/interaction-controller.ts` (static import). |
| **Classification** | **A) Must remain** (in safe mode) |
| **Reason** | Inlining into behavior-listener would require interaction-controller to import from engine/core (logic → engine coupling) or duplicate normalization. Keeping the small dedicated file preserves a single implementation and avoids touching behavior-listener. |
| **Risk** | N/A — do not change. |
| **Label** | **Do-not-touch** |

---

## 2. Config surface

### 2.1 Current state

| File | Consumers | Keys used |
|------|------------|-----------|
| `config/config.json` | `contracts/renderer-contract.ts` | `config.rendererContract` (nonActionableTypes) |
| `config/config.json` | `state/state-store.ts` | `config.stateDefaults` (defaultInitialView) |

**config.json structure (current):**
```json
{
  "rendererContract": { "nonActionableTypes": ["section","field","avatar"] },
  "stateDefaults": { "defaultInitialView": "|home" },
  "uiVerbMap": { "tap": "action.primary", ... }
}
```

### 2.2 Import map

- **renderer-contract.ts:** `import config from "@/config/config.json";` → uses `config.rendererContract`.
- **state-store.ts:** `import config from "@/config/config.json";` → uses `config.stateDefaults`.
- **uiVerbMap:** No direct import found in runtime code (documented / reserved). No split needed for it.

### 2.3 Recommendation

- **Keep single file:** `config/config.json` with keys `rendererContract`, `stateDefaults`, `uiVerbMap`.
- **Reason:** Two consumers, one file; no conflicting domains. Splitting would require two JSON files and two loader paths with no runtime or boundary benefit.
- **Zero runtime change:** No action in Phase D. Document as "single config surface" if not already.

**Label:** **Do-not-touch** (no structural change).

---

## 3. Organs and compounds

### 3.1 Organs

| Attribute | Finding |
|-----------|---------|
| **Current** | `organs/organ-registry.ts` statically imports 60+ variant JSON files from `organs/*/variants/*.json` and builds `VARIANTS[organId][variantId]`. Single consumer of that map: `loadOrganVariant(organId, variantId)` and related exports. |
| **Build-time bundle** | Technically possible: a script could emit `organs/organs.json` (e.g. `{ "header": { "default": {...}, ... }, "hero": { ... }, ... }`) and organ-registry could load from that single file. |
| **Risks** | (1) Build step must run before runtime or dev; (2) organ-registry must switch from static imports to one dynamic read; (3) tests (e.g. organs.layer4.test.ts) and any direct imports of variant JSON would need to be updated; (4) possible path/ordering issues. |
| **Recommendation** | **Do not execute in Phase D safe mode.** Document as optional follow-up with Medium risk. Only recommend when a zero-risk build pipeline exists (e.g. script that runs on build and is required by dev). |
| **Label** | **Do-not-touch** (optional later; not zero behavioral risk in safe mode) |

### 3.2 Compounds

| Attribute | Finding |
|-----------|---------|
| **Current** | `compounds/ui/compound-definitions.json` — single file. Consumed by `compounds/ui/index.ts` and `compounds/ui/definitions/registry.ts`. |
| **Authority** | Already single-authority; no multi-file compound definition surface. |
| **Recommendation** | No change. |
| **Label** | **Do-not-touch** (already consolidated) |

---

## 4. File reduction estimate

| Change | Files removed | Files created | Net | Notes |
|--------|----------------|---------------|-----|--------|
| Absorb layout-bridge into GeneratedSiteViewer | 1 (layout-bridge.tsx) | 0 | **−1** | Move hook(s) into consumer; update 1 import. |
| Absorb engineToSkin into skinBindings.apply | 1 (engineToSkin.bridge.ts) | 0 | **−1** | Move 2 functions; update 1 import. |
| palette-bridge | 0 | 0 | 0 | Do not touch. |
| runtime-verb-interpreter | 0 | 0 | 0 | Do not touch. |
| Config / organs / compounds | 0 | 0 | 0 | No structural change. |
| **Total (if both absorptions done)** | **2** | **0** | **−2** | |

**Conservative (safe-only):** Absorb only engineToSkin → **−1 file**.  
**With medium-risk:** Also absorb layout-bridge → **−2 files.**

---

## 5. Glue absorption plan (execution steps)

### 5.1 Safe: engineToSkin.bridge absorption

1. **Open** `logic/bridges/skinBindings.apply.ts`.
2. **Add** (or re-export) the two functions from `engineToSkin.bridge.ts`: `buildSiteSkinDataBag`, `resolveSiteSkin`. Add any types/imports they need (NormalizedSite, SiteSkinDocument, siteDataToSlots, applySkinBindings).
3. **Open** `screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx`.
4. **Change** import from `@/logic/bridges/engineToSkin.bridge` to `@/logic/bridges/skinBindings.apply` (or the module that now exports `buildSiteSkinDataBag`).
5. **Delete** `logic/bridges/engineToSkin.bridge.ts`.
6. **Verify** no other imports of `engineToSkin.bridge` or `buildSiteSkinDataBag`/`resolveSiteSkin` from elsewhere.

**Files to touch:** `skinBindings.apply.ts`, `SiteSkinPreviewScreen.tsx`; delete `engineToSkin.bridge.ts`.  
**Risk level:** **Safe.**

### 5.2 Medium: layout-bridge absorption

1. **Open** `engine/site-runtime/GeneratedSiteViewer.tsx`.
2. **Move** the implementation of `useContainerLayout(experience)` from `layout-bridge.tsx` into this file (e.g. as a local function or inline effect). Ensure imports for `resolveProfileLayout`, `resolveScreenLayout`, and any layout-store usage are added.
3. **Remove** the import of `useContainerLayout` from `@/lib/site-renderer/layout-bridge`.
4. **Optional:** If `useSectionLayout` is to be preserved for future use, move it into a small `lib/site-renderer/site-layout-hooks.tsx` and have GeneratedSiteViewer (or others) import from there; then delete `layout-bridge.tsx`. Otherwise, move only `useContainerLayout` into GeneratedSiteViewer and delete `layout-bridge.tsx` (useSectionLayout would be removed).
5. **Delete** `lib/site-renderer/layout-bridge.tsx`.
6. **Update** `lib/site-renderer/LAYOUT_INTEGRATION_GUIDE.md` if it references layout-bridge (document new location).

**Files to touch:** `GeneratedSiteViewer.tsx`, optionally `site-layout-hooks.tsx`; delete `layout-bridge.tsx`; optionally doc.  
**Risk level:** **Medium** (secondary path; document "reserved for future" API may be removed or relocated).

---

## 6. Exact files to touch (summary)

| Action | File | Risk |
|--------|------|------|
| Edit | `logic/bridges/skinBindings.apply.ts` | Safe |
| Edit | `screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx` | Safe |
| Delete | `logic/bridges/engineToSkin.bridge.ts` | Safe |
| Edit | `engine/site-runtime/GeneratedSiteViewer.tsx` | Medium |
| Delete | `lib/site-renderer/layout-bridge.tsx` | Medium |
| Optional doc | `lib/site-renderer/LAYOUT_INTEGRATION_GUIDE.md` | Safe |

**Do not touch:**  
`lib/site-renderer/palette-bridge.tsx`, `logic/runtime/runtime-verb-interpreter.ts`, `engine/core/behavior-listener.ts`, `config/config.json`, `state/state-store.ts`, `contracts/renderer-contract.ts`, `organs/organ-registry.ts`, `compounds/ui/compound-definitions.json`, layout authority, renderer role, state layer, engine-bridge.

---

## 7. Risk level per change

| Change | Risk | Rationale |
|--------|------|-----------|
| Absorb engineToSkin into skinBindings | **Safe** | Single consumer; thin wrapper; no behavior change. |
| Absorb layout-bridge into GeneratedSiteViewer | **Medium** | Secondary path only; removes a documented hook file; reversible. |
| Touch palette-bridge | **Do-not-touch** | Trunk consumer; clear boundary; no benefit from absorption. |
| Touch runtime-verb-interpreter | **Do-not-touch** | Two callers; inlining would couple logic to engine or duplicate logic. |
| Config split/merge | **Do-not-touch** | No structural improvement; single file is already optimal. |
| Organs build-time bundle | **Do-not-touch** | Medium risk; build step and loader change; defer. |
| Compounds | **Do-not-touch** | Already single-authority. |

---

## 8. Phase D execution plan (summary)

1. **Safe mode (recommended):** Execute only **engineToSkin absorption** (Section 5.1). Net **−1 file**, no trunk or behavior change.
2. **Optional (medium risk):** In addition, execute **layout-bridge absorption** (Section 5.2). Net **−2 files** total.
3. **No change:** palette-bridge, runtime-verb-interpreter, config, organs, compounds.
4. **Rules respected:** Layout authority, renderer role, behavior-listener order, engine-bridge, state layer unchanged. Structural changes only; no runtime logic edits.

**Estimated file reduction:** 1 (safe) or 2 (with layout-bridge).  
**Output:** Phase D execution plan with Safe / Medium / Do-not-touch labels and exact files to touch as above.
