# VISUAL SYSTEM GAP ANALYSIS (POST-TOKEN UPGRADE)
**Date:** 2026-02-12  
**Mode:** Analysis Only — No Code Changes  
**Objective:** Identify the remaining 20-30% preventing Band-level visual quality

---

## EXECUTIVE SUMMARY

**Current State:**  
The system possesses **excellent foundational infrastructure** (comprehensive tokens, clean separation of concerns, robust palette system), but suffers from **structural flatness**—screens feel visually uniform despite having depth tokens available.

**Root Cause:**  
The gap is NOT in the token layer (colors, spacing, shadows exist). The gap is in **compositional primitives and application patterns**—the system lacks the structural vocabulary to create layered, modern UI hierarchy.

**Critical Finding:**  
You have the paint and brushes (tokens), but are missing the **canvas layers** (structural containers), the **composition techniques** (layout patterns), and the **application discipline** (preset usage).

---

## 1. LAYOUT LAYER AUDIT

### Current State

**Layout Definitions Found:**
- `layout-definitions.json` contains 13 page layouts
- All layouts focus on: `containerWidth`, `split`, basic flexbox params
- Component layouts define: `type` (row/column/grid), `gap`, `padding`, `align`

**What's Missing:**

#### A. Container Primitives (CRITICAL GAP)
The system has no semantic layout zones:

**Missing Container Types:**
- **Panel/Frame** — Elevated surface with consistent depth (z-index simulation via shadow)
- **Rail** — Vertical navigation/content column with sticky behavior
- **Dock** — Horizontal action bar (top/bottom) with elevation
- **Region** — Logical grouping container (header, content, footer zones)
- **Inset** — Content well with background contrast
- **Stage** — Hero/primary content area with visual priority
- **Sidebar** — Persistent edge panel with shadow hierarchy

**Current Reality:**
All layouts flatten to: `<div>` with `containerWidth` + generic `gap`/`padding`.

**Example Current JSON Structure:**
```json
{
  "type": "section",
  "layout": "content-stack",
  "children": [...]
}
```

**What Modern UI Needs:**
```json
{
  "type": "section",
  "layout": "app-frame",
  "params": {
    "zones": {
      "header": { "sticky": true, "depth": "raised" },
      "content": { "background": "base", "padding": "lg" },
      "sidebar": { "width": "narrow", "depth": "overlay" }
    }
  }
}
```

#### B. Weak Layout Structure

**Current Pattern:**  
`hero-split` → flat row with 2 columns  
`content-stack` → flat column with uniform gap  
`features-grid-3` → flat grid with no depth variation

**Missing Structure:**
- **Layered composition** — Background → Base → Raised → Overlay hierarchy
- **Nested zones** — Header (raised) wrapping toolbar (floating)
- **Depth-aware spacing** — Elevated surfaces use tighter padding, base uses generous padding
- **Visual rhythm** — Section-level vertical rhythm orchestration (not just gap)

**Gap Severity:** HIGH — This is why screens feel flat despite having shadow tokens.

#### C. Spacing Orchestration

**Current:** Layout params specify raw values (`gap: "var(--spacing-8)"`)  
**Missing:** 
- **Vertical rhythm presets** — `rhythm-tight`, `rhythm-relaxed`, `rhythm-article`
- **Section padding scales** — `section-padding-compact`, `section-padding-spacious`
- **Responsive spacing strategy** — Mobile vs desktop spacing orchestration

**Example:**  
Current layouts hardcode: `padding: "var(--spacing-20) var(--spacing-8)"`  
Modern UI needs: `spacingPreset: "hero-generous"` → resolves to responsive scale

---

## 2. COMPOSITION LAYER AUDIT (MOLECULE USAGE)

### Current Molecules Inventory

**Available:**
- `avatar`, `button`, `card`, `chip`, `field`, `list`, `modal`, `section`, `stepper`, `text`, `toast`, `toolbar`

**Quality:** Good variant coverage, well-structured presets

### Composition Gaps

#### A. Missing Container Molecules (CRITICAL)

**Not Found in molecules.json:**

1. **Panel Molecule**  
   Purpose: Elevated surface container with consistent depth  
   Use: Content grouping, card collections, form sections  
   Variants: `flat`, `raised`, `floating`  
   Status: **MISSING** — Currently sections fake this with shadow, no standardized panel

