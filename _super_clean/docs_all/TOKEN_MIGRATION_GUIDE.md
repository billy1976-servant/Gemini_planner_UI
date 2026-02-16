# Token Migration Quick Reference

**Purpose**: Help developers migrate from legacy tokens to new semantic tokens  
**Status**: Both old and new tokens work - this is for best practices

---

## 🎨 Surface Tokens

### Old Pattern
```json
"background": "color.surface"
"background": "color.surfaceVariant"
```

### New Pattern (Semantic)
```json
"background": "surface.app"       // App canvas (deepest)
"background": "surface.section"   // Section containers
"background": "surface.card"      // Card/content surfaces
"background": "surface.elevated"  // Floating elements
"background": "surface.variant"   // Alternate surface
```

**Rule**: Choose by **intent**, not by appearance
- App background? → `surface.app`
- Section container? → `surface.section`
- Card content? → `surface.card`
- Modal/dropdown? → `surface.elevated`

---

## 📏 Spacing Tokens

### Old Pattern
```json
"padding": "padding.md"   // What does "md" mean here?
"gap": "gap.sm"          // Is this vertical or horizontal?
```

### New Pattern (Semantic)
```json
// For padding
"padding": "spacing.sectionPadding"  // 32px - section breathing room
"padding": "spacing.cardPadding"     // 20px - card content
"padding": "spacing.inlinePadding"   // 12px - tight inline elements

// For gaps
"gap": "spacing.stackGap"      // 20px - vertical rhythm
"gap": "spacing.inlineGap"     // 12px - horizontal grouping
"gap": "spacing.compactGap"    // 6px - tight groups
```

**When to use old vs new**:
- Old (`padding.md`): One-off overrides, non-standard spacing
- New (`spacing.cardPadding`): Standard component patterns

---

## 🌊 Elevation (Shadow) Tokens

### Old Pattern
```json
"shadow": "shadow.sm"    // Small shadow
"shadow": "shadow.md"    // Medium shadow
"shadow": "shadow.lg"    // Large shadow
"shadow": "elevation.3"  // What does "3" mean?
```

### New Pattern (Semantic)
```json
"shadow": "elevation.none"    // No shadow
"shadow": "elevation.low"     // Subtle lift (buttons, default cards)
"shadow": "elevation.mid"     // Standard elevation (elevated cards, dropdowns)
"shadow": "elevation.strong"  // Strong depth (modals, panels)
"shadow": "elevation.float"   // Maximum depth (bottom sheets, mega menus)
```

**Mapping**:
- `shadow.sm` / `elevation.1` → `elevation.low`
- `shadow.md` / `elevation.2` → `elevation.mid`
- `shadow.lg` / `elevation.3` → `elevation.strong`
- `elevation.4` → `elevation.float`

---

## ⭕ Radius Tokens

### Old Pattern
```json
"radius": "radius.lg"    // 18px
"radius": "radius.xl"    // 24px
```

### New Pattern (Added)
```json
"radius": "radius.pill"  // 9999 - full pill shape for chips, pills, tabs
```

**Use pill for**:
- Chips
- Pills/badges
- Segmented controls
- Tab navigation
- Avatar circles
- Toast notifications

---

## 🎯 Border/Outline Tokens

### Old Pattern
```json
"borderColor": "color.outline"    // All-purpose border
"borderColor": "color.secondary"  // Darker border
```

### New Pattern (Refined)
```json
"borderColor": "color.outline"        // Soft border (most common)
"borderColor": "color.outlineVariant" // Medium border
"borderColor": "color.outlineStrong"  // Strong border
```

**Use**:
- Default cards/fields → `color.outline`
- Hover/focus states → `color.outlineVariant`
- Active/selected → `color.outlineStrong`

---

## ✍️ Typography Tokens

### Old Pattern
```json
"weight": "textWeight.medium"    // 500
"weight": "textWeight.semibold"  // 600
```

### New Pattern (Strengthened)
```json
// Headlines are now bold by default
"size": "textRole.headline.size"    // Now uses bold (700)
"weight": "textRole.headline.weight"

// Labels are now semibold by default
"size": "textRole.label.size"       // Now uses semibold (600)
"weight": "textRole.label.weight"

// Body text has relaxed line height
"lineHeight": "textRole.body.lineHeight"  // Now 1.65 (was 1.5)
```

