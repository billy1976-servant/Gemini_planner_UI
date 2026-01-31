# Blueprint → Website Quick Reference

**Status:** ✅ Complete System (All 12 Phases)  
**Updated:** 2026-01-31

---

## One-Minute Guide

### 1. Create blueprint

**File:** `src/apps-offline/websites/my-site/blueprint.txt`

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

### 2. Fill content

**File:** `src/apps-offline/websites/my-site/content.txt`

```
1.1 Nav (Navigation)
- logo: { "image": "/logo.png", "alt": "Site", "href": "/" }
- links: [{ "id": "home", "label": "Home", "href": "/" }]
- cta: { "label": "Get Started", "href": "/contact" }

2.1 HeroCard (Card)
- title: "Welcome"
- body: "Build amazing websites"

3.0 Features (Section)
- title: "Features"
- items: [{ "id": "f1", "icon": "⚡", "title": "Fast", "body": "..." }]

4.1 FooterContent (Footer)
- columns: [{ "title": "Company", "links": [...] }]
- copyright: "© 2026"
```

### 3. Compile

```bash
npm run blueprint -- websites/my-site
```

### 4. View

```
http://localhost:3000/?screen=websites/my-site/app
```

### 5. Transform

- **Template dropdown** → 23 styles
- **Palette dropdown** → Multiple colors
- **Result:** Wix-quality website

---

## Section Roles (Use These)

```
(role: header)        — Top navigation
(role: hero)          — Main hero with background
(role: content)       — Main content area
(role: features)      — Feature cards (3-col grid)
(role: gallery)       — Image gallery
(role: testimonials)  — Customer testimonials
(role: pricing)       — Pricing tiers
(role: faq)           — FAQ section
(role: cta)           — Call-to-action banner
(role: footer)        — Footer with columns
```

---

## Available Molecules

**Layout:**
- Section, Navigation, Footer

**Content:**
- Card, Button, Field, Media

**Blocks:**
- PricingTable, FAQ, CTABanner, ImageGallery, IconTextRow

**Display:**
- List, Stepper, Avatar, Chip, Toast, Modal, Toolbar

---

## 23 Templates

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

---

## Examples

**View demo:**
```
http://localhost:3000/?screen=sites/demo-site/home-complete
```

**Compile blueprint:**
```bash
npm run blueprint -- websites/demo-blueprint-site
```

**View result:**
```
http://localhost:3000/?screen=websites/demo-blueprint-site/app
```

---

## Full Documentation

- `docs/BLUEPRINT_WEBSITE_GUIDE.md` — Complete guide
- `docs/WIX_SYSTEM_ARCHITECTURE.md` — Architecture details
- `docs/BLUEPRINT_BUILDS_WEBSITES.md` — System explanation
- `docs/SYSTEM_COMPLETE_SUMMARY.md` — Final summary

---

## The System Works

✅ Blueprint builds websites  
✅ 23 templates transform structure  
✅ Palettes transform colors  
✅ Presets transform density  
✅ Experiences transform shell  

**One blueprint → infinite presentations.**

🚀 **GO BUILD!**
