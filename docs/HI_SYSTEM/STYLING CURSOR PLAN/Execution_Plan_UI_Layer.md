# Global JSON UI Styling Master Plan

**Authoritative reference:** UI Rendering Pipeline — Architecture Audit  
**Goal:** Extend the JSON styling pipeline so screens can reach the same visual quality as TSX screens, driven entirely by Palette tokens, Visual Presets, Molecule Definitions, and Screen JSON (structure only).

**Merge order (unchanged):**
```
VisualPresetOverlay → VariantPreset → SizePreset → node.params → resolveParams → Palette
```

---

## Absolute Rules

1. No hardcoded styling values in TSX molecules or atoms (no colors, px, rem, etc.).
2. No molecule structure changes.
3. No layout wrappers added in TSX.
4. No visual defaults added directly in molecules.
5. All visual control must flow through JSON → resolveParams → Palette.
6. Any token referenced must already exist in palette JSON. If missing, add to palette JSON only.
7. The Palette dropdown (default / dark / kids / etc.) must influence the final visual result globally.

---

## Part 1: Missing Visual Control Layers (per Audit)

| Layer | Status | Blocks |
|-------|--------|--------|
| **Typography roles** | Missing | No display/headline/body/label/caption mapping; definitions use raw textSize. |
| **Surface tiers** | Missing | No semantic base/raised/overlay; definitions use color.surface directly. |
| **Elevation levels** | Partial | shadow.sm/md/lg exist; no named elevation tiers (0–4). |
| **Global prominence** | Missing | Button has variants; no primary/secondary/tertiary applied across Section, Card, Chip. |
| **Density system** | Partial | compact/spacious exist but only padding; no gap, radius, or typography coordination. |
| **Text definition** | Missing | JSON `type: "text"` nodes get only node.params; no definition/variant. |

---

## Part 2: Global Visual Styling System Design

### A. Typography Roles

**Location:** Palette + Visual Presets + Definitions (references only).

**Palette additions** (`src/palettes/*.json`):

Add `textRole` object mapping roles to existing palette tokens (so Palette dropdown affects typography):

```json
"textRole": {
  "display": { "size": "textSize.xl", "weight": "textWeight.bold", "lineHeight": "lineHeight.tight" },
  "headline": { "size": "textSize.lg", "weight": "textWeight.bold", "lineHeight": "lineHeight.tight" },
  "title": { "size": "textSize.md", "weight": "textWeight.medium", "lineHeight": "lineHeight.normal" },
  "body": { "size": "textSize.md", "weight": "textWeight.regular", "lineHeight": "lineHeight.normal" },
  "label": { "size": "textSize.sm", "weight": "textWeight.medium", "lineHeight": "lineHeight.normal" },
  "caption": { "size": "textSize.xs", "weight": "textWeight.regular", "lineHeight": "lineHeight.normal" }
}
```

**Chained resolution:** `resolveToken("textRole.title.size")` returns `"textSize.md"`. A second resolve is needed to get 16. Packet I adds recursive/chained resolution in resolveParams or resolveToken so token-path results resolve to final values.

**Visual preset / definition usage:** Reference `textRole.title.size`, `textRole.body.weight`, etc. Color remains separate: `"color": "color.onSurface"`.

**Files:**
- `src/palettes/default.json` (and all palette files): add `textRole`
- `src/compounds/ui/definitions/section.json`: change `title` to reference `textRole.title.*` (or keep current; visual preset can override)
- `src/layout/visual-presets/*.json`: can override typography per molecule using `textRole.*` tokens

---

### B. Surface Tiers

**Location:** Palette + Visual Presets.

**Palette additions** (`src/palettes/*.json`):

Add `surfaceTier` mapping semantic levels to background + shadow:

