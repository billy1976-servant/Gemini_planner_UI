# GLOBAL CONTRACT INTEGRITY AUDIT REPORT

**Date:** 2026-02-11  
**Scope:** Full codebase scan for hardcoded values, silent fallbacks, and resolver bypasses  
**Mode:** READ-ONLY inspection (no modifications)

---

## EXECUTIVE SUMMARY

This audit identifies all locations where the JSON-driven contract system is weakened by hardcoded fallbacks, silent defaults, or resolver bypasses. The system has implemented `STRICT_JSON_MODE` flags in many renderers, but fallback patterns remain throughout the codebase.

**Overall Contract Strength Estimate:** ~65% JSON-driven, ~35% hardcoded fallbacks

---

## A) LAYOUT SYSTEM

### A.1 Fallback Operators (??, ||, ternaries)

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 133-138:** Multiple nullish coalescing operators for node properties
  - `node?.id ?? "—"`
  - `node?.role ?? "—"`
  - `node?.variant ?? "—"`
  - `node?.layout ?? "—"`
  - `node?.params?.containerWidth ?? "—"`
- **Line 197:** `defaultInitialView ?? "|home"` (state-store.ts import)
- **Line 348:** `profile?.mode ?? "template"`
- **Line 363:** `(node.id ?? node.role) ?? ""`
- **Line 371:** `profile?.defaultSectionLayoutId` (optional chaining)
- **Line 380:** `profile?.defaultSectionLayoutId ?? null`
- **Line 441:** `sectionKey || (node?.id ?? node?.role ?? "anonymous")`
- **Line 473:** `PipelineDebugStore.getSnapshot().lastEvent?.target ?? null`
- **Line 1301:** `behaviorProfileProp ?? (rawState?.values?.behaviorProfile as string) ?? "default"`

**Severity:** MEDIUM - These are mostly for logging/tracing, but some affect rendering decisions.

#### `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Line 101:** `layoutPresetId ?? (layout as any)?.id ?? null`
- **Line 256:** `moleculeLayout?.params ?? {}`
- **Line 265:** `moleculeLayout?.preset ?? null`
- **Line 266:** `moleculeLayout?.params ?? {}`
- **Line 275:** `(layout as any)?.splitLayout ?? {}`
- **Line 402-407:** `getLayoutValueWithSafeDefault()` calls with hardcoded defaults:
  - `container.width`: `"100%"`
  - `container.maxWidth`: `undefined` (but uses containerVar)
  - `container.marginLeft`: `"auto"`
  - `container.marginRight`: `"auto"`
  - `container.boxSizing`: `"border-box"`
  - `container.overflowX`: `"hidden"`

**Severity:** HIGH - Safe defaults are injected when layoutId exists but values are missing.

#### `src/04_Presentation/components/atoms/sequence.tsx`
- **Line 32:** `params.flow ?? params.direction ? "flex" : undefined`
- **Line 33:** `params.params ?? params`
- **Line 46:** `columns ?? (STRICT_JSON_MODE ? undefined : 2)`
- **Line 57-58:** `p.align ?? (STRICT_JSON_MODE ? undefined : "stretch")`
- **Line 74-76:** Multiple fallbacks for flex mode:
  - `p.direction ?? (STRICT_JSON_MODE ? undefined : "row")`
  - `p.align ?? (STRICT_JSON_MODE ? undefined : "flex-start")`
  - `p.justify ?? (STRICT_JSON_MODE ? undefined : "flex-start")`

**Severity:** MEDIUM - Protected by STRICT_JSON_MODE, but fallbacks exist.

#### `src/04_Presentation/components/atoms/collection.tsx`
- **Line 35:** `params.direction ?? (STRICT_JSON_MODE ? undefined : "row")`

**Severity:** LOW - Protected by STRICT_JSON_MODE.

#### `src/04_Presentation/components/molecules/card.compound.tsx`
- **Line 39:** `flow ?? (STRICT_JSON_MODE ? undefined : defaultFlow)`
- **Line 108:** `mediaPosition ?? (STRICT_JSON_MODE ? undefined : "top")`
- **Line 113:** `rawContentAlign ?? (STRICT_JSON_MODE ? undefined : "start")`
- **Line 147:** `params.moleculeLayout?.params ?? {}`
- **Line 154:** `gap ?? (STRICT_JSON_MODE ? undefined : "var(--spacing-4)")`

