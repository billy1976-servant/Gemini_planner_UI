# Phase 1 — Proof of Template Impact — VERIFICATION

**Status**: ✅ IMPLEMENTED  
**Date**: 2026-01-31

---

## What was fixed

### Root cause identified
The Template dropdown had no visible effect because `applyProfileToNode` in `json-renderer.tsx` used a strict lowercase type check:

```typescript
if (node.type === "section" && node.role && profile.sections?.[node.role])
```

Blueprint compiler outputs `type: "Section"` (capital S), so the condition was always false. Template layouts were never applied.

### Fix applied
Changed line 196 in `src/engine/core/json-renderer.tsx`:

**Before:**
```typescript
if (node.type === "section" && node.role && profile.sections?.[node.role]) {
```

**After:**
```typescript
const isSection = node.type?.toLowerCase?.() === "section";

if (isSection && node.role && profile.sections?.[node.role]) {
```

### Verification logging added
1. **applyProfileToNode**: Logs when template layout is applied (nodeId, role, layoutType, layoutParams)
2. **JsonRenderer root**: Logs active profile (section roles, visualPreset, templateId)

---

## How to verify

### Step 1: Open a JSON screen with Sections
Navigate to a screen with Section nodes, e.g.:
```
?screen=apps/journal_track/app
```

### Step 2: Open browser DevTools Console
Look for these logs:

**Profile active (should appear on load):**
```
[JsonRenderer] 🎨 Profile active {
  hasSections: true,
  sectionRoles: ["header", "hero", "content", "features", "products", "footer"],
  visualPreset: "default",
  templateId: "modern-hero-centered"
}
```

**Template layout applied (should appear for each Section with a role):**
```
[applyProfileToNode] ✅ Template layout applied {
  nodeId: "|TrackLesson",
  role: "header",
  layoutType: "row",
  layoutParams: { gap: "1rem", justify: "space-between", align: "center", wrap: "wrap" }
}
```

### Step 3: Change the Template dropdown
In the Navigator panel, change the Template dropdown from "Modern Hero Centered" to another template (e.g. "Startup Split Hero" or "Editorial Story").

**Expected result:**
- Console logs show new layoutType and layoutParams
- DOM structure changes (inspect the Section wrapper in Elements tab)
- Visual layout changes (e.g. row → column, different gap)

### Step 4: Inspect DOM
In Elements tab, find a Section node (look for `data-node-id="|TrackLesson"` or similar). Check its wrapper:

**Before fix:** No layout wrapper, or layout wrapper with default params.

**After fix:** Layout wrapper (div with `display: flex` or `display: grid`) with params from template:
- `flexDirection: "row"` or `"column"`
- `gap: "1rem"` or other value from template
- `alignItems`, `justifyContent`, etc.

---

## Verification checklist (Phase 1)

- [x] Section nodes from app.json have type "Section" (capital S) — confirmed in `apps/journal_track/app.json`
- [x] applyProfileToNode condition changed to case-insensitive
- [x] Verification logging added (profile active + layout applied)
- [ ] **USER TEST**: Template dropdown changes Section layout visibly (gap, direction, etc.)
- [ ] **USER TEST**: Console logs show template layout applied with correct role and params
- [ ] **USER TEST**: No regression on palette or behavior (buttons still work, colors unchanged)

---

## Known limitations (Phase 1 scope)

1. **Only top-level Sections get roles**: `inferRolesFromOfflineTree` only assigns roles to direct children of screen root. Nested Sections (e.g. ThinkSection inside TrackLesson) have no role, so template layout is not applied to them.
   - **Impact**: For `journal_track/app`, only the first Section (TrackLesson) gets role "header". The nested Sections (ThinkSection, RepentSection, etc.) are not affected by template changes.
   - **Phase 2 fix**: Expand role inference to recurse, or require explicit roles in blueprint/JSON.

2. **Limited role set**: Current inference assigns only "header" (first Section) and "content" (rest). Templates define header, hero, content, features, products, footer—but only header and content will match.
   - **Impact**: Template sections for hero, features, products, footer are unused.
   - **Phase 2 fix**: Deterministic role contract with all nine roles.

3. **Visual preset from template**: The fix enables template `sections` to apply. Template `visualPreset` is also passed but its impact depends on preset JSON coverage.
   - **Phase 4**: Expand visual presets for dramatic difference.

---

## Fast failure detection

**If template change has no visible effect:**

1. Check console for `[JsonRenderer] 🎨 Profile active` log:
   - **Not present**: profileOverride not passed from page.tsx, or profile is null/undefined.
   - **Present but sectionRoles is empty**: Template has no sections, or getTemplateProfile returned null.

2. Check console for `[applyProfileToNode] ✅ Template layout applied` log:
   - **Not present**: No Section node has a role that matches template sections keys, OR the type check still fails (verify fix was applied).
   - **Present**: Layout is applied; if no visual change, check DOM (layout wrapper may be present but not visible due to other styles).

3. Inspect DOM for Section wrapper:
   - **No wrapper with flex/grid**: Layout not applied or layout type is invalid.
   - **Wrapper present but no visual change**: Params (gap, align, etc.) may be overridden by other styles, or children are not rendering.

---

## Next steps (Phase 2)

1. **Expand role inference**: Make `inferRolesFromOfflineTree` recurse or add explicit role assignment in blueprint compiler.
2. **Role contract**: Define and validate the nine roles (header, hero, content, features, gallery, testimonials, pricing, faq, footer).
3. **Test with multi-section screen**: Create or use a screen with multiple top-level Sections (header, hero, content, footer) to verify all roles get template layout.

---

## Stop/Go gate: Phase 1 complete?

**Criteria:**
- Template dropdown changes at least one Section's layout visibly (e.g. header from row to column, or gap change).
- No regression on palette or behavior.

**Status**: ⏳ AWAITING USER VERIFICATION

Once verified, proceed to Phase 2.