```json
"surfaceTier": {
  "base": { "background": "color.surface", "shadow": "shadow.none" },
  "raised": { "background": "color.surface", "shadow": "shadow.sm" },
  "overlay": { "background": "color.surface", "shadow": "shadow.md" },
  "floating": { "background": "color.surface", "shadow": "shadow.lg" }
}
```

**Usage:** Visual presets use explicit token paths per tier. `surfaceTier` in palette documents the mapping; presets implement it:

- **base:** `background: "color.surface"`, `shadow: "shadow.none"`
- **raised:** `background: "color.surface"`, `shadow: "shadow.sm"`
- **overlay:** `background: "color.surface"`, `shadow: "shadow.md"`
- **floating:** `background: "color.surface"`, `shadow: "shadow.lg"`

Palette dropdown changes `color.surface` and `shadow.*` per theme. No resolver changes.

---

### C. Elevation Levels

**Location:** Palette + Visual Presets.

**Palette additions** (`src/palettes/*.json`):

Add `elevation` object mapping levels to shadow only (surface comes from surface tier or variant):

```json
"elevation": {
  "0": "shadow.none",
  "1": "shadow.sm",
  "2": "shadow.md",
  "3": "shadow.lg",
  "4": "shadow.lg"
}
```

**Usage:** Visual presets set `surface.shadow: "elevation.1"` for cards, `elevation.2` for modals. `resolveToken("elevation.1")` → `"shadow.sm"` → need second resolve? No. `resolveToken` does `path.split(".").reduce(...)`. So `elevation.1` → palette.elevation["1"] → `"shadow.sm"`. That returns a string. SurfaceAtom does `resolveToken(params.shadow)`. If params.shadow = "elevation.1", resolveToken returns "shadow.sm". Then SurfaceAtom would need to resolve again for boxShadow. But SurfaceAtom does `boxShadow: resolveToken(params.shadow)`. So it expects the final CSS value. `resolveToken("shadow.sm")` returns the CSS string. `resolveToken("elevation.1")` returns `"shadow.sm"` — a token path, not the CSS value.

**Fix:** `resolveToken` must recursively resolve until it gets a non-token value, OR elevation.1 must store the final value. Easiest: store the actual shadow value in elevation.1:
```json
"elevation": {
  "0": "none",
  "1": "0px 1px 2px rgba(0,0,0,0.15)",
  "2": "0px 2px 4px rgba(0,0,0,0.2)",
  "3": "0px 4px 8px rgba(0,0,0,0.3)",
  "4": "0px 8px 16px rgba(0,0,0,0.25)"
}
```

But rule 6 says "any token referenced must already exist in palette JSON" and "no hardcoded shadow values". The audit says shadow.sm/md/lg exist. So elevation should reference them. The issue is resolveToken returns the value at the path. If elevation.1 = "shadow.sm", we get the string "shadow.sm", not the resolved shadow. We need **chained resolution** or elevation to hold final values. Chained: if resolveToken returns a string that looks like a token path (e.g. contains no spaces, matches token pattern), resolve again. That could be a small change to resolveToken. Alternatively, elevation in each palette copies the shadow values (duplication but each palette can customize). For dark palette, shadow values might use different rgba. So elevation.1 in dark.json would be the dark theme shadow. That works. We add elevation.0–4 with actual CSS values per palette — palette-specific. Rule 6 says add to palette JSON; we're not hardcoding in TSX. Good.

**Final:** Add `elevation: { "0": "none", "1": "<shadow.sm value>", "2": "<shadow.md value>", ... }` to each palette. Store **final CSS values** (not token paths) so each palette can customize (e.g. dark = stronger shadows). No chained resolution needed for elevation. Presets use `surface.shadow: "elevation.1"`.

---

### D. Global Prominence System

**Location:** Palette + Visual Presets.

**Palette additions:** Already have `color.primary`, `color.surfaceVariant`, `color.onSurface`, etc. Add a `prominence` mapping for reference:

```json
"prominence": {
  "primary": { "background": "color.primary", "color": "color.onPrimary" },
  "secondary": { "background": "color.surfaceVariant", "color": "color.onSurface" },
  "tertiary": { "background": "color.surface", "color": "color.onSurface" }
}
```

**Usage:** Visual presets overlay `surface.background: "color.primary"` for prominent sections/cards when desired. Definitions stay neutral; presets add prominence per experience. No hardcoding in definitions.

**Implementation:** Visual presets extend molecule overrides. "app" might have primary CTA cards: `"card": { "surface": { "background": "color.primary" } }` for a "prominent" card variant. But we don't have variant in preset. Simpler: preset applies global defaults. Prominence could be a **visual preset variant**: e.g. `default-prominent.json` that uses primary for buttons/cards. Or we add a `prominence` key to experience profile that the visual preset resolver reads, and have presets like `default.json`, `prominent.json` where prominent uses primary colors for certain molecules. The plan says "primary/secondary/tertiary styling that works across components" — so we need a way to say "this experience uses prominent styling for buttons". Easiest: extend visual presets with a `prominent` preset that overlays primary colors on button, chip surfaces. Add `prominent.json` visual preset. Experience profile can set `visualPreset: "prominent"` for marketing. No new resolver logic; just another preset file.

---

### E. Density System

**Location:** Visual Presets (extend compact/default/spacious).

**Design:** Density affects padding, gap, radius, optionally typography.

| Density | Padding | Gap | Radius |
|---------|---------|-----|--------|
| compact | padding.sm | gap.sm | radius.sm |
| comfortable | padding.md | gap.md | radius.md |
| spacious | padding.lg | gap.lg | radius.lg |

**Implementation:** Extend `compact.json`, `default.json`, `spacious.json` to include:
- `section.surface`: padding, radius
- `section.layout`: gap
- `card.surface`: padding, radius
- `button` (if in preset): padding
- `list`: collection.gap, layout.gap, surface.padding

All use existing palette tokens. No new tokens needed for density.

---

## Part 3: Exact File Locations

| Change | File(s) |
|--------|---------|
| Typography roles | `src/palettes/default.json`, `dark.json`, `kids.json`, `playful.json`, `elderly.json`, `french.json`, `spanish.json` |
| Surface tiers | `src/palettes/*.json` |
| Elevation levels | `src/palettes/*.json` |
| Prominence reference | `src/palettes/*.json` (optional; can be preset-only) |
| Visual preset extensions | `src/layout/visual-presets/default.json`, `compact.json`, `spacious.json` |
| New presets | `src/layout/visual-presets/prominent.json` (optional) |
| Definition updates | `src/compounds/ui/definitions/section.json`, `card.json`, `button.json` — change to reference `textRole.*` where appropriate |
| Text definition | `src/compounds/ui/definitions/text.json` (new), `src/compounds/ui/index.ts` |
| fontFamily token | `src/palettes/*.json`, `src/components/9-atoms/primitives/text.tsx` (use resolveToken for fontFamily — rule 1) |

---

## Part 4: Merge Order (Verified)

Unchanged:
1. VisualPresetOverlay
2. VariantPreset
3. SizePreset
4. node.params
5. deepMerge → resolveToken per key → Palette

---

## Part 5: Verification Steps

1. **Palette dropdown:** Switch default → dark → kids. Confirm typography (size, color), surfaces (background), shadows change. Load `?screen=apps/diagnostics/app.json`.
2. **Experience / visual preset:** Switch experience (app/website/learning). Confirm density changes (padding, gap). App = compact, learning = spacious.
3. **JSON screens:** Load `?screen=apps/journal_track/app-1.json`, `?screen=apps/diagnostics/app.json`. Confirm Sections, Cards have elevation, typography, spacing. No TSX changes.
4. **Token resolution:** Add temporary log in resolveToken; confirm all values resolve from palette (no raw px/rem in output).

---

## Part 6: Multi-Packet Implementation Plan