**Severity:** MEDIUM - Protected by STRICT_JSON_MODE, but defaults exist.

#### `src/04_Presentation/layout/resolver/layout-resolver.ts`
- **Line 56:** `context?.sectionRole ?? layoutId ?? "(unknown)"`
- **Line 94:** `layout ?? null`
- **Line 103:** `layout ?? null`

**Severity:** LOW - Mostly null handling.

#### `src/04_Presentation/lib-layout/molecule-layout-resolver.ts`
- **Line 90:** `params ?? {}`
- **Line 123-124:** `layout.params ?? {}`, `params ?? {}`
- **Line 147:** `params ?? {}` (when flow missing)
- **Line 160:** `params ?? {}` (when def missing)
- **Line 168:** `def.presets[preset] ?? {}`
- **Line 177-180:** Multiple fallbacks in merge:
  - `def.defaults ?? {}`
  - `resolvedLayout.params ?? {}`
  - `presetParams`
  - `params ?? {}`

**Severity:** HIGH - Merges defaults from definition even when params provided.

### A.2 Hardcoded Inline Styles

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 85-87:** Debug overlay styles:
  - `margin: "var(--spacing-1)"`
  - `padding: "var(--spacing-1)"`
  - `position: "relative"`
- **Line 140:** `position: "relative", outline: "2px solid var(--color-outline, #888)"`
- **Line 143-151:** Debug label styles:
  - `position: "absolute"`
  - `padding: "var(--spacing-1) var(--spacing-2)"`
  - `display: "flex"`
- **Line 191:** `display: "contents"`
- **Line 724:** `padding: "var(--spacing-3)"`

**Severity:** LOW - Debug-only styles.

#### `src/03_Runtime/engine/core/ExperienceRenderer.tsx`
- **Line 88-111:** Extensive hardcoded container styles:
  - `display: "flex"` (multiple)
  - `width: "100%"`
  - `padding: "var(--spacing-4)"`, `"var(--spacing-8)"`
  - `margin: "0 auto"`
- **Line 140-213:** Navigation and step styles:
  - `position: "sticky"`
  - `display: "flex"`
  - `padding: "var(--spacing-4) var(--spacing-6)"`
  - `padding: "var(--spacing-2) var(--spacing-4)"`

**Severity:** HIGH - Core renderer with hardcoded layout decisions.

#### `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Line 477:** `display: "flex", boxSizing: "border-box"` (debug mode)

**Severity:** LOW - Debug-only.

#### `src/04_Presentation/components/atoms/collection.tsx`
- **Line 34:** `display: "flex"`

**Severity:** MEDIUM - Structural style not from JSON.

#### `src/04_Presentation/components/atoms/sequence.tsx`
- **Line 53:** `display: "grid"`
- **Line 73:** `display: "flex"`

**Severity:** MEDIUM - Display mode determined by code logic, not JSON.

#### `src/04_Presentation/lib-layout/molecule-layout-resolver.ts`
- **Line 67-92:** Hardcoded display styles in `translateFlow()`:
  - `display: "flex"` (column, row, stacked)
  - `display: "grid"` (grid)
  - `flexDirection`, `gridTemplateColumns` computed from params

**Severity:** HIGH - Core layout resolver injects display modes.

#### `src/04_Presentation/components/molecules/card.compound.tsx`
- **Line 175-191:** Hardcoded media wrapper styles:
  - `width: "100%"`
  - `position: "relative"`
  - `display: "block"`
- **Line 213:** `display: "flex", flexDirection: "column", gap: "var(--spacing-2)"`
- **Line 247-251:** Content wrapper styles:
  - `display: "flex"`
  - `width: "100%"`

**Severity:** MEDIUM - Structural styles not from JSON.

### A.3 Silent Defaults

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 572-595:** Card preset fallback logic (commented as "TEMP SAFE MODE"):
  - Logs fallback hits but does NOT assign default
  - Uses `SAFE_DEFAULT_CARD_PRESET_ID` constant
- **Line 874-892:** Repeater fallback logic (same pattern)

**Severity:** MEDIUM - Currently disabled but infrastructure exists.

#### `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Line 18-38:** `getLayoutValueWithSafeDefault()` function:
  - Provides defaults when `layoutId` exists but value missing
  - Logs warning: `[LAYOUT SAFE DEFAULT]`
  - Used for container width, margins, box-sizing, overflow

**Severity:** HIGH - Actively injects values not from JSON.