### New Text Role
```json
"subtitle": {
  "size": "textSize.lg",          // 18px
  "weight": "textWeight.medium",  // 500
  "color": "color.secondary"      // Subdued
}
```

**Use for**: Subheadings, card subtitles, section descriptions

---

## 🔄 Migration Examples

### Card Component
**Before**:
```json
{
  "surface": { 
    "background": "color.surface", 
    "shadow": "shadow.md", 
    "padding": "padding.md" 
  }
}
```

**After**:
```json
{
  "surface": { 
    "background": "surface.card", 
    "shadow": "elevation.low", 
    "padding": "spacing.cardPadding" 
  }
}
```

---

### Section Component
**Before**:
```json
{
  "surface": { 
    "background": "color.surface", 
    "padding": "padding.md" 
  },
  "layout": { 
    "gap": "gap.md" 
  }
}
```

**After**:
```json
{
  "surface": { 
    "background": "surface.section", 
    "padding": "spacing.sectionPadding" 
  },
  "layout": { 
    "gap": "spacing.stackGap" 
  }
}
```

---

### Button Component
**Before**:
```json
{
  "surface": { 
    "background": "color.primary", 
    "shadow": "shadow.sm" 
  }
}
```

**After**:
```json
{
  "surface": { 
    "background": "color.primary", 
    "shadow": "elevation.low" 
  }
}
```

---

### Modal Component
**Before**:
```json
{
  "surface": { 
    "background": "color.surface", 
    "shadow": "elevation.3" 
  }
}
```

**After**:
```json
{
  "surface": { 
    "background": "surface.elevated", 
    "shadow": "elevation.strong" 
  }
}
```

---

### Chip Component
**Before**:
```json
{
  "surface": { 
    "background": "color.surfaceVariant", 
    "radius": "radius.lg" 
  }
}
```

**After**:
```json
{
  "surface": { 
    "background": "surface.variant", 
    "radius": "radius.pill" 
  }
}
```

---

## 🎯 When to Use Each Token

### Surface Hierarchy
```
surface.app          ← App canvas (F5F5F7 light, #000 dark)
  └─ surface.section ← Section containers (FAFAFA light, #0A0A0A dark)
       └─ surface.card ← Cards/content (#FFF light, #1C1C1E dark)
            └─ surface.elevated ← Floating UI (#FFF light, #2C2C2E dark)
```

### Elevation Hierarchy
```
elevation.none   → Sections, inline elements
elevation.low    → Default cards, buttons
elevation.mid    → Elevated cards, dropdowns, toasts
elevation.strong → Modals, panels
elevation.float  → Bottom sheets, mega menus
```

### Spacing Hierarchy
```
spacing.sectionPadding  → 32px (lg)  - Sections
spacing.cardPadding     → 20px (md)  - Cards, modals
spacing.inlinePadding   → 12px (sm)  - Buttons, fields

spacing.stackGap        → 20px (md)  - Vertical rhythm
spacing.inlineGap       → 12px (sm)  - Horizontal grouping
spacing.compactGap      → 6px (xs)   - Tight elements
```

---

## ✅ Best Practices

### DO
✅ Use semantic tokens for standard patterns  
✅ Use `surface.*` for backgrounds  
✅ Use `elevation.*` for shadows  
✅ Use `spacing.*` for common padding/gap patterns  
✅ Use `radius.pill` for fully rounded elements  
✅ Use `color.outline` for borders (not `color.secondary`)

### DON'T
❌ Don't use hardcoded values  
❌ Don't use `color.surface` for all backgrounds (use `surface.*` hierarchy)  
❌ Don't use `shadow.sm/md/lg` for new code (use `elevation.*`)  
❌ Don't use `padding.md` when `spacing.cardPadding` is more semantic  
❌ Don't use `radius.lg` for pills (use `radius.pill`)

---

## 🔍 Token Resolution

All tokens resolve through the same chain:
1. JSON references token → `"background": "surface.card"`
2. Palette resolves token → `palette.surface.card` → `"#FFFFFF"`
3. Component receives value → `background: "#FFFFFF"`

**Both work**:
- `"background": "color.surface"` → `"#FFFFFF"` ✅
- `"background": "surface.card"` → `"#FFFFFF"` ✅

**Choose based on intent, not output.**

---

## 📚 Full Token Reference

See `src/04_Presentation/palettes/default.json` for complete token list.

---

**Migration is optional but recommended for new code.**  
**All existing code continues to work unchanged.**
