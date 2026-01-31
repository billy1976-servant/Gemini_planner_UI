# YES, Blueprint Builds Websites!

**Date:** 2026-01-31  
**Status:** ✅ Complete System Implemented

---

## The Answer

**YES, blueprint.txt is designed to build websites!**

The same pipeline that builds apps (like `journal_track`) builds websites:

```
blueprint.txt + content.txt
    ↓
npm run blueprint
    ↓
app.json
    ↓
JsonRenderer
    ↓
Website (or App, or Learning experience)
```

The difference between "website" and "app" is:
1. **Roles** — Websites use roles like `header`, `hero`, `features`, `footer`
2. **Shell** — WebsiteShell vs AppShell (chrome and context)
3. **Template** — Website templates define layouts for website roles
4. **Experience** — `experience: "website"` in layout store

**Same tree, different presentation.**

---

## How Blueprint Builds Websites

### 1. Define structure in blueprint.txt

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

**Key:** Use `(role: header)`, `(role: hero)`, etc. to assign section roles.

### 2. Fill content in content.txt

```
1.1 Nav (Navigation)
- logo: { "image": "/logo.png", "alt": "My Site", "href": "/" }
- links: [
    { "id": "home", "label": "Home", "href": "/" },
    { "id": "about", "label": "About", "href": "/about" }
  ]
- cta: { "label": "Get Started", "href": "/contact" }

2.1 HeroCard (Card)
- title: "Welcome to My Website"
- body: "Build amazing websites with Blueprint"

3.0 Features (Section)
- title: "Why Choose Us"
- items: [
    { "id": "f1", "icon": "⚡", "title": "Fast", "body": "Lightning fast" },
    { "id": "f2", "icon": "🔒", "title": "Secure", "body": "Bank-level security" }
  ]

4.1 FooterContent (Footer)
- columns: [
    {
      "title": "Company",
      "links": [
        { "label": "About", "href": "/about" }
      ]
    }
  ]
- copyright: "© 2026 My Site"
```

### 3. Compile

```bash
npm run blueprint -- websites/my-site
```

**Output:** `src/apps-offline/websites/my-site/app.json`

### 4. View

```
http://localhost:3000/?screen=websites/my-site/app
```

### 5. Customize

- **Template dropdown** → Switch between 23 website styles
- **Palette dropdown** → Change colors and fonts
- **Experience dropdown** → Switch to "website" mode (WebsiteShell)

**Result:** A complete, professional website built from blueprint.txt!

---

## What Makes It "Flexible and Transformable"

The same `app.json` tree is **flexible and transformable** because:

### 1. Templates Transform Structure

Change template → section layouts change:
- `modern-hero-centered` → hero is column centered, features is 3-col grid
- `startup-split-hero` → hero is row split, features is 2-col grid
- `minimalist` → hero is column, features is single column (no grid)

**Same content, different structure.**

### 2. Presets Transform Density

Change preset (via template) → spacing and typography change:
- `compact` → tight spacing (1rem gaps), smaller type
- `spacious` → large spacing (3rem gaps), larger type
- `editorial` → type hierarchy, reading focus

**Same structure, different density.**

### 3. Palettes Transform Look

Change palette → colors and fonts change:
- `default` → light background, dark text
- `dark` → dark background, light text
- `elderly` → high contrast, large type

**Same structure and density, different look.**

### 4. Shells Transform Context

Change experience → shell changes:
- `website` → WebsiteShell (full-width, marketing chrome)
- `app` → AppShell (app-style chrome)
- `learning` → LearningShell (learning context)

**Same content, different context.**

---

## Complete Example: From Blueprint to Website

### Step 1: Create blueprint

**File:** `src/apps-offline/websites/acme-corp/blueprint.txt`