#### `src/04_Presentation/layout/page/capabilities.ts`
- **Line 20:** `SAFE_DEFAULT_CARD_PRESET_ID = "centered-card"`
- **Line 49:** Comment mentions "SAFE_DEFAULT" for dropdown

**Severity:** MEDIUM - Constant defined but usage controlled.

#### `src/04_Presentation/lib-layout/molecule-layout-resolver.ts`
- **Line 171-173:** Logs when `def.defaults` are merged
- **Line 177:** `def.defaults ?? {}` merged into params

**Severity:** MEDIUM - Defaults from definition JSON, not node JSON.

---

## B) RENDERER LAYER

### B.1 Value Injection Points

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 1008-1022:** Field value binding from state (controlled values)
- **Line 1025-1046:** Select value binding from state
- **Line 1280-1282:** `effectiveCurrentView` logic:
  - Uses `defaultState.currentView` before interaction
  - Switches to `rawState.currentView` after interaction
  - Fallback: `rawState?.currentView ?? defaultState?.currentView`

**Severity:** MEDIUM - State binding is intentional, but fallback exists.

#### `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Line 207-210:** Safe defaults for media image wrapper:
  - `width: "100%"`
  - `maxWidth: "100%"`
  - `height: "auto"`
  - `minHeight: "0"`
- **Line 402-407:** Container safe defaults (see A.1)

**Severity:** HIGH - Multiple injection points.

#### `src/04_Presentation/components/molecules/card.compound.tsx`
- **Line 108:** `mediaPosition` default: `"top"`
- **Line 113:** `contentAlign` default: `"start"`
- **Line 154:** `gap` default: `"var(--spacing-4)"`

**Severity:** MEDIUM - Protected by STRICT_JSON_MODE.

#### `src/04_Presentation/components/atoms/sequence.tsx`
- **Line 46:** `columns` default: `2` (grid mode)
- **Line 57-58:** `align`/`justify` defaults: `"stretch"` (grid)
- **Line 74-76:** Flex defaults: `"row"`, `"flex-start"`

**Severity:** MEDIUM - Protected by STRICT_JSON_MODE.

### B.2 Renderer Decision-Making

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 232-243:** `shouldRenderNode()` makes visibility decisions based on:
  - `node.when` conditions
  - `node.key` matching
  - State values
- **Line 341:** `if (!node || !profile) return node` (early return)

**Severity:** LOW - Conditional rendering is expected.

#### `src/04_Presentation/components/atoms/sequence.tsx`
- **Line 41:** `if ((params.flow ?? p.flow) === "grid")` - Determines display mode

**Severity:** MEDIUM - Code determines layout type.

---

## C) STATE SYSTEM

### C.1 Internal Default Creation

#### `src/03_Runtime/state/state-resolver.ts`
- **Line 39-46:** Initial derived state structure:
  - `journal: {}`
  - `scans: []`
  - `interactions: []`
  - `values: {}`
  - `layoutByScreen: {}`
- **Line 72:** `track ?? "default"` (journal track fallback)
- **Line 75:** `payload.value ?? payload.text ?? ""` (value fallback)

**Severity:** LOW - Initialization defaults are expected.

#### `src/03_Runtime/state/state-store.ts`
- **Line 197:** `defaultInitialView ?? "|home"` (from config)
- **Line 71:** `getState() ?? {}` (fallback for undefined state)

**Severity:** LOW - Bootstrap defaults.

### C.2 State Fallback Patterns

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 1280-1282:** View state fallback chain:
  - `defaultState.currentView` → `rawState.currentView` → `defaultState.currentView`
- **Line 1301:** `behaviorProfileProp ?? (rawState?.values?.behaviorProfile as string) ?? "default"`

**Severity:** MEDIUM - Multiple fallback levels.

#### `src/03_Runtime/engine/core/ExperienceRenderer.tsx`
- **Line 43:** `experienceProp ?? (stateSnapshot?.values?.experience as string) ?? "website"`
- **Line 46:** `(stateSnapshot?.values?.currentStepIndex as number) ?? 0`
- **Line 52:** `activeSectionKeyFromState ?? sectionKeys[0] ?? null`

**Severity:** MEDIUM - Experience defaults.

---

## D) BEHAVIOR SYSTEM

### D.1 Behavior Logic Without JSON Definition

