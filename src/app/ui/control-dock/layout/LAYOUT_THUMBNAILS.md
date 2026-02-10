# Layout Thumbnail System

## Overview

This is HiSense's semantic SVG thumbnail system for the Layout Picker. Each layout thumbnail uses a consistent visual grammar to instantly communicate layout intent through distinct silhouettes.

## Key Features

- **Semantic SVG Components**: No static screenshots, all generated as React SVG components
- **Consistent Visual Grammar**: Shared primitives across all icons (bands, columns, cards, CTAs, etc.)
- **Distinct Silhouettes**: Each layout has a unique visual signature
- **Fast Rendering**: Lightweight SVG components with no heavy dependencies
- **Scalable**: Thumbnails scale cleanly at any size

## Files

- **`LayoutThumbnail.tsx`** - Main component that renders semantic SVG thumbnails
- **`layoutThumbnails.tsx`** - Adapter functions that integrate thumbnails into the layout picker
- **`LayoutThumbnailShowcase.tsx`** - Visual QA page showing all thumbnails
- **`/public/layout-thumbnails/*.svg`** - Static SVG files (backup/fallback)

## Usage

### In Layout Picker

The thumbnail system is automatically integrated into the OrganPanel layout picker:

```tsx
import { getSectionLayoutThumbnail } from "@/app/ui/control-dock/layout/layoutThumbnails";

// Use in layout picker
const thumbnail = getSectionLayoutThumbnail("hero-split");
```

### Direct Component Usage

```tsx
import LayoutThumbnail from "@/app/ui/control-dock/layout/LayoutThumbnail";

// Render a thumbnail
<LayoutThumbnail 
  layoutId="hero-centered" 
  selected={false}
  size={64}
/>
```

### Visual QA Page

Access the showcase at: **http://localhost:3000/layout-thumbnails-demo**

This page displays all thumbnails in a grid with:
- Size controls (64px, 96px, 128px)
- Hover states
- Selection states
- Visual grammar documentation

## Visual Grammar

### Primitives

Each layout thumbnail is composed of semantic primitives:

| Primitive | Description | Usage |
|-----------|-------------|-------|
| **Band** | Full-width horizontal strip | Content sections, header areas |
| **Column** | Vertical region with rounded corners | Sidebars, content areas |
| **Card** | Rounded rectangle block | Feature cards, testimonials, CTAs |
| **CTA** | Pill-shaped button | Call-to-action buttons |
| **Image** | Light blue block with icon | Media content areas |
| **Icon** | Small circle dot | Feature icons, avatars |
| **Quote** | Quotation mark | Testimonial indicators |
| **Text** | Thin gray lines | Body text representation |

### Color Semantics

Colors convey meaning consistently across all thumbnails:

| Color | Hex | Usage |
|-------|-----|-------|
| Canvas | `#f8fafc` | Background |
| Header | `#334155` | Header bands (dark) |
| Content | `#e2e8f0` | Content blocks (light) |
| Content Dark | `#cbd5e1` | Darker content areas |
| Accent | `#3b82f6` | CTA buttons, icons |
| Image | `#e0f2fe` + `#0ea5e9` border | Media areas |
| Text | `#94a3b8` | Body text lines |
| Quote | `#64748b` | Quote marks |

## Layout Blueprints

Each layout has a unique blueprint defining its visual structure:

### Hero Layouts

- **`hero-centered`**: Centered title + text + CTA pill
- **`hero-split`**: Left content column + right image block
- **`hero-split-image-left`**: Left image block + right content column
- **`hero-full-bleed-image`**: Full-width image with centered overlay card

### Content Layouts

- **`content-narrow`**: Narrow centered content column
- **`content-stack`**: Three stacked horizontal bands
- **`image-left-text-right`**: Left image + right content column

### Feature Layouts

- **`features-grid-3`**: 3×2 grid of feature cards with icons
- **`feature-grid-3`**: 3 tall feature cards with icons

### Other Layouts

- **`testimonial-band`**: Three testimonial cards with quote marks and avatars
- **`cta-centered`**: Centered CTA card with title and button
- **`default`**: Generic header band + text lines

## Adding New Layouts

To add a new layout thumbnail:

1. **Define the blueprint** in `LayoutThumbnail.tsx`:

```tsx
const LAYOUT_BLUEPRINTS: Record<string, Primitive[]> = {
  // ... existing layouts
  "my-new-layout": [
    { type: "band", y: 10, height: 20, color: COLORS.header },
    { type: "text", x: 14, y: 35, width: 92 },
    { type: "cta", x: 40, y: 55, width: 40, height: 10 },
  ],
};
```

2. **Add to registry** in `layoutThumbnailRegistry.ts`:

```tsx
export const SECTION_LAYOUT_THUMBNAILS: Record<string, string> = {
  // ... existing mappings
  "my-new-layout": `${BASE}/my-new-layout.svg`,
};
```

3. **Create static SVG** in `/public/layout-thumbnails/my-new-layout.svg` (optional, for fallback)

4. **Add to showcase** in `LayoutThumbnailShowcase.tsx`:

```tsx
const ALL_LAYOUT_IDS = [
  // ... existing IDs
  "my-new-layout",
];
```

## Design Guidelines

When creating new layout thumbnails:

1. **Use primitives consistently** - Don't invent new shapes, use the existing primitives
2. **Maintain distinct silhouettes** - Each layout should be visually unique at a glance
3. **Follow color semantics** - Use colors consistently (e.g., blue for images, accent for CTAs)
4. **Keep it simple** - 3-7 primitives per thumbnail is ideal
5. **Test at multiple sizes** - Verify thumbnails are clear at 64px, 96px, and 128px
6. **Align to grid** - Use consistent spacing and alignment across all thumbnails

## Coordinate System

Thumbnails use a `120×90` viewBox:

- **X-axis**: 0-120 (left to right)
- **Y-axis**: 0-90 (top to bottom)
- **Safe area**: 8-112 (X), 10-80 (Y)
- **Typical margins**: 8-14px from edges

## Performance

The thumbnail system is optimized for performance:

- **No external dependencies** - Pure React + SVG
- **Lightweight components** - Each thumbnail is ~1-2KB
- **Fast rendering** - No image loading, instant display
- **Scalable** - SVG scales without quality loss

## Testing

To verify the thumbnail system:

1. **Visual QA**: Visit `/layout-thumbnails-demo`
2. **Integration test**: Open OrganPanel in the layout picker
3. **Check all sizes**: Test 64px, 96px, and 128px in the showcase
4. **Verify consistency**: All thumbnails should follow the same visual grammar

## Maintenance

When updating the thumbnail system:

- Keep `LayoutThumbnail.tsx` blueprints in sync with static SVG files
- Update the showcase when adding new layouts
- Test in the actual layout picker, not just the showcase
- Document any new primitives or color changes

---

**Last updated**: February 10, 2026
**Maintained by**: HiSense Development Team