### Packet A: Palette Foundation
**Goal:** Add new tokens to all palette files.

**Tasks:**
1. Add `textRole` to `src/palettes/default.json` (and all other palette files).
2. Add `surfaceTier` to `src/palettes/default.json` (and all others).
3. Add `elevation` (0–4) to `src/palettes/default.json` (and all others).
4. Add `fontFamily` to `src/palettes/default.json` (e.g. `"base": "system-ui, sans-serif"`).

**Validation:** `resolveToken("textRole.title.size")` returns numeric size. `resolveToken("elevation.1")` returns shadow value.

---

### Packet B: TextAtom fontFamily Token
**Goal:** Remove hardcoded "Roboto" from TextAtom.

**Tasks:**
1. Ensure `fontFamily.base` exists in all palettes.
2. Update `src/components/9-atoms/primitives/text.tsx`: `fontFamily: resolveToken(params.fontFamily) || resolveToken("fontFamily.base")` — but rule says no hardcoding. So definitions/presets must provide fontFamily. Add `fontFamily.base` to palette. TextAtom: `fontFamily: resolveToken(params.fontFamily ?? "fontFamily.base")`. The fallback is a token path, not a raw value. Allowed.

**Validation:** Text renders with palette font. Changing palette changes font.

---

### Packet C: Text Definition
**Goal:** JSON `type: "text"` nodes get definition-driven styling.

**Tasks:**
1. Create `src/compounds/ui/definitions/text.json` with variants (body, label, caption, title) and sizes.
2. Add `text` to `src/compounds/ui/index.ts` exports.
3. Registry already has `text`/`Text`; JsonRenderer will find `definitions.text`.

**Validation:** Standalone text node in JSON receives variant/size from definition.

---

### Packet D: Visual Preset — Typography Roles
**Goal:** Visual presets apply typography roles to section, card, etc.

**Tasks:**
1. Update `default.json`, `compact.json`, `spacious.json` to include `section.title`, `card.text` (title, body) using `textRole.*` tokens.
2. Ensure merge order applies preset before definition (already correct).

**Validation:** Section titles use textRole.title; card body uses textRole.body.

---

### Packet E: Visual Preset — Surface Tiers and Elevation
**Goal:** Presets assign surface tiers and elevation to molecules.

**Tasks:**
1. Update visual presets: section surface uses `surfaceTier.raised` or explicit `background` + `shadow` from elevation.
2. Card elevated variant: `shadow: "elevation.2"`. Ensure definitions or presets supply this.
3. Modal/overlay components: `shadow: "elevation.3"` or `elevation.4`.

**Validation:** Sections/cards have appropriate shadows; palette switch changes shadow values.

---

### Packet F: Visual Preset — Density System
**Goal:** Compact/comfortable/spacious affect padding, gap, radius.

**Tasks:**
1. Extend `compact.json`: section, card, list with padding.sm, gap.sm, radius.sm.
2. Extend `spacious.json`: padding.lg, gap.lg, radius.lg.
3. `default.json`: comfortable (padding.md, gap.md, radius.md).

**Validation:** Experience switch changes density; app=compact, learning=spacious.

---

### Packet G: Visual Preset — Prominence (Optional)
**Goal:** Add prominent preset for primary-colored CTAs.

**Tasks:**
1. Create `src/layout/visual-presets/prominent.json` with button/card surface overlays using `color.primary`, `color.onPrimary`.
2. Add to visual-preset-resolver.
3. Add `visualPreset: "prominent"` to one experience profile for testing.

**Validation:** Screens with prominent preset show primary-colored buttons/cards.

---

### Packet H: Definition Updates — Typography Roles
**Goal:** Definitions reference textRole where appropriate.

**Tasks:**
1. Update `section.json`: `title` uses `textRole.title.size`, `textRole.title.weight`, `textRole.title.lineHeight`.
2. Update `card.json`: `text` (title, body) use `textRole.title`, `textRole.body`.
3. Update `button.json`, `list.json`, `field.json` label/caption slots.