#### `src/03_Runtime/behavior/behavior-runner.ts`
- **Line 124-128:** Variant resolution fallback:
  - `args?.variant || args?.direction || args?.mode || "default"`
- **Line 130:** `interactionEntry[variant] || interactionEntry.default`
- **Line 20-86:** `resolveNavVariant()` infers variant from args when not explicit:
  - Checks for `screenId`, `modalId`, `flowId`, etc.
  - Returns `undefined` if no match (no hardcoded fallback)

**Severity:** LOW - Inference is acceptable, no hardcoded defaults.

#### `src/03_Runtime/engine/core/behavior-listener.ts`
- **Line 47-49:** Explicit no-op when `fieldKey` missing (no fallback)
- **Line 91-92:** Navigation target fallback: `args.to ?? args.screenId ?? args.target`

**Severity:** LOW - Mostly explicit handling.

### D.2 Behavior Execution Patterns

#### `src/03_Runtime/behavior/behavior-runner.ts`
- **Line 168-187:** Returns early with warning if no behavior map found
- **Line 203-213:** Returns early if handler not implemented
- **Line 239:** `result?.target ?? args?.target` (navigation target fallback)

**Severity:** LOW - Graceful failure, no silent fallbacks.

---

## E) RESOLVER LAYER

### E.1 Resolver Value Selection

#### `src/04_Presentation/layout/resolver/layout-resolver.ts`
- **Line 52-56:** Section key resolution:
  - `context?.sectionRole ?? layoutId ?? "(unknown)"`
- **Line 72-94:** Layout resolution logic with fallbacks

**Severity:** LOW - Mostly null handling.

#### `src/04_Presentation/lib-layout/molecule-layout-resolver.ts`
- **Line 137-191:** `resolveMoleculeLayout()` merge order:
  1. `def.defaults` (from definition JSON)
  2. `resolvedLayout.params` (from definition)
  3. `presetParams` (from preset)
  4. `params` (from node JSON)
- **Line 147:** Returns `params ?? {}` if flow missing

**Severity:** HIGH - Definition defaults override node params when missing.

#### `src/04_Presentation/layout/page/page-layout-resolver.ts`
- **Line 39:** `pageLayouts[normalized] ?? pageLayouts[id]` (normalization fallback)

**Severity:** LOW - Normalization is expected.

#### `src/04_Presentation/layout-organ/organ-layout-resolver.ts`
- **Line 30:** `byOrganId.get(organId.toLowerCase().trim()) ?? null`
- **Line 47:** `profile?.defaultInternalLayoutId ?? null`
- **Line 73:** `match ?? profile.defaultInternalLayoutId`

**Severity:** MEDIUM - Profile defaults used when requested ID invalid.

#### `src/04_Presentation/layout/section-layout-id.ts`
- **Line 61:** `getDefaultFromTemplate(templateId ?? undefined)`
- **Line 67:** Template role-based resolution

**Severity:** LOW - Template defaults are expected.

### E.2 Resolver Bypass Patterns

#### `src/03_Runtime/engine/core/json-renderer.tsx`
- **Line 45:** `DISABLE_ENGINE_LAYOUT = true` (KILL SWITCH)
- **Line 419-421:** Bypasses override resolution when kill switch active:
  ```typescript
  const finalLayoutId = DISABLE_ENGINE_LAYOUT
    ? (existingLayoutId || templateDefaultLayoutId || undefined)
    : layoutId;
  ```

**Severity:** HIGH - Active kill switch bypasses contract system.

#### `src/04_Presentation/layout/compatibility/compatibility-evaluator.ts`
- **Line 48-104:** Compatibility evaluation (read-only, no bypass)

**Severity:** N/A - Read-only evaluator.

---

## F) CONTRACT GAP SUMMARY

### F.1 Layout System
- **JSON-driven:** ~70%
- **Hardcoded:** ~30%
- **Severity:** MEDIUM
- **Key Issues:**
  - Safe defaults injected in LayoutMoleculeRenderer
  - Definition defaults merged before node params
  - Kill switch bypasses override system
  - Hardcoded display modes in molecule-layout-resolver

### F.2 Renderer Layer
- **JSON-driven:** ~75%
- **Hardcoded:** ~25%
- **Severity:** MEDIUM
- **Key Issues:**
  - Safe default injection functions
  - STRICT_JSON_MODE flags exist but fallbacks remain
  - Hardcoded structural styles in atoms/molecules
  - State binding fallbacks