2. **Frame Molecule**  
   Purpose: Bordered container with optional title/actions  
   Use: Settings groups, detail views, collapsible sections  
   Variants: `outlined`, `filled`, `minimal`  
   Status: **MISSING** — No framing construct beyond raw section

3. **Dock Molecule**  
   Purpose: Fixed/sticky action bar with elevation  
   Use: App headers, bottom nav, floating action bars  
   Variants: `top`, `bottom`, `floating`  
   Status: **MISSING** — Toolbar exists but no elevation/sticky/dock semantics

4. **Divider Molecule**  
   Purpose: Visual separator with spacing control  
   Use: Section breaks, content rhythm, list separators  
   Variants: `line`, `spacer`, `label-divider`  
   Status: **MISSING** — Currently use raw padding, no semantic separator

5. **Inset Molecule**  
   Purpose: Content well with background contrast  
   Use: Callouts, code blocks, nested content, quotes  
   Variants: `subtle`, `contrast`, `highlight`  
   Status: **MISSING** — Section variant="subtle" exists but lacks inset semantics

#### B. Flat Composition Patterns

**Current Usage (from Journal_with_sections.json):**
```json
{
  "type": "section",
  "layout": "content-stack",
  "children": [
    { "type": "card", "content": { "body": "..." } },
    { "type": "field" },
    { "type": "button" }
  ]
}
```

**What's Wrong:**  
Flat vertical stack—no visual grouping, no depth hierarchy, no container structure.

**Modern Equivalent:**
```json
{
  "type": "section",
  "layout": "content-stack",
  "children": [
    {
      "type": "panel",
      "params": { "variant": "raised", "padding": "md" },
      "children": [
        { "type": "text", "content": { "body": "..." } },
        { "type": "field" }
      ]
    },
    {
      "type": "dock",
      "params": { "position": "bottom", "variant": "floating" },
      "children": [
        { "type": "button" }
      ]
    }
  ]
}
```

**Result:** Clear visual hierarchy—content in raised panel, action in floating dock.

#### C. Section Overuse

**Current Reality:**  
`section` is used for everything—hero, features, forms, groups.

**Problem:**  
`section` is a layout primitive, not a composition molecule. It should orchestrate **layout zones**, but actual **content grouping** should use dedicated container molecules.

**Recommendation:**
- Section → Layout orchestration (rows, columns, grids, splits)
- Panel/Frame → Content grouping within sections
- Dock → Action zones within sections

---

## 3. PALETTE APPLICATION AUDIT

### Tokens Available (✅ Excellent)

**From default.json, dark.json, premium.json:**
- `surfaceTier` → base, raised, overlay, floating (❌ **NOT USED**)
- `elevation` → 0-4 with layered shadows (❌ **RARELY USED**)
- `prominence` → primary, secondary, tertiary (❌ **NOT USED**)
- `textRole` → display, headline, title, bodyLg, body, label, caption (✅ Used in molecules)
- `shadow` → sm, md, lg (✅ Used, but not in tiered hierarchy)

### Application Gaps

#### A. Surface Depth Hierarchy NOT Applied

**Tokens Exist:**
```json
"surfaceTier": {
  "base": { "background": "color.surface", "shadow": "shadow.none" },
  "raised": { "background": "color.surface", "shadow": "shadow.sm" },
  "overlay": { "background": "color.surface", "shadow": "shadow.md" },
  "floating": { "background": "color.surface", "shadow": "shadow.lg" }
}
```

**Current Usage:**  
Sections use `params.surface.shadow: "shadow.sm"` — manual, inconsistent.

**Gap:**  
No systematic application of `surfaceTier` → all surfaces feel same depth.

**Fix Needed:**  
Molecules should reference `surfaceTier` tokens:
```json
{
  "type": "panel",
  "params": {
    "surface": "surfaceTier.raised"
  }
}
```

#### B. Elevation Tokens Unused

**Available:**
```json
"elevation": {
  "1": "0 1px 3px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)",
  "2": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08)",
  "3": "0 12px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
  "4": "0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)"
}
```

**Current Usage:**  
Modal uses `elevation.3` and `elevation.4`.

**Gap:**  
Should be standard in: panels (1-2), docks (2-3), modals (3-4).

#### C. Prominence System Ignored

**Tokens:**
```json
"prominence": {
  "primary": { "background": "color.primary", "color": "color.onPrimary" },
  "secondary": { "background": "color.surfaceVariant", "color": "color.onSurface" },
  "tertiary": { "background": "color.surface", "color": "color.onSurface" }
}
```