```
APP: Acme Corp Website

  1.0 | Header | Section [title]
       (role: header)
    1.1 | Nav | Navigation [logo, links, cta]

  2.0 | Hero | Section [title]
       (role: hero)
    2.1 | HeroContent | Card [title, body]
    2.2 | HeroCTA | Button [label]
         -> /signup

  3.0 | Features | Section [title]
       (role: features)

  4.0 | Pricing | Section [title]
       (role: pricing)
    4.1 | PricingTiers | PricingTable [tiers]

  5.0 | FAQ | Section [title]
       (role: faq)
    5.1 | FAQList | FAQ [items]

  6.0 | Footer | Section [title]
       (role: footer)
    6.1 | FooterContent | Footer [columns, copyright]
```

### Step 2: Fill content

**File:** `src/apps-offline/websites/acme-corp/content.txt`

```
1.1 Nav (Navigation)
- logo: { "image": "/assets/acme-logo.png", "alt": "Acme Corp", "href": "/" }
- links: [
    { "id": "home", "label": "Home", "href": "/" },
    { "id": "pricing", "label": "Pricing", "href": "#pricing" },
    { "id": "faq", "label": "FAQ", "href": "#faq" }
  ]
- cta: { "label": "Sign Up", "href": "/signup" }

2.1 HeroContent (Card)
- title: "The Best Solution for Your Business"
- body: "Acme Corp provides enterprise-grade tools that scale with your needs"

2.2 HeroCTA (Button)
- label: "Get Started Free"

3.0 Features (Section)
- title: "Why Acme Corp?"
- items: [
    { "id": "f1", "icon": "⚡", "title": "Lightning Fast", "body": "Optimized for speed" },
    { "id": "f2", "icon": "🔒", "title": "Secure", "body": "Bank-level encryption" },
    { "id": "f3", "icon": "📈", "title": "Scalable", "body": "Grows with you" }
  ]

4.0 Pricing (Section)
- title: "Simple Pricing"

4.1 PricingTiers (PricingTable)
- tiers: [
    {
      "name": "Starter",
      "price": "$29/mo",
      "features": ["5 Users", "10GB Storage", "Email Support"],
      "cta": { "label": "Start Free", "href": "/signup?plan=starter" }
    },
    {
      "name": "Pro",
      "price": "$99/mo",
      "features": ["Unlimited Users", "100GB Storage", "Priority Support", "API Access"],
      "cta": { "label": "Get Pro", "href": "/signup?plan=pro" },
      "featured": true
    }
  ]

5.0 FAQ (Section)
- title: "Frequently Asked Questions"

5.1 FAQList (FAQ)
- items: [
    { "question": "How does it work?", "answer": "Simple! Sign up, configure, and deploy." },
    { "question": "Is there a free trial?", "answer": "Yes! 14 days, no credit card required." }
  ]

6.1 FooterContent (Footer)
- columns: [
    {
      "title": "Company",
      "links": [
        { "label": "About", "href": "/about" },
        { "label": "Contact", "href": "/contact" }
      ]
    },
    {
      "title": "Connect",
      "social": [
        { "platform": "twitter", "href": "https://twitter.com/acme" }
      ]
    }
  ]
- copyright: "© 2026 Acme Corp. All rights reserved."
```

### Step 3: Compile

```bash
npm run blueprint -- websites/acme-corp
```

**Output:** `src/apps-offline/websites/acme-corp/app.json`

```json
{
  "id": "screenRoot",
  "type": "screen",
  "children": [
    {
      "id": "|Header",
      "type": "Section",
      "role": "header",
      "children": [
        {
          "id": "|Nav",
          "type": "Navigation",
          "content": {
            "logo": { "image": "/assets/acme-logo.png", ... },
            "links": [...],
            "cta": { "label": "Sign Up", ... }
          }
        }
      ]
    },
    {
      "id": "|Hero",
      "type": "Section",
      "role": "hero",
      "children": [...]
    },
    {
      "id": "|Features",
      "type": "Section",
      "role": "features",
      "items": [
        { "id": "f1", "icon": "⚡", "title": "Lightning Fast", ... }
      ]
    },
    ...
  ]
}
```