### F.3 State System
- **JSON-driven:** ~85%
- **Hardcoded:** ~15%
- **Severity:** LOW
- **Key Issues:**
  - Initialization defaults (expected)
  - View state fallback chain
  - Experience defaults

### F.4 Behavior System
- **JSON-driven:** ~90%
- **Hardcoded:** ~10%
- **Severity:** LOW
- **Key Issues:**
  - Variant inference (acceptable)
  - Navigation target fallbacks
  - No silent fallbacks (good)

### F.5 Resolver Layer
- **JSON-driven:** ~65%
- **Hardcoded:** ~35%
- **Severity:** HIGH
- **Key Issues:**
  - Definition defaults override node params
  - Kill switch bypasses resolution
  - Profile defaults used when ID invalid
  - Merge order favors definition over node

---

## G) TOP RISK FILES

### Ranked by Hardcoded Behavior Impact

1. **`src/03_Runtime/engine/core/json-renderer.tsx`**
   - **Issues:** Kill switch, card preset fallbacks, state fallbacks, extensive nullish coalescing
   - **Impact:** Core rendering engine with multiple bypass points
   - **Hardcoded Count:** ~50+ instances

2. **`src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx`**
   - **Issues:** Safe default injection, container width defaults, media wrapper defaults
   - **Impact:** Primary layout renderer injects values not from JSON
   - **Hardcoded Count:** ~15+ instances

3. **`src/04_Presentation/lib-layout/molecule-layout-resolver.ts`**
   - **Issues:** Definition defaults merged before node params, hardcoded display modes
   - **Impact:** Core resolver prioritizes definition over node JSON
   - **Hardcoded Count:** ~10+ instances

4. **`src/03_Runtime/engine/core/ExperienceRenderer.tsx`**
   - **Issues:** Extensive hardcoded container styles, navigation styles
   - **Impact:** Experience renderer makes layout decisions in code
   - **Hardcoded Count:** ~20+ instances

5. **`src/04_Presentation/components/atoms/sequence.tsx`**
   - **Issues:** Display mode determination, flex/grid defaults
   - **Impact:** Atom determines layout type from code logic
   - **Hardcoded Count:** ~8+ instances

6. **`src/04_Presentation/components/molecules/card.compound.tsx`**
   - **Issues:** Media position defaults, content align defaults, gap defaults
   - **Impact:** Card component has multiple fallback values
   - **Hardcoded Count:** ~6+ instances

7. **`src/04_Presentation/layout-organ/organ-layout-resolver.ts`**
   - **Issues:** Profile defaults used when ID invalid
   - **Impact:** Resolver chooses values instead of failing
   - **Hardcoded Count:** ~3+ instances

8. **`src/03_Runtime/state/state-resolver.ts`**
   - **Issues:** Initial state structure, journal track fallback
   - **Impact:** State initialization defaults
   - **Hardcoded Count:** ~5+ instances

9. **`src/04_Presentation/components/atoms/collection.tsx`**
   - **Issues:** Direction default, display flex hardcoded
   - **Impact:** Collection atom has structural defaults
   - **Hardcoded Count:** ~2+ instances

10. **`src/03_Runtime/behavior/behavior-runner.ts`**
    - **Issues:** Variant inference, navigation target fallback
    - **Impact:** Behavior resolution has fallback logic
    - **Hardcoded Count:** ~4+ instances

---

## H) ARCHITECTURE HEALTH ESTIMATE

### H.1 Layout Contract Integrity: **~70%**
- **Strengths:**
  - STRICT_JSON_MODE flags implemented
  - Fallback logging in place
  - Template defaults from JSON
- **Weaknesses:**
  - Safe defaults injected when layoutId exists
  - Definition defaults override node params
  - Kill switch bypasses system
  - Hardcoded display modes

### H.2 Renderer Purity: **~75%**
- **Strengths:**
  - Most renderers respect JSON props
  - STRICT_JSON_MODE protection
  - Conditional fallbacks logged
- **Weaknesses:**
  - Safe default injection functions
  - Hardcoded structural styles
  - State binding fallbacks

### H.3 State Purity: **~85%**
- **Strengths:**
  - State derived from event log
  - No silent mutations
  - Clear intent system
- **Weaknesses:**
  - Initialization defaults
  - View state fallback chain
  - Experience defaults