**Current Usage:** ZERO references found.

**Gap:**  
No semantic way to express visual priority—buttons, cards, sections all use manual color params.

**Fix:**
```json
{
  "type": "button",
  "params": { "prominence": "primary" }
}
```

---

## 4. INTERACTION FEEDBACK AUDIT

### Current State (✅ Partially Good)

**From molecules.json:**
- `button` variants have: `hoverFeedback`, `pressFeedback`, `hoverLift`, `transition`
- `stepper` tabs have: `cursor: pointer`, `hoverFeedback`, `transition`
- `trigger` is a dedicated atom for interaction

**What's Good:**
- Trigger/behavior separation is clean
- Feedback params exist in presets

### Gaps

#### A. Inconsistent Application

**Button:** ✅ All variants have hover/press  
**Chip:** ❌ No interaction feedback defined  
**Card (when interactive):** ❌ No hover/press defined  
**List items:** ❌ No interaction states  
**Toolbar items:** Has `cursor: pointer` but no lift/feedback

**Gap Severity:** MEDIUM — Interaction feels inconsistent.

#### B. Missing Feedback Zones

**Not Defined:**
- **Focus rings** — Accessibility + visual feedback on keyboard nav
- **Active states** — Visual confirmation when item is "selected" vs "hovered"
- **Loading states** — Button disabled/loading, skeleton placeholders
- **Drag feedback** — If list reordering or draggable cards

**Modern UI Standard:**  
Every interactive surface should have: `rest → hover → press → active → disabled` states.

#### C. Motion Tokens Underutilized

**Available:**
```json
"transition": {
  "fast": "150ms ease",
  "base": "200ms ease",
  "slow": "300ms ease"
},
"transform": {
  "hoverLift": "translateY(-1px)"
}
```

**Current Usage:**  
Button and stepper reference these. Section/card/panel do not.

**Gap:**  
Surfaces should have subtle transitions for smooth visual response.

---

## 5. TYPOGRAPHY HIERARCHY AUDIT

### Current State (✅ Good Foundation)

**textRole Available:**
- display (64px, bold, tight)
- headline (44px, semibold, tight)
- title (30px, semibold, normal)
- bodyLg (18px, regular, normal)
- body (16px, regular, normal)
- label (14px, medium, normal)
- caption (14px, regular, normal)

**Molecule Usage:**
- Text molecule has variants: `display`, `headline`, `title`, `body`, `label`, `caption` ✅
- Card uses: `textRole.title` for title, `textRole.body` for body ✅
- Section uses: `textRole.title` for section title ✅

### Gaps

#### A. Weak Weight Contrast

**Current:**
- Title: semibold (600)
- Body: regular (400)

**Gap:**  
200-point weight jump is subtle—modern UI uses **300-400 point jumps** for drama:
- Headline: 700 (bold)
- Title: 600 (semibold)
- Body: 400 (regular)
- Caption: 400 (regular) but **smaller + secondary color**

**Recommendation:**  
Increase display/headline to `bold` (700), keep title at `semibold` (600).

#### B. Line Height Uniformity

**Current:**
- tight: 1.25
- normal: 1.5 (default), 1.55 (premium)
- relaxed: 1.65, 1.75 (premium)

**Gap:**  
Headlines/titles use same lineHeight as body—should be **tighter for impact**.

**Modern Standard:**
- display: 1.1
- headline: 1.2
- title: 1.3
- body: 1.5
- caption: 1.4

#### C. Letter Spacing Ignored

**Tokens Available:**
```json
"letterSpacing": {
  "tight": -0.3,
  "normal": 0.02,
  "loose": 0.5
}
```

**Current Usage:** NOT applied in textRole.

**Gap:**  
Large headings need negative letter spacing for tightness, labels need slight tracking.

**Fix:**
```json
"textRole": {
  "display": { "size": 64, "weight": 700, "lineHeight": 1.1, "letterSpacing": "tight" },
  "headline": { "size": 44, "weight": 700, "lineHeight": 1.2, "letterSpacing": "tight" },
  "label": { "size": 14, "weight": 500, "lineHeight": 1.4, "letterSpacing": "loose" }
}
```

---

## 6. ARCHITECTURE SAFETY CHECK ✅

### Verification