**Validation:** Definitions produce correct typography without per-screen JSON.

---

### Packet I: ResolveToken Chained Resolution
**Goal:** Support `textRole.title.size` → `"textSize.md"` → 16.

**Tasks:**
1. In `resolveParams` or `resolveToken`: when result is a string matching token pattern (e.g. `word.word`), resolve again until a non-token value (number, CSS string, etc.) is obtained.
2. Prevents infinite loops: max depth or detect circular refs.

**Validation:** `"size": "textRole.title.size"` produces numeric fontSize. Elevation uses final values in palette; no chaining needed.

---

### Packet J: Verification and Polish
**Goal:** End-to-end verification.

**Tasks:**
1. Run all verification steps from Part 5.
2. Test palette dropdown, experience switch, multiple JSON screens.
3. Document any remaining gaps.

---

## Execution Order

1. Packet A (Palette Foundation)
2. Packet B (TextAtom fontFamily)
3. Packet I (ResolveToken — only if chained resolution needed; else elevation holds final values)
4. Packet C (Text Definition)
5. Packet D (Visual Preset Typography)
6. Packet E (Visual Preset Surface/Elevation)
7. Packet F (Visual Preset Density)
8. Packet H (Definition Updates)
9. Packet G (Prominence — optional)
10. Packet J (Verification)

---

## Summary

| Layer | Location | Token Source |
|-------|----------|--------------|
| Typography roles | Palette textRole, Definitions, Visual Presets | textRole.display, textRole.body, etc. |
| Surface tiers | Palette surfaceTier (reference), Visual Presets | color.surface + shadow.sm/md/lg |
| Elevation | Palette elevation.0–4 | elevation.1 → shadow value |
| Prominence | Visual Preset prominent.json | color.primary, color.onSurface |
| Density | Visual Presets compact/default/spacious | padding.*, gap.*, radius.* |
| Text definition | definitions/text.json | New definition for text nodes |

All tokens live in palette. All palettes (default, dark, kids, etc.) must include new tokens so the Palette dropdown affects the final result globally.




_________________________________________________
10/10 (PART B)

10/10 Visual Addendum — Add to GLOBAL_JSON_UI_STYLING_MASTER_PLAN.md
Append the following section to GLOBAL_JSON_UI_STYLING_MASTER_PLAN.md after the Summary table (before the final paragraph).

Part 7: 10/10 Visual Polish Additions
These packets elevate the system from 5/10 to 10/10 (Wix-quality) by adding premium token values, custom typography, transitions, and refined visual treatment.

Packet K: Premium Palette
Goal: Create a polished default that feels modern, not 90s.
Tasks:
Add new palette src/palettes/premium.json (or replace default values) with:
Colors: Refined primary (#2563eb or similar), softer surface (#fafafa), muted outline (#e5e7eb), warmer grays
Shadows: Softer, multi-stop — e.g. sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)", md: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)", lg: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)"
Radius: Slightly larger — sm: 6, md: 12, lg: 16, xl: 24 for softer corners
Spacing: More generous — padding/gap add xl (24), 2xl (32)
Add premium to src/palettes/index.ts.
Optionally set premium as default or add to palette dropdown.
Validation: Switch to premium palette; screens look noticeably softer and modern.

Packet L: Transition Tokens and Atom Support
Goal: Smooth hover/focus transitions; no jarring state changes.
Tasks:
Add to all palettes:
"transition": {
  "fast": "150ms ease",
  "base": "200ms ease",
  "slow": "300ms ease",
  "none": "none"
}