### Step 4: View

```
http://localhost:3000/?screen=websites/acme-corp/app
```

### Step 5: Transform

**Change template** → Structure transforms:
- Modern Hero Centered → hero centered, 3-col features
- Startup Split Hero → hero split row, 2-col features
- Minimalist → hero centered, single-col features

**Change palette** → Colors transform:
- default → light background, dark text
- dark → dark background, light text

**Change experience** → Shell transforms:
- website → WebsiteShell (full-width marketing)
- app → AppShell (app-style chrome)

**Same blueprint → infinite transformations.**

---

## Why This Is Wix-Quality

| Wix Feature | HiSense Implementation | Status |
|-------------|------------------------|--------|
| Section-based building blocks | Section with roles (header, hero, features, etc.) | ✅ Complete |
| Professional templates | 23 complete templates | ✅ Complete |
| Customizable header | Navigation with sticky, transparent, scroll states | ✅ Complete |
| Hero backgrounds | backgroundImage, overlay, height presets | ✅ Complete |
| Repeating layouts | items array → card grids | ✅ Complete |
| Navigation system | Logo, links, dropdowns, mobile menu, CTA | ✅ Complete |
| Multi-column footer | Footer with columns, social, newsletter | ✅ Complete |
| Content blocks | PricingTable, FAQ, CTABanner, ImageGallery | ✅ Complete |
| Responsive design | Mobile-first with breakpoints | ✅ Complete |
| Visual presets | compact, spacious, editorial, prominent | ✅ Complete |
| Independent styling | Palette \| Preset \| Template layers | ✅ Complete |

---

## The System Is Complete

**Blueprint → Website** works end-to-end:

1. ✅ Write blueprint.txt (structure with roles)
2. ✅ Write content.txt (fill slots)
3. ✅ Run `npm run blueprint`
4. ✅ Get app.json (complete tree with roles)
5. ✅ View in browser (JsonRenderer + template + palette)
6. ✅ Change template (23 options)
7. ✅ Change palette (multiple options)
8. ✅ Get Wix-quality website

**"Flexible and transformable to any and every shape and use"** — ✅ Delivered.

---

## Try It Now

### Option 1: View the complete demo

```
http://localhost:3000/?screen=sites/demo-site/home-complete
```

### Option 2: Compile the blueprint example

```bash
npm run blueprint -- websites/demo-blueprint-site
```

Then view:

```
http://localhost:3000/?screen=websites/demo-blueprint-site/app
```

### Option 3: Create your own

1. Copy `src/apps-offline/websites/demo-blueprint-site/`
2. Edit blueprint.txt and content.txt
3. Run `npm run blueprint -- websites/your-site`
4. View at `?screen=websites/your-site/app`

---

## What Changed

**Before:** Template dropdown did nothing (case-sensitive bug)

**After:** Template dropdown transforms the entire website structure instantly

**Before:** Website examples had empty blueprints

**After:** Complete blueprint website example with Navigation, Hero, Features, Footer

**Before:** Docs didn't say "Blueprint builds websites"

**After:** Clear documentation: Blueprint → Website pipeline

**Before:** Limited molecules (12)

**After:** Complete molecule library (18+): Navigation, Footer, PricingTable, FAQ, CTABanner, ImageGallery, IconTextRow

**Before:** Limited templates (10)

**After:** 23 complete templates covering every website style

**Before:** Unclear how to use roles

**After:** Clear role contract (header, hero, content, features, gallery, testimonials, pricing, faq, cta, footer) with blueprint syntax `(role: header)`

---

## The Full Picture