**Layout System:**  
✅ Isolated — `layout-definitions.json`, `layout-resolver.ts`, `section.compound.tsx`  
✅ No logic in renderer — `getSectionLayoutId` is single authority  
✅ Clean separation — page layouts vs component layouts

**Molecules:**  
✅ Reusable — all molecules are generic, params-driven  
✅ Schema-driven — `molecules.json` defines variants/sizes  
✅ No hardcoded logic — state/behavior handled via stores

**Palettes:**  
✅ Centralized — `palettes/` folder, `palette-bridge.tsx` applies CSS vars  
✅ Themeable — default, dark, premium variants exist  
✅ Clean resolution — `resolveToken` → CSS custom properties

**Renderer:**  
✅ Generic — `json-renderer.tsx` uses Registry, no molecule-specific logic  
✅ Profile-based — `applyProfileToNode` applies layout/card presets  
✅ Clean contracts — behavior, state, layout resolved separately

**CONCLUSION:** Architecture is **solid**. No structural changes needed—only **additive evolution**.

---

## 7. GAP SUMMARY (CRITICAL)

### A. STRUCTURAL GAPS (What Layout Primitives Are Missing)

**Priority 1 — Layout Zones:**
1. **Panel/Frame Layout** — Semantic container with depth tier
2. **Dock Layout** — Sticky header/footer zones with elevation
3. **App Frame Layout** — Header + Sidebar + Content region orchestration
4. **Inset Layout** — Content well with background contrast

**Priority 2 — Layout Composition:**
5. **Nested Zone Support** — Section containing panel containing content
6. **Sticky Positioning** — Header/sidebar sticky behavior
7. **Depth-Aware Spacing** — Spacing scales based on surface depth

**Missing Count:** 7 layout primitives

### B. COMPOSITION GAPS (What Container Patterns Are Missing)

**Priority 1 — Container Molecules:**
1. **Panel Molecule** — Elevated surface container
2. **Frame Molecule** — Bordered grouping with header
3. **Dock Molecule** — Fixed action bar with shadow
4. **Divider Molecule** — Visual separator with rhythm control
5. **Inset Molecule** — Contrast background well

**Priority 2 — Composition Patterns:**
6. **Panel-in-Section** — Section layout wraps panel molecules
7. **Dock-at-Bottom** — Action bar floats over content
8. **Frame-with-Header** — Collapsible/titled content groups

**Missing Count:** 5 molecules + 3 patterns

### C. VISUAL MATURITY GAPS (What Prevents Band-Level Polish)

**Priority 1 — Surface Depth (CRITICAL):**
1. ❌ `surfaceTier` tokens exist but NOT applied systematically
2. ❌ `elevation` tokens exist but underutilized (only modals use)
3. ❌ No visual depth hierarchy—everything feels same z-index

**Priority 2 — Typography Drama:**
4. ⚠️ Weight contrast too subtle (600 vs 400)—needs 700 vs 400
5. ⚠️ Line height uniform—headlines need tighter leading
6. ❌ Letter spacing ignored—large text needs negative tracking

**Priority 3 — Interaction Polish:**
7. ⚠️ Hover/press feedback inconsistent (button yes, card/chip no)
8. ❌ No focus rings—accessibility gap
9. ❌ No loading/disabled states—feels incomplete

**Priority 4 — Composition Discipline:**
10. ❌ Overuse of flat sections—need nested container structure
11. ❌ No spacing rhythm—uniform gaps instead of intentional rhythm
12. ❌ No responsive depth strategy—mobile needs flatter surfaces

**Gap Count:** 12 visual maturity issues

---

## 8. PRIORITIZED UPGRADE ROADMAP (NO CODE)

### PHASE A: Layout Primitives (HIGH IMPACT)

**Goal:** Add structural vocabulary for modern UI composition.

**Add to `layout-definitions.json`:**

1. **Panel Frame Layout**  
   - `type: "panel-frame"`
   - `depth: "raised" | "overlay" | "floating"`
   - `padding: "sm" | "md" | "lg"`
   - Applies: `surfaceTier.{depth}` → shadow + background

2. **Dock Layout**  
   - `type: "dock"`
   - `position: "top" | "bottom" | "floating"`
   - `sticky: true/false`
   - Applies: `elevation.2` or `elevation.3`, `position: sticky` if enabled

