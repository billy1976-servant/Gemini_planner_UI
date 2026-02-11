# Fallback Removal Investigation Report

## Objective
Prove whether hidden defaults or hard-coded fallback values are overriding JSON-driven layout definitions and causing compression, stacking, or width collapse.

## Implementation Summary

### STRICT_JSON_MODE Toggle
Added `STRICT_JSON_MODE = true` constant to all renderer files:
- `LayoutMoleculeRenderer.tsx`
- `section.compound.tsx`
- `card.compound.tsx`
- `molecule-layout-resolver.ts`
- `sequence.tsx`
- `collection.tsx`
- `PreviewRender.tsx`

### Warning System
Added `warnDefault()` function that logs when fallback values are detected:
```javascript
console.warn(`[STRICT_JSON_MODE] DEFAULT DETECTED: renderer used fallback value "${fallbackName}" = ${JSON.stringify(value)} (source: ${source})`);
```

### FINAL_LAYOUT_INPUT Logging
Added comprehensive logging to track what values the renderer is actually using:
```javascript
console.log("FINAL_LAYOUT_INPUT", {
  width, height, flexDirection, display, gap, containerWidth, parentWidth, source, strictMode
});
```

## Fallback Locations Found

### 1. LayoutMoleculeRenderer.tsx

#### Fallbacks Identified:
- **Line 92**: `mediaSlot` fallback to `"right"` (when split config exists but mediaSlot not specified)
- **Line 113-118**: Hard-coded `contentColumn` styles:
  - `display: "flex"`
  - `flexDirection: "column"`
  - `gap: "var(--spacing-4)"`
  - `alignItems: "flex-start"`
  - `minWidth: 0`
- **Line 169**: `gap` fallback to `"var(--spacing-6)"` when not in moleculeLayout.params
- **Line 188-193**: Hard-coded split layout styles:
  - `display: "grid"`
  - `gridTemplateColumns: "1fr 1fr"`
  - `alignItems: "center"`
  - `maxWidth: "100%"`
  - `minWidth: 0`
- **Line 282**: `containerWidth` fallback to `"var(--container-content)"` when rawWidth doesn't match known patterns
- **Line 288-293**: Hard-coded outer container styles:
  - `width: "100%"`
  - `marginLeft: "auto"`
  - `marginRight: "auto"`
  - `boxSizing: "border-box"`
  - `overflowX: "hidden"`

#### Status: ✅ Logged and warned in strict mode

### 2. section.compound.tsx

#### Fallbacks Identified:
- **Line 102**: `internalLayoutId` fallback to `"default"` for organ layouts

#### Status: ✅ Logged and warned in strict mode

### 3. card.compound.tsx

#### Fallbacks Identified:
- **Line 90**: `mediaPosition` fallback to `"top"`
- **Line 91**: `contentAlign` fallback to `"start"`
- **Line 127**: `gap` fallback to `"var(--spacing-4)"`
- **Line 179**: Hard-coded text chunk styles:
  - `display: "flex"`
  - `flexDirection: "column"`
  - `gap: "var(--spacing-2)"`
  - `minWidth: 0`
- **Line 207-212**: Hard-coded slot content styles:
  - `display: "flex"`
  - `width: "100%"`
- **Line 224**: `resolveWithDefaultLayout` fallback flow to `"column"`

#### Status: ✅ Logged and warned in strict mode

### 4. molecule-layout-resolver.ts

#### Fallbacks Identified:
- **Line 133**: Returns `params ?? {}` when `flow` is undefined
- **Line 140**: Returns `params ?? {}` when flow is unknown
- **Line 155**: Merges `def.defaults` into params (layout definition defaults)

#### Status: ✅ Logged and warned in strict mode

### 5. sequence.tsx (SequenceAtom)

#### Fallbacks Identified:
- **Line 34**: `columns` fallback to `2` in grid mode
- **Line 36**: Hard-coded `display: "grid"`
- **Line 40**: `alignItems` fallback to `"stretch"` in grid mode
- **Line 41**: `justifyItems` fallback to `"stretch"` in grid mode
- **Line 50**: Hard-coded `display: "flex"` in flex mode
- **Line 51**: `flexDirection` fallback to `"row"`
- **Line 52**: `alignItems` fallback to `"flex-start"`
- **Line 53**: `justifyContent` fallback to `"flex-start"`

#### Status: ✅ Logged and warned in strict mode

### 6. collection.tsx (CollectionAtom)

#### Fallbacks Identified:
- **Line 22**: Hard-coded `display: "flex"`
- **Line 23**: `flexDirection` fallback to `"row"`

#### Status: ✅ Logged and warned in strict mode

### 7. PreviewRender.tsx

#### Fallbacks Identified:
- **Line 119**: `defaultCardPreset` fallback to `SAFE_DEFAULT_CARD_PRESET_ID`
- **Line 197-205**: Hard-coded preview container styles:
  - `width: "100%"`
  - `maxWidth: "100%"`
  - `minHeight: "280px"`
  - `borderRadius: 8`
  - `background: "#f8fafc"`
  - `boxShadow: "0 1px 3px rgba(0,0,0,0.08)"`

#### Status: ✅ Logged and warned in strict mode

## Testing Instructions

### Enable Strict Mode
All files have `STRICT_JSON_MODE = true` by default. To disable, change to `false`.

### Check Console Output
When rendering layouts, watch for:
1. `[STRICT_JSON_MODE] DEFAULT DETECTED` warnings - shows which fallbacks are being used
2. `FINAL_LAYOUT_INPUT` logs - shows what values the renderer is actually using

### Test Screens
Re-test these screens to verify behavior:
- `Layout_2.json`
- `Layout_Dropdown.json`
- Stack Layout Test

### Expected Behavior

#### If layouts break completely:
- Means defaults were masking missing JSON values
- JSON needs to be updated to include explicit values

#### If layouts spread naturally:
- Means fallbacks were compressing layouts
- Removing fallbacks reveals true layout behavior

#### If layouts stay identical:
- Means issue is higher in hierarchy (resolver, template mapper, etc.)
- Need to investigate upstream in the pipeline

## Next Steps

1. **Run tests** with strict mode enabled
2. **Monitor console** for default warnings
3. **Compare layout widths** before/after fallback removal
4. **Document which fallbacks actually trigger** during real usage
5. **Determine if fallbacks should be:**
   - Removed entirely (require JSON to specify all values)
   - Kept but logged (for backward compatibility)
   - Moved to CSS defaults (let browser handle)

## Files Modified

1. `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
2. `src/04_Presentation/components/molecules/section.compound.tsx`
3. `src/04_Presentation/components/molecules/card.compound.tsx`
4. `src/04_Presentation/lib-layout/molecule-layout-resolver.ts`
5. `src/04_Presentation/components/atoms/sequence.tsx`
6. `src/04_Presentation/components/atoms/collection.tsx`
7. `src/app/ui/control-dock/layout/PreviewRender.tsx`

## Notes

- All fallbacks are now **logged** but still **applied** (for backward compatibility)
- To truly remove fallbacks, change `??` operators to require explicit values
- Some hard-coded styles (like `display: "flex"`) may be necessary for layout structure
- Consider moving structural defaults to CSS rather than JavaScript