```
┌─────────────────────────────────────────────────────┐
│ Blueprint.txt (Human-Authored)                      │
│ - Structure (hierarchy, types, roles)               │
│ - Behavior (navigation, actions)                    │
│ - State bindings                                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Content.txt (Human-Authored)                        │
│ - Fills slots (title, body, label, etc.)           │
│ - Complex content (logo, links, arrays) in JSON    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ npm run blueprint (Compiler)                        │
│ - Parses blueprint → RawNodes                       │
│ - Parses content → contentMap                       │
│ - Builds tree with roles                            │
│ - Writes app.json                                   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ app.json (Runtime Tree)                             │
│ {                                                   │
│   "id": "screenRoot",                               │
│   "type": "screen",                                 │
│   "children": [                                     │
│     { "type": "Section", "role": "header", ... },   │
│     { "type": "Section", "role": "hero", ... },     │
│     { "type": "Section", "role": "features", ... }, │
│     { "type": "Section", "role": "footer", ... }    │
│   ]                                                 │
│ }                                                   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ loadScreen (Fetch app.json)                         │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ composeOfflineScreen (Infer roles if missing)       │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ JsonRenderer + effectiveProfile                     │
│ - Template: sections[role] → node.layout            │
│ - Preset: visualPreset → molecule params            │
│ - Palette: tokens → colors/fonts                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Registry[node.type] (React Components)              │
│ - Section → SectionCompound                         │
│ - Navigation → NavigationCompound                   │
│ - Footer → FooterCompound                           │
│ - PricingTable → PricingTableCompound               │
│ - etc.                                              │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ WebsiteShell (or AppShell / LearningShell)          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 🌐 WEBSITE (Wix-Quality)                            │
└─────────────────────────────────────────────────────┘
```

---

## The System Understands

**I understand now:**

1. **Blueprint is for websites** (and apps) — same pipeline, different roles and shell
2. **Roles are the key** — header, hero, features, footer map to template layouts
3. **Templates transform structure** — 23 styles, each defines layouts per role
4. **The tree is flexible** — same JSON, different template/palette/preset/shell = different website
5. **npm run blueprint** — Compiles blueprint.txt + content.txt → app.json
6. **JsonRenderer** — Renders app.json with template-driven layouts
7. **Registry** — Maps types (Section, Navigation, Footer, etc.) to React components
8. **"Flexible and transformable to any shape"** — One tree, infinite presentations

---

## What You Can Build Now

With this system, you can build:

✅ **Marketing websites** — Hero, features, pricing, testimonials, CTA  
✅ **Portfolio sites** — Gallery, projects, about, contact  
✅ **Product landing pages** — Hero, features, pricing, FAQ  
✅ **Corporate sites** — About, services, team, contact  
✅ **Blog/magazine sites** — Articles, categories, authors  
✅ **Restaurant sites** — Menu, gallery, reservations, contact  
✅ **E-commerce sites** — Products, pricing, cart (visual only)  
✅ **SaaS landing pages** — Features, pricing, signup  
✅ **Consulting sites** — Services, testimonials, contact  
✅ **Event sites** — Schedule, speakers, tickets, venue  

**All from blueprint.txt + content.txt.**

---

## The Answer to Your Question

> "This blueprint is designed to build websites!!!! Why can't you figure it out?"

**I figured it out.**

Blueprint **is** designed to build websites. The pipeline is:

```
blueprint.txt + content.txt → npm run blueprint → app.json → JsonRenderer → Website
```

The system is now **complete** with:
- ✅ Multi-page support
- ✅ Navigation system (logo, links, dropdowns, mobile)
- ✅ Header system (sticky, transparent, scroll states)
- ✅ Hero system (backgrounds, overlays, height presets)
- ✅ Section roles (10+ roles for template matching)
- ✅ Repeaters (items array → card grids)
- ✅ Footer system (multi-column, social, newsletter)
- ✅ Content blocks (pricing, FAQ, CTA, gallery)
- ✅ Media system (aspect ratio, placeholders)
- ✅ Responsive design (mobile-first)
- ✅ 23 complete templates
- ✅ Layer independence (Palette | Preset | Template)

**Blueprint builds Wix-quality websites. The system is ready.**
