# AUDIT STEP 1 — Template + Palette Wiring Verification (Read-Only)

## 1. Code findings (no files modified)

### 1.1 json-renderer.tsx — where values come from

| What to verify | Source in code | Already logged? |
|----------------|----------------|------------------|
| **Active template id** | `profile?.id` where `profile = profileOverride ?? layoutSnapshot`. Page passes `profileOverride={effectiveProfile}`; `effectiveProfile.id` comes from `getTemplateProfile(effectiveTemplateId)` (template-profiles.json). | Yes: `SYSTEM_STATE.template` (line ~1478), `PROFILE_FINAL.template` (page.tsx ~331), `[LAYOUT INVESTIGATION] Template Profile` (page.tsx). |
| **Active palette id** | Global `getPaletteName()` from palette-store; palette is **not** from template — it’s from `state.values.paletteName ?? getPaletteName()`. Set by RightFloatingSidebar/RightSidebarDock via `setPalette(name)` + `setValue("paletteName", name)`. | Yes: `SYSTEM_STATE.palette` (json-renderer ~1482), `PROFILE_FINAL.palette` (page.tsx). |
| **Resolved layoutId per section** | `getSectionLayoutId(..., { includeRule: true })` in `applyProfileToNode` (lines 413–423). Result: `layoutId`, `ruleApplied`, `variantContainerWidth`. Written to `next.layout`, `(next as any)._effectiveLayoutPreset`. | Yes: `SECTION_DECISION` (section-layout-id.ts ~212), `PipelineDebugStore.mark("section-layout-diagnosis", { resolvedLayoutId, ruleApplied })`, pushTrace/addTraceEvent with `layoutId`, `ruleApplied`. |
| **Resolved containerWidth per section** | `variantContainerWidth ?? containerWidthFromProfile`. `variantContainerWidth` from `getSectionLayoutId` (template `layoutVariants[role].containerWidth`); `containerWidthFromProfile` from `profile.widthByRole[nodeRole]`. Merged into `(next as any)._variantParams.containerWidth` (lines 479–485). | In dev: SectionLayoutDebugOverlay shows `containerWidth` (line ~142); data is in `_variantParams` / `_variantContainerWidth`. No dedicated console label; trace has `variantContainerWidth` in section-layout-id. |

**Override note:** `page.tsx` currently has a **forced template** (line ~249): `forcedTemplateId = "focus-writing-apple"`, and `effectiveTemplateId` uses it when state/layout have no template. So the active template can be forced regardless of UI until that override is removed.

---

### 1.2 section-layout-id.ts — layoutId and which source won

- **Final chosen layoutId:** returned as `layoutId` (and in trace as `final.layoutId`).
- **Which source won:** `ruleApplied` is one of:
  - `"override"` — section preset override (store)
  - `"explicit node.layout"` — node’s `layout` field
  - `"template layoutVariants"` — `templateProfile.layoutVariants[nodeRole]`
  - `"template role"` — `getPageLayoutId(templateId, sectionRole)`
  - `"template default"` — `defaultSectionLayoutIdFromProfile` or `getDefaultFromTemplate(templateId)`
  - `"fallback"` — `"content-stack"`

**Already logged:**  
`console.log("SECTION_DECISION", { role, templateLayout, defaultLayout, nodeLayout, chosen })` (section-layout-id.ts ~212).  
Plus `pushTrace` / `addTraceEvent` with full `priorityChain` and `ruleApplied`.  
Fallback path: `console.warn` when `ruleApplied === "fallback"` (dev only).

---

### 1.3 palette-resolve-token.ts — “FAIL” and token path

- **There is no explicit “paletteContract FAIL” in this file.**  
  `palette-resolve-token.ts` only does:
  - `getPalette()` (from palette-store)
  - `path.split(".").reduce((acc, key) => acc?.[key], palette) ?? path`  
  So if a key is missing, the result is the **raw path string** (passthrough), not a thrown error or a “FAIL” log.
- **Pipeline “palette contract”** (diagnostics): `validatePaletteContract()` in `src/07_Dev_Tools/diagnostics/pipeline/palette/contract.ts` checks for missing roots (`color`, `surface`, `radius`, `padding`, `textSize`, `textWeight`, `textRole`). That is a separate diagnostic; it does not run inside `resolveToken()`.
- **Token path that “failed”:** Any path for which `resolveToken` returns the **same string** as the input (no nested value found) is effectively a failed lookup. There is no current log that says “token path X failed”; the existing `TOKEN_RESOLVE` log (lines 37, 43) runs only for paths containing `"textRole"` or `"color"` and logs the resolved value (which could still be the raw path if unresolved).

