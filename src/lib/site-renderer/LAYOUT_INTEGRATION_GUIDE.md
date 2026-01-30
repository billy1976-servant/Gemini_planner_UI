# Layout System Integration Guide

## How Layout System Works

### 1. **Layout Store** (`src/engine/core/layout-store.ts`)

Global state managing active layout:
- `type`: "column" | "row" | "grid" | "stacked" | "page"
- `preset`: string | null (e.g., "centered", "tight", "spacious")
- `getLayout()` - Get current layout
- `setLayout({ type?, preset? })` - Update layout
- `subscribeLayout(cb)` - Subscribe to changes

### 2. **Experience Profiles** (`src/layout/presentation/`)

Define layout defaults per experience:
- `website.profile.json` - Marketing/content-first
- `app.profile.json` - App interface
- `learning.profile.json` - Learning flow

**Structure:**
```json
{
  "defaults": {
    "container": "page",
    "maxWidth": "1200px",
    "navigation": "top"
  },
  "sections": {
    "hero": { "type": "column", "params": { "align": "center" } },
    "features": { "type": "grid", "params": { "columns": 3 } }
  }
}
```

### 3. **Layout Definitions** (`src/layout/definitions-molecule/`)

JSON files defining layout flows:
- `layout-column.json` - Vertical stacking
- `layout-row.json` - Horizontal stacking
- `layout-grid.json` - Grid layout
- `layout-stacked.json` - Overlapping

Each has:
- `defaults` - Base params
- `presets` - Named variations
- `layout.flow` - Flow type
- `layout.params` - CSS properties

### 4. **Layout Resolver** (`src/layout/molecule-layout-resolver.ts`)

Converts layout flow + preset → CSS properties:
```typescript
resolveMoleculeLayout("grid", "threeColumn", { gap: "2rem" })
// Returns: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }
```

### 5. **Profile Resolver** (`src/layout/profile-resolver.ts`)

Gets section defaults from experience profile:
```typescript
resolveProfileLayout("website", "hero")
// Returns: { type: "column", params: { align: "center", gap: "2rem" } }
```

---

## Connection Flow

### Experience Dropdown → Layout Store

1. User selects "Website" in dropdown
2. `setLayout({ preset: "website" })` called
3. Layout store updates
4. Subscribers notified
5. Components re-render with new layout

### Section Layout Dropdown → Section JSON

1. User selects "grid" for a section
2. Updates `section.layout.type = "grid"` in JSON
3. Layout resolver applies grid flow
4. Section re-renders with grid layout

---

## Integration with TSX Website System

### Current State

✅ **Working:**
- Layout store functional
- Experience profiles defined
- Layout resolver works
- Dropdowns in navigator

❌ **Missing:**
- Site renderer doesn't use layout store
- Sections don't respect experience profiles
- No per-section layout control

### Integration Strategy

#### Option 1: **Experience Profile Integration** (Recommended)

1. **Read experience from layout store:**
   - Get current experience (website/app/learning)
   - Apply profile defaults to sections

2. **Apply to PageContainer:**
   - Use `useContainerLayout()` hook
   - Gets maxWidth, padding from profile

3. **Apply to sections:**
   - Use `useSectionLayout(sectionType)` hook
   - Gets layout flow from profile defaults
   - Falls back to global layout store

#### Option 2: **Schema-Level Layout** (More Control)

1. **Extend SiteSchema:**
   ```typescript
   export interface SitePageSchema {
     layout: SiteLayout[];
     layoutFlow?: "column" | "row" | "grid"; // Page-level
   }
   
   export type SiteLayout = 
     | { type: "hero"; ...; layout?: { type: string; preset?: string } } // Block-level
   ```

2. **Compiler respects experience:**
   - Read experience profile during compilation
   - Inject layout hints into schema

3. **Renderer applies layout:**
   - Use `resolveMoleculeLayout()` for each section
   - Apply CSS properties from resolved layout

---

## Implementation

### Step 1: Experience Integration

**Update GeneratedSiteViewer:**
```typescript
import { useContainerLayout } from "@/lib/site-renderer/layout-bridge";
import { getLayout } from "@/engine/core/layout-store";

// Get experience from layout preset
const layout = getLayout();
const experience = layout.preset || "website";
const containerStyles = useContainerLayout(experience);
```

**Update PageContainer:**
```typescript
export default function PageContainer({ children, containerStyles }) {
  return (
    <div style={{
      ...containerStyles, // From experience profile
      minHeight: "100vh",
    }}>
      {children}
    </div>
  );
}
```

### Step 2: Section Layout Integration

**Update renderFromSchema:**
```typescript
import { useSectionLayout } from "@/lib/site-renderer/layout-bridge";

// For each section, apply layout
const sectionStyles = useSectionLayout("hero", experience);
<div style={sectionStyles}>
  {renderLayoutBlock(...)}
</div>
```

### Step 3: Schema Layout Support (Optional)

**Add layout to schema blocks:**
```typescript
// In compileSiteToSchema, inject layout hints
if (sectionType === "hero") {
  return {
    type: "hero",
    heading: "...",
    layout: { type: "column", preset: "centered" } // From profile
  };
}
```

---

## Benefits

1. **Consistent Layouts:**
   - Website experience → Marketing layout
   - App experience → Interface layout
   - Learning experience → Flow layout

2. **Dynamic Switching:**
   - Change experience dropdown → Site layout updates
   - No schema recompilation needed

3. **Section Control:**
   - Per-section layout overrides
   - Respects experience defaults
   - Falls back gracefully

---

## Testing

1. **Change experience dropdown** → Container maxWidth changes
2. **Change layout type** → Section flows update
3. **Verify profile defaults** → Sections use correct layouts

---

## Conclusion

**YES, layout system CAN drive TSX website system.**

The infrastructure is ready:
- ✅ Layout store works
- ✅ Experience profiles defined
- ✅ Layout resolver works
- ✅ Dropdowns functional

**What's needed:**
- Connect layout store to site renderer
- Apply experience profiles to sections
- Use layout resolver for CSS properties

The system is **85% ready** - needs connection layer similar to palette bridge.