3. **App Frame Layout**  
   - `type: "app-frame"`
   - `zones: { header, sidebar, content, footer }`
   - Each zone has: `width/height`, `depth`, `sticky`
   - Orchestrates: header (raised), sidebar (overlay), content (base)

4. **Inset Layout**  
   - `type: "inset"`
   - `contrast: "subtle" | "medium" | "strong"`
   - Applies: `color.surfaceVariant` or darker, padding scale

**Impact:** Screens can now express depth hierarchy at layout level.

### PHASE B: Molecule Preset Evolution (MEDIUM IMPACT)

**Goal:** Add container molecules for layered composition.

**Add to `molecules.json`:**

1. **Panel Molecule**
```json
"panel": {
  "variants": {
    "flat": { "surface": { "background": "color.surface", "padding": "padding.md" } },
    "raised": { "surface": { "background": "color.surface", "shadow": "elevation.1", "padding": "padding.md", "radius": "radius.lg" } },
    "overlay": { "surface": { "background": "color.surface", "shadow": "elevation.2", "padding": "padding.md", "radius": "radius.lg" } },
    "floating": { "surface": { "background": "color.surface", "shadow": "elevation.3", "padding": "padding.lg", "radius": "radius.lg" } }
  }
}
```

2. **Frame Molecule**
```json
"frame": {
  "variants": {
    "outlined": { "surface": { "borderColor": "color.outline", "borderWidth": "borderWidth.sm", "radius": "radius.md", "padding": "padding.md" } },
    "filled": { "surface": { "background": "color.surfaceVariant", "radius": "radius.md", "padding": "padding.md" } }
  }
}
```

3. **Divider Molecule**
```json
"divider": {
  "variants": {
    "line": { "surface": { "background": "color.outline", "height": "1px" } },
    "spacer": { "surface": { "height": "gap.md" } }
  }
}
```

4. **Dock Molecule**
```json
"dock": {
  "variants": {
    "top": { "surface": { "background": "color.surface", "shadow": "elevation.2", "padding": "padding.md" } },
    "bottom": { "surface": { "background": "color.surface", "shadow": "elevation.2", "padding": "padding.md" } },
    "floating": { "surface": { "background": "color.surface", "shadow": "elevation.3", "padding": "padding.md", "radius": "radius.lg" } }
  }
}
```

**Impact:** JSON screens can now build layered UI with proper depth containers.

### PHASE C: Composition Patterns (STANDARDIZATION)

**Goal:** Establish JSON patterns for modern composition.

**Pattern Library (documentation, not code):**

**Pattern 1: Panel-in-Section**
```json
{
  "type": "section",
  "layout": "content-stack",
  "children": [
    {
      "type": "panel",
      "params": { "variant": "raised" },
      "children": [
        { "type": "text", "params": { "variant": "title" }, "content": { "text": "Settings" } },
        { "type": "field" },
        { "type": "field" }
      ]
    }
  ]
}
```

**Pattern 2: Dock-at-Bottom**
```json
{
  "type": "section",
  "layout": "app-frame",
  "params": {
    "zones": {
      "content": { "depth": "base" },
      "footer": { "depth": "floating", "sticky": true }
    }
  },
  "children": [
    { "slot": "content", "children": [...] },
    { "slot": "footer", "type": "dock", "children": [{ "type": "button" }] }
  ]
}
```

**Pattern 3: Hero-with-Inset**
```json
{
  "type": "section",
  "layout": "hero-centered",
  "children": [
    { "type": "text", "params": { "variant": "headline" } },
    {
      "type": "inset",
      "params": { "contrast": "medium" },
      "children": [
        { "type": "text", "params": { "variant": "body" } }
      ]
    }
  ]
}
```

**Impact:** Developers/designers have reference patterns for layered composition.

### PHASE D: Interaction Polish Layer (FINE-TUNING)

**Goal:** Consistent interaction feedback across all molecules.

**Updates to `molecules.json`:**

1. **Add Interaction to Card**
```json
"card": {
  "variants": {
    "default": {
      "surface": { "background": "color.surface", "radius": "radius.lg", "shadow": "shadow.md", "padding": "padding.md", "transition": "transition.base" },
      "trigger": { "hoverFeedback": "soft", "pressFeedback": "light", "hoverLift": true }
    }
  }
}
```

2. **Add Interaction to Chip**
```json
"chip": {
  "variants": {
    "filled": {
      "surface": { "background": "color.surfaceVariant", "radius": "radius.lg", "padding": "padding.sm", "transition": "transition.fast" },
      "trigger": { "hoverFeedback": "soft", "cursor": "pointer" }
    }
  }
}
```