Update SurfaceAtom: add transition: resolveToken(params.transition) ?? "none" to style. Use params.transition ?? "transition.base" from definitions/preset.
Update TriggerAtom: add transition: resolveToken(params.transition) when present for opacity/cursor feedback.
Add transition: "transition.base" to Section, Card, Button surface slots in definitions or visual presets.
Validation: Hover over cards/buttons; smooth transitions. No TSX hardcoding; all via params.

Packet M: Premium Typography and Font Loading
Goal: Distinctive fonts (Poppins, DM Sans, or similar); no generic system stack.
Tasks:
Add to all palettes:
"fontFamily": {
  "sans": "DM Sans, system-ui, sans-serif",
  "heading": "Poppins, system-ui, sans-serif",
  "mono": "JetBrains Mono, monospace"
}

Add Google Fonts (or equivalent) preconnect + link in src/app/layout.tsx head: Poppins, DM Sans. Font URLs from fonts.google.com — no hardcoded font files in repo.
Update TextAtom: use resolveToken(params.fontFamily ?? "fontFamily.sans") — remove Roboto fallback (Packet B covers this).
Definitions/presets: section titles use fontFamily: "fontFamily.heading", body uses fontFamily: "fontFamily.sans".
Validation: Typography feels editorial; palette switch can change fonts.

Packet N: Refined Elevation and Surface Tiers
Goal: Softer, more layered elevation; avoid flat or harsh shadows.
Tasks:
In premium (or all) palettes, refine elevation values:
0: none
1: subtle (0 1px 3px rgba(0,0,0,0.06))
2: card (0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04))
3: modal (0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05))
4: popover (0 20px 40px rgba(0,0,0,0.12))
Visual presets: Cards use elevation.2, Modals use elevation.3. Sections use elevation.1 for raised.
Validation: Cards have soft depth; modals feel elevated.

Packet O: Editorial / Hero Density Preset
Goal: Generous whitespace for journal/reading experiences; Wix-style spaciousness.
Tasks:
Create src/layout/visual-presets/editorial.json:
Section: padding.xl or 24px equivalent, gap.lg, radius.lg
Card: padding.lg, radius.lg, elevation.2
Typography: use textRole.display for hero titles, textRole.headline for section titles
Add to visual-preset-resolver.
Map learning (or new "editorial" experience) to editorial preset.
Validation: Journal screens feel spacious and readable.

Packet P: Button and Interactive Polish
Goal: Buttons feel premium — subtle shadow, hover lift, smooth feedback.
Tasks:
Button definitions: add surface.transition: "transition.base", ensure elevation on filled variant.
TriggerAtom: when params.hoverLift is true (from definitions), apply transform: translateY(-1px) on hover via CSS-in-JS or a token-driven approach. If that requires new param, ensure it flows from definitions only — no TSX default.
Optional: add surface.shadow on hover — would require TriggerAtom to accept hoverShadow param and use :hover styles. Document as future enhancement if too invasive.
Validation: Buttons have smooth hover feedback.

Updated Execution Order
Insert after Packet J:
Packet K (Premium Palette)
Packet L (Transition Tokens)
Packet M (Premium Typography + Font Loading)
Packet N (Refined Elevation)
Packet O (Editorial Preset)
Packet P (Button Polish)

Updated Summary Table (Add Rows)
Layer
Location
Token Source
Premium palette
src/palettes/premium.json
Full palette override
Transitions
Palette transition.*, SurfaceAtom, TriggerAtom
transition.base, transition.fast
Premium typography
Palette fontFamily.*, layout.tsx font load
fontFamily.sans, fontFamily.heading
Refined elevation
Palette elevation.0–4
Softer shadow values
Editorial density
visual-presets/editorial.json
padding.xl, gap.lg
Button polish
Button definitions, TriggerAtom
hoverLift, transition


Expected Outcome
After all packets (A–P): JSON screens achieve 10/10 visual polish — distinctive typography, soft elevation, smooth transitions, generous spacing, and refined color harmony. Palette dropdown and experience selection control the result. No per-screen JSON hacks; no TSX hardcoding.