So for “log when paletteContract FAIL triggers / show which token path failed”:
- In **palette-resolve-token**: a “fail” is “result === path” (identity). There is no FAIL-specific log today.
- In **palette contract (diagnostics)**: FAIL is when `validatePaletteContract` returns `ok: false` and `failures.length > 0`; the `failures` array lists missing roots (e.g. `"Missing color root"`), not individual token paths.

---

## 2. Browser verification checklist

Use the existing logs (and optional `?layoutDebug=1` for section overlay). No code changes required.

1. **Switch templates** (e.g. in layout/template selector):
   - **Do layoutIds change?** Check console for `SECTION_DECISION` and trace: `chosen` / `layoutId` and `ruleApplied` (e.g. more `"template layoutVariants"` or `"template role"` when template has layoutVariants for that role).
   - **Do containerWidths change?** Check section debug overlay (`?layoutDebug=1`) or trace `variantContainerWidth` / `_variantParams.containerWidth`; compare after switching to a template with different `widthByRole` or `layoutVariants[role].containerWidth`.

2. **Switch palettes** (e.g. in palette panel):
   - **Do palette tokens change?** Check `TOKEN_RESOLVE` (for color/textRole paths) and visual appearance; `SYSTEM_STATE.palette` and `[palette-store] updating` should show the new palette name.

3. **Switch styling preset** (e.g. visualPreset / styling preset):
   - **Effect:** `effectiveProfile.visualPreset` is set from `stylingOverride ?? templateProfile.visualPreset` (page.tsx). This drives visual preset, not layoutId/containerWidth. Check that UI reflects the selected preset (e.g. theme/preset name used by the skin).

4. **Report (fill after testing):**
   - Do layoutIds change when switching templates? (yes/no)
   - Do containerWidths change when switching templates? (yes/no)
   - Do palette tokens change when switching palettes? (yes/no)
   - Any fallback dominance? (e.g. many `SECTION_DECISION` with `chosen: "content-stack"` and `ruleApplied: "fallback"`)

---

## 3. Short report (fill after browser run)

| Question | Answer (yes/no) | Notes |
|----------|-----------------|--------|
| Are templates being read? | | From code: yes — page uses `getTemplateProfile(effectiveTemplateId)` and passes `effectiveProfile` as `profileOverride`; json-renderer uses `profile` in `getSectionLayoutId(..., templateProfile: profile)`. Confirm in UI by template switch and `SECTION_DECISION` / `[LAYOUT INVESTIGATION]`. |
| Are palettes being applied? | | From code: yes — `resolveToken` uses `getPalette()`; palette name comes from state or `getPaletteName()`. Confirm by palette switch and `TOKEN_RESOLVE` / visual change. |
| Are fallbacks dominating? | | Check console: if most sections show `ruleApplied: "fallback"` and `chosen: "content-stack"`, fallback is dominating. If you see `"template layoutVariants"` or `"template role"` for sections with roles defined in template-profiles, template is winning. |
| What layer is overriding the system? | | Candidates: (1) **page.tsx** `forcedTemplateId = "focus-writing-apple"` forces template. (2) **sectionLayoutPresetOverrides** (state/store) overrides section layout (wins over template). (3) **node.layout** in screen JSON wins over template when set. (4) **DISABLE_ENGINE_LAYOUT** in json-renderer (currently `false`) — when true, engine layout is bypassed. |

---

## 4. Summary (code-only)

- **Templates:** Consumed via `getTemplateProfile(effectiveTemplateId)` on the page, merged into `effectiveProfile`, passed as `profileOverride`. Json-renderer uses this in `getSectionLayoutId(..., templateProfile: profile)` and for `widthByRole` / `variantContainerWidth`. Template-profiles.json includes `layoutVariants` and `defaultSectionLayoutId`; section-layout-id uses them in the stated priority order.
- **Palettes:** Applied via palette-store (`getPalette()` / `getPaletteName()`); state can set `paletteName`. Not driven by template-profiles; separate from layout.
- **Fallbacks:** If template is missing or section has no matching role/variant, `getSectionLayoutId` falls back to `"content-stack"` and logs in dev. No explicit “paletteContract FAIL” in palette-resolve-token; pipeline palette contract is a separate diagnostic that reports missing palette roots, not per-token path failures.