### H.4 Behavior Purity: **~90%**
- **Strengths:**
  - No silent fallbacks
  - Explicit failure modes
  - JSON-driven handler resolution
- **Weaknesses:**
  - Variant inference logic
  - Navigation target fallbacks

### H.5 Overall System Contract Strength: **~75%**

**Breakdown:**
- Layout: 70%
- Renderer: 75%
- State: 85%
- Behavior: 90%
- Resolver: 65%

**Weighted Average:** ~75% JSON-driven

---

## I) CRITICAL FINDINGS

### I.1 Active Kill Switch
**File:** `src/03_Runtime/engine/core/json-renderer.tsx:45`
```typescript
const DISABLE_ENGINE_LAYOUT = true;
```
**Impact:** Bypasses entire override resolution system. Only uses `node.layout` or template default.

### I.2 Safe Default Injection
**File:** `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx:18-38`
**Function:** `getLayoutValueWithSafeDefault()`
**Impact:** Injects hardcoded values when `layoutId` exists but property missing. Used for container width, margins, box-sizing.

### I.3 Definition Defaults Override Node Params
**File:** `src/04_Presentation/lib-layout/molecule-layout-resolver.ts:177-180`
**Merge Order:**
1. `def.defaults` (definition JSON)
2. `resolvedLayout.params` (definition)
3. `presetParams` (preset)
4. `params` (node JSON)

**Impact:** Definition defaults applied even when node provides params.

### I.4 Hardcoded Display Modes
**File:** `src/04_Presentation/lib-layout/molecule-layout-resolver.ts:67-92`
**Function:** `translateFlow()`
**Impact:** Injects `display: "flex"` or `display: "grid"` based on flow type. Not from JSON.

### I.5 STRICT_JSON_MODE Inconsistency
**Status:** Flags exist but fallbacks remain in code paths. When `STRICT_JSON_MODE = true`, fallbacks return `undefined`, but when `false`, hardcoded defaults apply.

**Files with STRICT_JSON_MODE:**
- `sequence.tsx`
- `collection.tsx`
- `card.compound.tsx`
- `section.compound.tsx`
- `molecule-layout-resolver.ts`
- `PreviewRender.tsx` (STRICT_PREVIEW)

---

## J) RECOMMENDATIONS (READ-ONLY - NO ACTIONS TAKEN)

### J.1 Immediate Actions
1. **Disable Kill Switch:** Set `DISABLE_ENGINE_LAYOUT = false` to restore override system
2. **Remove Safe Defaults:** Replace `getLayoutValueWithSafeDefault()` with strict requirement or JSON-defined defaults
3. **Fix Merge Order:** Node params should override definition defaults, not vice versa
4. **Move Display Modes to JSON:** Display mode should come from layout definition JSON, not code

### J.2 Medium-Term Improvements
1. **Standardize STRICT_JSON_MODE:** Ensure all renderers respect flag consistently
2. **JSON-Defined Defaults:** Move all defaults to JSON definitions, not code constants
3. **Resolver Contracts:** Document resolver precedence and merge order
4. **Fallback Logging:** Enhance logging to track all fallback usage

### J.3 Long-Term Architecture
1. **Contract Validation:** Add runtime validation that JSON contracts are complete
2. **Fallback Elimination:** Remove all hardcoded fallbacks, require explicit JSON
3. **Resolver Purity:** Resolvers should only transform, not inject values
4. **Renderer Contracts:** Document expected JSON shape for each renderer

---

## K) METHODOLOGY

### K.1 Search Patterns Used
- Nullish coalescing: `\?\?`
- Logical OR: `\|\|`
- Optional chaining: `\?\s*\.`
- Inline styles: `width:\s*["']`, `display:\s*["']`, etc.
- Fallback keywords: `defaultValue`, `SAFE DEFAULT`, `fallback`, `preset applied`
- Resolver bypasses: `if \(!.*\) return`

### K.2 Files Scanned
- `/src/03_Runtime/` (all subdirectories)
- `/src/04_Presentation/` (all subdirectories)
- Renderer files: `*Renderer*.tsx`
- Resolver files: `*resolver*.ts*`
- State files: `state-*.ts`
- Behavior files: `behavior-*.ts`

### K.3 Limitations
- Some patterns may be false positives (debug code, type guards)
- STRICT_JSON_MODE flags indicate awareness but don't eliminate fallbacks
- Some fallbacks may be intentional (error handling, initialization)

---

**END OF AUDIT REPORT**