3. **Add Focus Rings**
```json
"button": {
  "variants": {
    "filled": {
      "trigger": { "focusRing": true, "focusColor": "color.primary" }
    }
  }
}
```

4. **Add Loading States**
```json
"button": {
  "states": {
    "loading": { "surface": { "opacity": "opacity.dim" }, "label": { "color": "color.secondary" } },
    "disabled": { "surface": { "opacity": "opacity.low" } }
  }
}
```

**Impact:** Every interactive surface feels polished and responsive.

---

## 9. ROOT CAUSE ANALYSIS

### Why Does the Current System Feel Flat?

**Token Layer:** ✅ EXCELLENT  
- Comprehensive palette system
- Shadow/elevation tokens exist
- Surface tier tokens defined
- Typography roles well-structured

**Layout Layer:** ⚠️ MINIMAL  
- Only basic row/column/grid
- No depth-aware containers
- No semantic zones (panel, dock, frame)
- Flat structure—everything is a section

**Molecule Layer:** ⚠️ FUNCTIONAL BUT FLAT  
- Good coverage (button, card, field)
- Missing: panel, frame, dock, divider, inset
- No container hierarchy—everything is direct section children

**Composition Layer:** ❌ MISSING  
- No patterns for nested depth
- No distinction between layout zones and content containers
- Overuse of section for everything
- No visual grouping constructs

**Application Layer:** ❌ INCONSISTENT  
- `surfaceTier` tokens NOT used
- `elevation` tokens rarely used
- `prominence` tokens ignored
- Typography roles used, but weight contrast weak

### The 20-30% Gap

**What's Present (70-80%):**
- ✅ Clean architecture
- ✅ Token infrastructure
- ✅ Palette theming
- ✅ Molecule foundation
- ✅ Layout resolution logic

**What's Missing (20-30%):**
- ❌ Container primitives (panel, dock, frame)
- ❌ Depth hierarchy application (surfaceTier, elevation)
- ❌ Composition patterns (nested zones)
- ❌ Visual rhythm orchestration
- ❌ Interaction consistency

**Why It Matters:**  
The missing 20-30% is what creates **visual depth**. Without it, even perfect tokens feel flat because there's no structural vocabulary to apply them in a **layered, intentional hierarchy**.

---

## 10. COMPARISON: CURRENT VS. BAND-LEVEL

### Current Visual Quality

**Characteristics:**
- Uniform spacing (all gaps feel same)
- Flat surfaces (no depth variation)
- Generic sections (hero feels like features)
- Weak typography drama (title vs body barely distinct)
- Inconsistent interaction (button yes, card no)

**User Perception:**  
"Functional but generic—looks like a prototype."

### Band-Level Visual Quality

**Characteristics:**
- **Depth hierarchy** — Header floats, content sits on base, actions elevate
- **Semantic zones** — Clear regions (app frame, content well, action dock)
- **Visual rhythm** — Intentional spacing variation (tight groups, generous sections)
- **Typography drama** — Bold headlines, clear weight jumps, tight leading
- **Interaction polish** — Every surface responds (hover, press, focus)

**User Perception:**  
"Polished, intentional, modern—feels like a real product."

### The Difference

**Current:** Flat → Uniform → Generic  
**Band-level:** Layered → Rhythmic → Intentional

**What Bridges the Gap:**
1. Container molecules (panel, dock, frame)
2. Depth token application (surfaceTier, elevation)
3. Composition patterns (nested zones)
4. Typography refinement (weight contrast, leading)
5. Interaction consistency (feedback everywhere)

---

## 11. ARCHITECTURAL SAFETY NOTES

### What MUST NOT Change

✅ **Logic Layer**  
- State resolver
- Behavior engine
- Action handlers

✅ **Renderer Layer**  
- `json-renderer.tsx` core logic
- Registry system
- Profile resolution

✅ **Schema Layer**  
- Node contracts (type, params, content, children)
- Slot system
- Behavior types

### What CAN Evolve (Additive Only)

✅ **Layout Definitions**  
- Add: panel-frame, dock, app-frame, inset layouts
- Preserve: existing hero/content/features layouts

✅ **Molecules**  
- Add: panel, dock, frame, divider, inset molecules
- Preserve: existing button, card, section, etc.

