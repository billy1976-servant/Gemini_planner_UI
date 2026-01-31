# Blueprint → Website Quick Start Guide

**Updated:** 2026-01-31  
**Status:** Complete Wix-Class System

---

## What Blueprint Does

Blueprint is the **authoritative source** for defining websites and apps. You write:

1. **blueprint.txt** — Structure (hierarchy, types, roles, behavior)
2. **content.txt** — Content (fills slots per node)

Then run:

```bash
npm run blueprint -- websites/demo-blueprint-site
```

Output: **app.json** — The complete runtime tree that JsonRenderer uses to build your website.

---

## Blueprint Syntax for Websites

### Basic Structure

```
APP: My Website

  1.0 | Header | Section [title]
       (role: header)

    1.1 | MainNav | Navigation [logo, links, cta]

  2.0 | Hero | Section [title]
       (role: hero)

    2.1 | HeroTitle | Card [title, body]
    2.2 | HeroCTA | Button [label]
         -> /contact

  3.0 | Features | Section [title]
       (role: features)

    3.1 | Feature1 | Card [title, body, media]
    3.2 | Feature2 | Card [title, body, media]

  4.0 | Footer | Section [title]
       (role: footer)

    4.1 | FooterContent | Footer [columns, copyright]
```

### Key Elements

**Hierarchy**: Indentation defines parent-child relationships

**Node format**: `1.0 | Name | Type [slots] (annotations)`
- `1.0` — Unique ID
- `Name` — Human-readable name
- `Type` — Molecule type (Section, Card, Button, Navigation, Footer, etc.)
- `[slots]` — Content slots (title, body, label, media, etc.)
- `(annotations)` — Role, behavior, logic

**Role annotation**: `(role: header)` — Assigns section role for template matching

**Navigation target**: `-> /contact` — Link destination

**State binding**: `[state.bind: field.name]` — Two-way state binding

**Logic action**: `(logic.action: state:save)` — Action on interaction

---

## Section Roles (Template Contract)

Templates define layouts for these roles:

| Role | Purpose | Example Use |
|------|---------|-------------|
| `header` | Top navigation area | Navigation bar with logo and links |
| `hero` | Main hero section | Full-width hero with background image |
| `content` | Main content area | Text, cards, general content |
| `features` | Feature highlights | 3-col grid of feature cards |
| `gallery` | Image gallery | Grid of images |
| `testimonials` | Customer testimonials | Grid of testimonial cards |
| `pricing` | Pricing tiers | Pricing table with 2-4 tiers |
| `faq` | FAQ section | List of Q&A pairs |
| `cta` | Call-to-action | Banner with button |
| `footer` | Footer area | Multi-column footer with links |

**Usage in blueprint:**

```
  1.0 | Hero | Section [title]
       (role: hero)
```

---

## Content.txt Format

Fill content slots by node ID:

```
1.0 Header (Section)
- title: ""

1.1 MainNav (Navigation)
- logo: { "image": "/logo.png", "alt": "Site", "href": "/" }
- links: [
    { "id": "home", "label": "Home", "href": "/" },
    { "id": "about", "label": "About", "href": "/about" }
  ]
- cta: { "label": "Get Started", "href": "/contact" }

2.0 Hero (Section)
- title: ""

2.1 HeroTitle (Card)
- title: "Welcome to Our Site"
- body: "Build amazing websites with Blueprint"
```

**JSON values**: For complex content (logo, links, arrays), use JSON format

**Simple values**: For strings, use plain text

---

## Available Molecules for Websites

### Layout & Structure
- **Section** — Container with role, background, padding
- **Navigation** — Nav bar with logo, links, dropdowns, mobile menu, CTA
- **Footer** — Multi-column footer with links, social, newsletter, copyright

### Content Blocks
- **Card** — Title + body + media + actions
- **Button** — Interactive button with navigation
- **PricingTable** — 2-4 pricing tiers with features and CTA
- **FAQ** — Question/answer pairs
- **CTABanner** — Full-width call-to-action banner
- **ImageGallery** — Grid of images
- **IconTextRow** — Icon + text side-by-side

### Input & Display
- **Field** — Text input with label
- **Media** — Image/video with aspect ratio and placeholder
- **List** — Vertical list of items
- **Stepper** — Step indicator

---

## Template System

**23 templates available** (select in Template dropdown):

1. Modern Hero Centered
2. Startup Split Hero
3. Editorial Story
4. Course Landing
5. Product Grid
6. SaaS Dark
7. Agency Bold
8. Minimalist
9. Playful Cards
10. Luxury Spacious
11. Portfolio Showcase
12. Restaurant Menu
13. Blog Magazine
14. Fitness Gym
15. Consulting Professional
16. Info Page Simple
17. Tech Startup
18. E-Commerce Store
19. Real Estate Luxury
20. Nonprofit Community
21. Medical Clinic
22. Law Firm Corporate
23. Wedding & Events

