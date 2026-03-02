# Requested System Description
<user description>

# Available System Surface
(All discovered components — Cursor must choose from these only. See BUILD_AUTHORITY_SURFACE.json for machine-readable.)

## Palettes
apple, crazy, dark, default, elderly, french, hiclarify, kids, playful, premium, spanish, ui-atom-token

## Layout IDs (pageLayouts)
hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered, test-extensible, none

## Layout IDs (componentLayouts)
hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, testimonial-band, cta-centered, none

## Templates
{
  "startup-template": {
    "hero": "hero-split",
    "features": "features-grid-3",
    "content": "content-stack"
  }
}

## Molecules
avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar

## Organs (and variants)
- **hero**: variants: centered, image-bg, split-left, split-right, full-screen, short, with-cta, video-ready, right-aligned; slots: hero.title, hero.subtitle, hero.media, hero.cta
- **header**: variants: default, sticky-split, transparent, minimal, centered, full-width, mega-ready, shrink-on-scroll, with-announcement, compact, logo-center, nav-left; slots: header.logo, header.cta
- **nav**: variants: default, dropdown, mobile-collapse, centered-links; slots: nav.primary, nav.logo, nav.links, nav.cta
- **footer**: variants: multi-column, minimal, with-newsletter, centered, dense; slots: footer.primary, footer.columns, footer.newsletter, footer.copyright
- **content-section**: variants: text-only, media-left, media-right, zigzag; slots: content.title, content.body, content.media, content.block1, content.block2
- **features-grid**: variants: 2-col, 3-col, 4-col, repeater; slots: features.items, features.title, features.cards
- **gallery**: variants: grid-2, grid-3, grid-4, carousel-ready; slots: gallery.items, gallery.title, gallery.images
- **testimonials**: variants: grid-3, grid-2, single-featured, carousel-ready; slots: testimonials.items, testimonials.title, testimonials.featured
- **pricing**: variants: 2-tier, 3-tier, 4-tier, highlighted, minimal; slots: pricing.primary, pricing.title, pricing.tiers
- **faq**: variants: accordion, list, two-column; slots: faq.primary, faq.title, faq.items
- **cta**: variants: banner, strip, split, full-width; slots: cta.primary, cta.title, cta.body, cta.button

## Actions
logic:runCalculator, logic:run25x, logic:resolveOnboarding, diagnostics:capabilityDomain, diagnostics:sensorRead, diagnostics:system7Route, diagnostics:actionGating, diagnostics:resolveProfile, diagnostics:mediaPayloadHook, diagnostics:exportPdf, diagnostics:exportSummary, diagnostics:setCapabilityLevel, diagnostics:inputLogSnapshot, diagnostics:systemSnapshot, diagnostics:systemSignalsReadAll, diagnostics:plannerParserPipeline, diagnostics:plannerFullParseTrace, structure:addItem, structure:addItems, structure:updateItem, structure:deleteItem, structure:setBlocksForDate, structure:setActivePlanner, structure:cancelDay, structure:addFromText, structure:addJourney, structure:setParserStaging, structure:updateStagingRow, structure:confirmStaging, structure:setTaskFolderTemplate, structure:setTaskTemplateRows, structure:setParserConfig, structure:loadRuleset, structure:ensureTaskTemplateRows, structure:setScheduledSection, structure:parseToStaging, calendar.today, calendar.week, calendar.month, calendar:setDay, calendar:setWeek, calendar:setMonth, calendar:setDate

## Engines
(none discovered)

## Blueprint node types
Choice, Flow, Section, Step, System, avatar, button, card, chip, content-section, cta, faq, features-grid, field, footer, gallery, header, hero, list, modal, nav, organ, pricing, screen, section, stepper, testimonials, toast, toolbar

## Registry type map (JSON type → component)
screen, Screen, text, Text, media, Media, surface, Surface, sequence, Sequence, trigger, Trigger, collection, Collection, condition, Condition, shell, Shell, fieldatom, FieldAtom, textarea, Textarea, section, Section, button, Button, card, Card, avatar, Avatar, chip, Chip, field, Field, footer, Footer, list, List, modal, Modal, stepper, Stepper, toast, Toast, toolbar, Toolbar, question, Question, education, Education, calculator, Calculator, summary, Summary, cta, Cta, CTA, UserInputViewer, userInputViewer, userinputviewer, JournalHistory, journalHistory, journalViewer, journalhistory, DiagnosticsValue, select, Select, row, Row, column, Column, grid, Grid, stack, Stack, page, Page, osbHomeV2, appsListV2

## Content keys by molecule (ALLOWED_CONTENT_KEYS)
{
  "button": [
    "label"
  ],
  "avatar": [
    "media",
    "text"
  ],
  "chip": [
    "title",
    "body",
    "media"
  ],
  "field": [
    "label",
    "input",
    "error"
  ],
  "list": [
    "items"
  ],
  "stepper": [
    "steps"
  ],
  "toast": [
    "message"
  ],
  "toolbar": [
    "actions"
  ],
  "modal": [
    "title",
    "body",
    "actions"
  ],
  "section": [
    "title"
  ],
  "footer": [
    "left",
    "right"
  ],
  "card": [
    "title",
    "body",
    "media",
    "actions"
  ]
}

---

# Blueprint Construction Instructions
- Required node types
- Required structure sections
- Required content blocks
- Required layout usage
- Required palette usage

# TSX Wrapper Declaration (Cursor must fill)
Wrapper type: ___________
Explain selection: ___________

# Engine Declaration (Cursor must fill)
Selected engines: ___________
Explain why: ___________

# Registry Impact Check (Cursor must fill)
Does this require:
- New molecule? YES / NO
- New organ? YES / NO
- New layout? YES / NO
- New engine? YES / NO
- New action? YES / NO
If YES → STOP and request approval.

# Contract Compliance (Cursor must fill)
- Molecule contract compliance explanation
- Blueprint contract compliance explanation
- Content contract compliance explanation
- Layout compliance explanation
- Behavior compatibility explanation

# JSON Structure Blocks (Cursor must generate)
- Proposed blueprint.txt
- Proposed content.txt
- Proposed wrapper config JSON

# Verification Checklist (Cursor must fill)
- [ ] Uses Current State system?
- [ ] No schema?
- [ ] No hardcoded TSX?
- [ ] No hardcoded layout?
- [ ] No hardcoded styles?
- [ ] 100% JSON-driven?
- [ ] Compatible across systems?

---
Generated by `npm run apps`. Cursor must fill out this template. Rules and contracts: see .cursor, molecule contract, blueprint contract, BUILD_AUTHORITY_SURFACE.json.