✅ **Tokens**  
- Add: focus ring tokens, loading state tokens
- Preserve: all existing palette tokens

✅ **Composition Patterns**  
- Document: reference patterns for nested composition
- No code—just JSON examples and guidelines

---

## 12. VISUAL BENCHMARK REFERENCE

### Modern Mobile UI (Band-Style) Checklist

**Layout:**
- [ ] Clear app frame (header, content, footer zones)
- [ ] Sticky header with shadow
- [ ] Content in panels (not flat sections)
- [ ] Floating action buttons with elevation

**Surfaces:**
- [ ] Base layer (no shadow, background)
- [ ] Raised panels (subtle shadow, content groups)
- [ ] Overlay modals (medium shadow, focus)
- [ ] Floating actions (strong shadow, priority)

**Typography:**
- [ ] Headline: bold (700), tight leading (1.2), negative tracking
- [ ] Title: semibold (600), normal leading (1.3)
- [ ] Body: regular (400), relaxed leading (1.5)
- [ ] Weight jump: 300+ points between levels

**Interaction:**
- [ ] Hover: subtle background shift, slight lift
- [ ] Press: deeper color, scale down
- [ ] Focus: visible ring (accessibility)
- [ ] Loading: opacity dim, subtle animation

**Composition:**
- [ ] Nested depth: section → panel → content
- [ ] Visual grouping: frames around related items
- [ ] Rhythm variation: tight groups, generous sections
- [ ] Responsive: fewer layers on mobile

**Current System Match:**
- Layout: ❌ 1/4 (only content, no zones)
- Surfaces: ❌ 0/4 (no depth application)
- Typography: ⚠️ 2/4 (roles exist, drama weak)
- Interaction: ⚠️ 2/4 (button yes, others inconsistent)
- Composition: ❌ 0/4 (flat sections only)

**Overall:** ~20-30% of Band-level polish achieved.

---

## 13. RECOMMENDATIONS SUMMARY

### Immediate (Phase A — 1-2 weeks)

**Add Layout Primitives:**
1. Panel frame layout (depth tiers)
2. Dock layout (sticky zones)
3. App frame layout (header/content/footer)

**Impact:** Screens can now express depth at layout level.

### Short-Term (Phase B — 2-3 weeks)

**Add Container Molecules:**
1. Panel molecule (raised, overlay, floating)
2. Frame molecule (outlined, filled)
3. Dock molecule (top, bottom, floating)
4. Divider molecule (line, spacer)

**Impact:** JSON can build layered, modern composition.

### Medium-Term (Phase C — 1-2 weeks)

**Standardize Composition Patterns:**
1. Document reference patterns
2. Update screen JSONs to use new containers
3. Establish depth hierarchy guidelines

**Impact:** Consistent visual language across all screens.

### Long-Term (Phase D — 2-3 weeks)

**Polish Interaction Layer:**
1. Add focus rings
2. Add loading/disabled states
3. Standardize hover/press feedback
4. Refine typography contrast

**Impact:** Every interaction feels polished and intentional.

---

## 14. CONCLUSION

### The Gap Explained

**You have:**
- ✅ Excellent tokens (colors, shadows, spacing)
- ✅ Clean architecture (separation of concerns)
- ✅ Solid foundation (palette, layout, molecules)

**You're missing:**
- ❌ Container primitives (panel, dock, frame)
- ❌ Depth application discipline (surfaceTier, elevation)
- ❌ Composition vocabulary (nested zones)

**The 20-30% gap is NOT a fundamental flaw—it's a natural evolution step.**

Your system is architecturally sound. The gap is in **compositional maturity**—the vocabulary to express modern UI hierarchy using your excellent token foundation.

### Why It Feels Flat

Modern UI is **layered composition**:
- Base → Raised → Overlay → Floating
- Section → Panel → Content → Action

Current system is **flat stacking**:
- Section → Card → Card → Card

**The fix is additive:** Add container molecules, apply depth tokens, standardize patterns. No renderer changes, no logic changes, no breaking changes.

### Next Steps

**Do NOT rewrite.** Do NOT merge. Do NOT restructure.

**DO:**
1. Add panel/dock/frame to layout-definitions.json
2. Add panel/dock/frame/divider to molecules.json
3. Update screen JSONs to use nested containers
4. Document composition patterns

**Impact:** Band-level polish with zero architectural risk.

---

**END OF ANALYSIS**