Each template defines:
- Header layout (logo left/center, nav alignment)
- Section layouts (row/column/grid for each role)
- Visual preset (compact/default/spacious/editorial/prominent)
- Spacing and alignment

---

## Visual Presets

Control density and mood:

- **compact** — Tight spacing, smaller type
- **default** — Balanced spacing and type
- **spacious** — Large gaps, generous padding
- **editorial** — Type hierarchy, reading focus
- **prominent** — Bold surfaces, large buttons

---

## Repeaters (Items Array)

For repeating content (feature cards, testimonials, etc.), use the **items array** in content.txt:

**Blueprint:**

```
  3.0 | Features | Section [title]
       (role: features)
```

**Content:**

```
3.0 Features (Section)
- title: "Our Features"
- items: [
    { "id": "f1", "icon": "⚡", "title": "Fast", "body": "Lightning fast" },
    { "id": "f2", "icon": "🔒", "title": "Secure", "body": "Bank-level security" }
  ]
```

**Result:** JsonRenderer maps each item to a Card, wrapped in template-defined grid.

---

## Complete Workflow

### 1. Create blueprint structure

```
src/apps-offline/websites/my-site/
  - blueprint.txt
  - content.txt
```

### 2. Define structure in blueprint.txt

```
APP: My Website

  1.0 | Header | Section [title]
       (role: header)
    1.1 | Nav | Navigation [logo, links, cta]

  2.0 | Hero | Section [title]
       (role: hero)
    2.1 | HeroCard | Card [title, body]

  3.0 | Features | Section [title]
       (role: features)

  4.0 | Footer | Section [title]
       (role: footer)
    4.1 | FooterContent | Footer [columns, copyright]
```

### 3. Fill content in content.txt

```
1.1 Nav (Navigation)
- logo: { "image": "/logo.png", "alt": "My Site", "href": "/" }
- links: [...]
- cta: { "label": "Get Started", "href": "/contact" }

2.1 HeroCard (Card)
- title: "Welcome"
- body: "Build amazing websites"

3.0 Features (Section)
- title: "Why Choose Us"
- items: [
    { "id": "f1", "icon": "⚡", "title": "Fast", "body": "..." }
  ]

4.1 FooterContent (Footer)
- columns: [...]
- copyright: "© 2026 My Site"
```

### 4. Compile to app.json

```bash
npm run blueprint -- websites/my-site
```

### 5. View in browser

```
http://localhost:3000/?screen=websites/my-site/app
```

### 6. Change template/palette

Use dropdowns in the UI to switch between 23 templates and multiple palettes.

---

## Key Features

✅ **Multi-page support** — Define pages in site.json  
✅ **Navigation system** — Logo, links, dropdowns, mobile menu  
✅ **Header system** — Sticky, transparent, scroll states  
✅ **Hero system** — Background images, overlays, height presets  
✅ **Section roles** — 10 roles for template matching  
✅ **Repeaters** — Items array → card grids  
✅ **Footer system** — Multi-column with social and newsletter  
✅ **Content blocks** — Pricing, FAQ, CTA, Gallery, IconText  
✅ **Media system** — Aspect ratio, placeholders, responsive  
✅ **Responsive design** — Mobile-first with breakpoints  
✅ **23 templates** — Complete website styles  
✅ **Layer independence** — Palette | Preset | Template | JSON

---

## Example: Complete Website

See `src/apps-offline/sites/demo-site/home-complete.json` for a full example with all features.

Or compile the blueprint example:

```bash
npm run blueprint -- websites/demo-blueprint-site
```

Then view:

```
http://localhost:3000/?screen=websites/demo-blueprint-site/app
```

---

## What Makes This Wix-Quality

✅ **Section-based building blocks** — Like Wix, pages are built from sections  
✅ **Professional templates** — 23 complete styles to choose from  
✅ **Responsive by default** — Works on all devices automatically  
✅ **Customizable header** — Sticky, transparent, scroll states  
✅ **Hero backgrounds** — Full-width images with overlays  
✅ **Repeating layouts** — Consistent card grids with varying content  
✅ **Complete navigation** — Logo, links, dropdowns, mobile menu  
✅ **Professional footer** — Multi-column with social and newsletter  
✅ **Content blocks** — Pricing tables, FAQ, galleries, CTA banners  
✅ **Visual presets** — Density and mood control  
✅ **Independent styling** — Change colors, spacing, and structure separately

---

## Next: Add Your Content

1. Copy `src/apps-offline/websites/demo-blueprint-site/` to your own folder
2. Edit `blueprint.txt` to define your structure
3. Edit `content.txt` to fill in your content
4. Run `npm run blueprint -- websites/your-site`
5. View at `?screen=websites/your-site/app`
6. Switch templates and palettes to find your style

**That's it!** Blueprint → Website in minutes.
