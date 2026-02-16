# JOURNAL TEMPLATE ROLE EXPANSION AUDIT + IMPLEMENTATION PLAN
**HiSense System — Journal Role Architecture**
**Date:** 2026-02-12

---

## STEP 1 — SYSTEM AUDIT

### 1.1 JOURNAL SCREEN JSON FILES

**Location:** `src/01_App/apps-json/apps/journal_track/`

**Files Found:**
1. `journal_replicate.json` ✅ **USING ROLES**
2. `app.json` ⚠️ **USING EXPLICIT LAYOUTS (bypassing templates)**

#### journal_replicate.json Analysis
```json
{
  "id": "trackJournal",
  "type": "section",
  "role": "writing",  // ✅ HAS ROLE
  "children": [
    {
      "id": "sharedJournalSection",
      "type": "section",
      "role": "focus"  // ✅ HAS ROLE
    }
  ]
}
```

**Status:** ✅ **PROPERLY CONFIGURED**
- `trackJournal` section → role: "writing"
- `sharedJournalSection` → role: "focus"
- **No explicit layout overrides** → templates will control layout

#### app.json Analysis
```json
{
  "id": "|HeroSection",
  "type": "Section",
  "layout": "hero-centered",  // ❌ EXPLICIT LAYOUT (bypasses template)
  
  "id": "|TrackLesson",
  "layout": "content-stack",   // ❌ EXPLICIT LAYOUT (bypasses template)
  
  "id": "|SharedJournalSection",
  "layout": "content-narrow"   // ❌ EXPLICIT LAYOUT (bypasses template)
}
```

**Status:** ⚠️ **BYPASSING TEMPLATE SYSTEM**
- All sections have explicit `layout` property
- No `role` properties defined
- Templates cannot reshape these sections

**Impact:** This file completely bypasses the template system's layout control.

---

### 1.2 TEMPLATE PROFILES ANALYSIS

**Location:** `src/04_Presentation/lib-layout/template-profiles.json`

#### Template Classification

**WEBSITE TEMPLATES (16 total):**
All using **marketing roles** (hero, features, content, gallery, testimonials, pricing, cta, footer, products, nav, header, faq)

1. modern-hero-centered
2. startup-split-hero
3. editorial-story
4. course-landing (experience: "learning")
5. product-grid
6. saas-dark
7. agency-bold
8. minimalist
9. playful-cards
10. luxury-spacious
11. portfolio-showcase
12. restaurant-menu
13. blog-magazine
14. fitness-gym
15. consulting-professional
16. info-page-simple
17. tech-startup
18. e-commerce-store
19. real-estate-luxury
20. nonprofit-community
21. medical-clinic
22. law-firm-corporate
23. wedding-events

**APP TEMPLATE (1 total):**
24. hiclarify-media-player (mixed roles)

**JOURNAL TEMPLATES (8 total) ✅ USING JOURNAL ROLES:**
25. focus-writing
26. guided-reflection
27. contemplative-space
28. structured-journal
29. minimal-distraction
30. evening-journal
31. morning-pages
32. course-reflection

#### Journal Templates — Current Implementation

All 8 journal templates use:
- `experience: "journal"`
- `layoutVariants` object mapping roles to layouts
- **Journal-specific roles:** `writing`, `focus`, `track`

**Example: focus-writing template**
```json
{
  "id": "focus-writing",
  "experience": "journal",
  "visualPreset": "compact",
  "spacingScale": "default",
  "cardPreset": "borderless",
  "containerWidth": "narrow",
  "layoutVariants": {
    "writing": {
      "layoutId": "content-narrow",
      "containerWidth": "narrow",
      "params": {
        "gap": "0.5rem",
        "padding": "2rem 1rem",
        "maxWidth": "65ch"
      }
    },
    "focus": {
      "layoutId": "content-narrow",
      "containerWidth": "narrow",
      "params": {
        "gap": "0.75rem",
        "padding": "1.5rem 1rem"
      }
    },
    "track": {
      "layoutId": "content-stack",
      "containerWidth": "narrow",
      "params": {
        "gap": "0.5rem",
        "padding": "1rem"
      }
    }
  }
}
```

**Status:** ✅ **PROPERLY ARCHITECTED**
- All 8 journal templates support `layoutVariants`
- Role-based layout mapping is active
- Each role gets custom params (gap, padding, maxWidth)

---

### 1.3 LAYOUT RESOLVER ANALYSIS

**Location:** `src/04_Presentation/layout/section-layout-id.ts`

#### Resolution Order (Current Implementation)

```typescript
function getSectionLayoutId() {
  // Priority chain:
  // 1. override (sectionLayoutPresetOverrides)
  // 2. explicit node.layout
  // 3. template layoutVariants[node.role]  ← JOURNAL ROLE SUPPORT
  // 4. template role (legacy getPageLayoutId)
  // 5. template default
  // 6. fallback: "content-stack"
}
```

**Authority Ladder:**
```
override > explicit node.layout > template layoutVariants > template role > template default > fallback
```

**Status:** ✅ **JOURNAL ROLE SUPPORT ALREADY IMPLEMENTED**

Key code section (lines 88-93):
```typescript
const layoutVariant = 
  !existingLayoutId && !overrideId && nodeRole && templateProfile?.layoutVariants?.[nodeRole]
    ? templateProfile.layoutVariants[nodeRole]
    : null;
const layoutVariantId = layoutVariant?.layoutId?.trim() || null;
```

**This resolver already supports journal roles via `layoutVariants`!**

---

### 1.4 LAYOUT DEFINITIONS ANALYSIS

**Location:** `src/04_Presentation/layout/data/layout-definitions.json`

#### Available Layout IDs

**Page Layouts:**
- hero-centered
- hero-split
- hero-split-image-right
- hero-split-image-left
- hero-full-bleed-image
- content-narrow
- content-stack
- image-left-text-right
- features-grid-3
- testimonial-band
- cta-centered
- test-extensible

**Component Layouts:**
Same as page layouts (defines flex/grid params)

**Template Role Mappings:**
```json
"templates": {
  "startup-template": {
    "hero": "hero-split",
    "features": "features-grid-3",
    "content": "content-stack"
  }
}
```

**Status:** ⚠️ **ONLY ONE TEMPLATE HAS ROLE MAPPINGS**
- Only `startup-template` defines role-to-layout mappings
- This is legacy "template role" system (pre-layoutVariants)
- Journal templates bypass this via `layoutVariants` in template-profiles.json

---

### 1.5 JOURNAL ROLES CONFIGURATION

**Location:** `src/04_Presentation/lib-layout/journal-roles.json`

```json
{
  "criticalRoles": ["writing", "focus"],
  "optionalRoles": ["reflect", "action", "track", "prompt", "input", "viewer"],
  "roleDescriptions": {
    "writing": "Primary journaling content area - where users write their entries",
    "focus": "Focused input and interaction area - for prompts and forms",
    "reflect": "Reflection and review area - for viewing past entries",
    "action": "Action buttons and controls - save, submit, navigation",
    "track": "Progress tracking and navigation - stepper, tabs",
    "prompt": "Guiding prompts and questions",
    "input": "Text input fields for journal entries",
    "viewer": "Read-only view of saved entries"
  },
  "roleCompatibility": {
    "writing": ["content-narrow", "content-stack", "reflection-spacious", "focus-narrow"],
    "focus": ["content-stack", "content-narrow", "focus-narrow"],
    "reflect": ["content-stack", "content-narrow", "reflection-spacious"],
    "action": ["content-stack", "action-row"],
    "track": ["navigation-row", "content-stack"]
  }
}
```

**Status:** ✅ **COMPREHENSIVE ROLE DEFINITION**
- 8 journal roles defined
- 2 critical roles (writing, focus)
- 6 optional roles
- Layout compatibility matrix exists

---

## AUDIT SUMMARY

### ✅ WHAT'S WORKING

1. **Journal role architecture is in place:**
   - 8 journal templates with `layoutVariants`
   - journal-roles.json defines complete role set
   - Resolver supports `templateProfile.layoutVariants[node.role]`

2. **journal_replicate.json is properly configured:**
   - Uses `role: "writing"` and `role: "focus"`
   - No explicit layouts → templates will control layout

### ⚠️ WHAT'S BROKEN

1. **app.json bypasses templates entirely:**
   - Uses explicit `layout` property on all sections
   - Has no `role` properties
   - Templates cannot reshape this screen

2. **Only 3 roles currently used in templates:**
   - Templates define: writing, focus, track
   - Defined but unused: reflect, action, prompt, input, viewer

3. **Role coverage gap:**
   - Journal has 8 roles defined
   - Templates only implement 3
   - 5 roles are orphaned

---

## STEP 2 — DESIGN PLAN

### A) JOURNAL ROLE SET (REFINED)

Based on audit, I recommend **5 core journal roles** instead of 8:

```json
{
  "writing": "Primary journaling content area",
  "focus": "Focused prompts and interaction",
  "reflect": "Review and past entries",
  "action": "Buttons and controls",
  "track": "Navigation and progress tracking"
}
```

**Rationale:**
- Collapse `prompt` + `input` + `viewer` into `focus` (they're UI variants, not layout variants)
- Keep 5 semantic layout roles that actually need different spatial treatment

---

### B) SECTION → ROLE MAPPING

#### journal_replicate.json (already correct)
```
trackJournal → writing  ✅
sharedJournalSection → focus  ✅
```

#### app.json (needs migration)
```
|HeroSection → track (navigation/stepper area)
|TrackLesson → writing (main content container)
|SharedJournalSection → focus (prompts + inputs)
```

**Migration steps:**
1. Remove `layout` property from all sections
2. Add `role` property with appropriate role

---

### C) 6 JOURNAL TEMPLATE DESIGNS

I recommend **consolidating to 6 templates** from current 8:

#### 1. focus-writing (keep as-is)
**Use case:** Distraction-free writing, narrow column

```json
{
  "id": "focus-writing",
  "experience": "journal",
  "visualPreset": "compact",
  "spacingScale": "default",
  "cardPreset": "borderless",
  "containerWidth": "narrow",
  "layoutVariants": {
    "writing": { "layoutId": "content-narrow", "params": { "gap": "0.5rem", "padding": "2rem 1rem", "maxWidth": "65ch" } },
    "focus": { "layoutId": "content-narrow", "params": { "gap": "0.75rem", "padding": "1.5rem 1rem" } },
    "reflect": { "layoutId": "content-narrow", "params": { "gap": "1rem", "padding": "1.5rem 1rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "0.5rem", "padding": "1rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "0.5rem", "padding": "1rem" } }
  }
}
```

#### 2. guided-reflection (keep, expand roles)
**Use case:** Structured prompts with clear hierarchy

```json
{
  "id": "guided-reflection",
  "experience": "journal",
  "visualPreset": "default",
  "spacingScale": "default",
  "cardPreset": "soft",
  "containerWidth": "contained",
  "layoutVariants": {
    "writing": { "layoutId": "content-stack", "params": { "gap": "1.5rem", "padding": "2rem 1.5rem" } },
    "focus": { "layoutId": "content-stack", "params": { "gap": "1.25rem", "padding": "1.5rem" } },
    "reflect": { "layoutId": "content-stack", "params": { "gap": "1rem", "padding": "1.5rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "0.75rem", "padding": "1rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "1rem", "padding": "1rem", "wrap": "wrap" } }
  }
}
```

#### 3. contemplative-space (keep, expand roles)
**Use case:** Generous whitespace for deep reflection

```json
{
  "id": "contemplative-space",
  "experience": "journal",
  "visualPreset": "spacious",
  "spacingScale": "luxury",
  "cardPreset": "elevated",
  "containerWidth": "narrow",
  "layoutVariants": {
    "writing": { "layoutId": "content-narrow", "params": { "gap": "3rem", "padding": "4rem 2rem" } },
    "focus": { "layoutId": "content-narrow", "params": { "gap": "2.5rem", "padding": "3rem 2rem" } },
    "reflect": { "layoutId": "content-narrow", "params": { "gap": "2rem", "padding": "3rem 2rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "1.5rem", "padding": "2rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "2rem", "padding": "2rem" } }
  }
}
```

#### 4. structured-journal (keep, expand roles)
**Use case:** Dense, efficient, list-like

```json
{
  "id": "structured-journal",
  "experience": "journal",
  "visualPreset": "compact",
  "spacingScale": "saas",
  "cardPreset": "bordered",
  "containerWidth": "contained",
  "layoutVariants": {
    "writing": { "layoutId": "content-stack", "params": { "gap": "1rem", "padding": "1.5rem" } },
    "focus": { "layoutId": "content-stack", "params": { "gap": "0.75rem", "padding": "1rem" } },
    "reflect": { "layoutId": "content-stack", "params": { "gap": "0.75rem", "padding": "1rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "0.5rem", "padding": "0.75rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "0.5rem", "padding": "0.75rem", "justify": "flex-start" } }
  }
}
```

#### 5. minimal-distraction (merge minimal-distraction + evening-journal)
**Use case:** Minimalist, calm, for evening or focused sessions

```json
{
  "id": "minimal-distraction",
  "experience": "journal",
  "visualPreset": "compact",
  "spacingScale": "default",
  "cardPreset": "borderless",
  "containerWidth": "narrow",
  "layoutVariants": {
    "writing": { "layoutId": "content-narrow", "params": { "gap": "0.25rem", "padding": "1rem 0.5rem", "maxWidth": "60ch" } },
    "focus": { "layoutId": "content-narrow", "params": { "gap": "0.5rem", "padding": "0.75rem 0.5rem" } },
    "reflect": { "layoutId": "content-narrow", "params": { "gap": "1rem", "padding": "1rem 0.5rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "0.25rem", "padding": "0.5rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "0.25rem", "padding": "0.5rem" } }
  }
}
```

#### 6. morning-pages (merge morning-pages + course-reflection)
**Use case:** Expansive, generous, for freeform morning writing

```json
{
  "id": "morning-pages",
  "experience": "journal",
  "visualPreset": "spacious",
  "spacingScale": "default",
  "cardPreset": "soft",
  "containerWidth": "contained",
  "layoutVariants": {
    "writing": { "layoutId": "content-stack", "params": { "gap": "2.5rem", "padding": "3rem 2rem" } },
    "focus": { "layoutId": "content-stack", "params": { "gap": "2rem", "padding": "2rem 1.5rem" } },
    "reflect": { "layoutId": "content-stack", "params": { "gap": "1.5rem", "padding": "2rem 1.5rem" } },
    "action": { "layoutId": "content-stack", "params": { "gap": "1rem", "padding": "1.5rem" } },
    "track": { "layoutId": "content-stack", "params": { "gap": "1.5rem", "padding": "1.5rem", "wrap": "wrap" } }
  }
}
```

---

### D) layoutVariants STRUCTURE (Confirmed Working)

```json
"layoutVariants": {
  "writing": {
    "layoutId": "content-narrow",
    "containerWidth": "narrow",
    "params": {
      "gap": "0.5rem",
      "padding": "2rem 1rem",
      "maxWidth": "65ch"
    }
  }
}
```

**Already supported by resolver (lines 88-119 in section-layout-id.ts)**

---

## STEP 3 — ENGINE IMPACT CHECK

### Can this be done with JSON only?

**Answer:** ⚠️ **MOSTLY, BUT NOT FOR app.json**

1. **journal_replicate.json:** ✅ Already working, no changes needed
2. **app.json:** ❌ Requires JSON changes (remove `layout`, add `role`)
3. **template-profiles.json:** ✅ Expand layoutVariants to include all 5 roles

### Do we need to modify getSectionLayoutId?

**Answer:** ❌ **NO MODIFICATIONS NEEDED**

The resolver already supports:
```typescript
templateProfile?.layoutVariants?.[nodeRole]
```

This was added in a previous implementation and is **production-ready**.

### Resolution Order (Confirmed Correct)

```
1. override (store)
2. explicit node.layout
3. templateProfile.layoutVariants[node.role]  ← JOURNAL ROLES
4. template role (legacy)
5. template default
6. fallback: "content-stack"
```

**Status:** ✅ **NO ENGINE CHANGES REQUIRED**

---

## STEP 4 — TEMPLATE CONSOLIDATION PLAN

### Classification

#### WEBSITE TEMPLATES (keep all 23)
**Purpose:** Marketing sites, landing pages, portfolios
**Roles:** hero, features, content, gallery, testimonials, pricing, cta, footer, products, nav, header, faq
**Action:** Keep unchanged

#### APP TEMPLATE (keep 1)
**Purpose:** HiClarify media player
**Roles:** Mixed (nav, header, content, features, actions, cta)
**Action:** Keep unchanged

#### JOURNAL TEMPLATES (consolidate 8 → 6)

**Keep (with role expansion):**
1. focus-writing (narrow, minimal)
2. guided-reflection (structured, cards)
3. contemplative-space (spacious, luxurious)
4. structured-journal (compact, efficient)

**Merge:**
5. minimal-distraction ← merge with evening-journal (both minimal/calm)
6. morning-pages ← merge with course-reflection (both expansive)

**Rationale:**
- evening-journal and minimal-distraction have nearly identical params
- morning-pages and course-reflection both use spacious editorial style
- Reduces maintenance burden while preserving all use cases

---

## STEP 5 — EXECUTION PLAN

### Files to Edit

```
✅ = JSON only
⚠️ = Minor change
❌ = Complex change
```

#### 1. Journal Screen JSON Files

**A) app.json** (⚠️ manual migration required)
```json
// BEFORE:
{
  "id": "|HeroSection",
  "type": "Section",
  "layout": "hero-centered",  // REMOVE THIS
  "children": []
}

// AFTER:
{
  "id": "|HeroSection",
  "type": "Section",
  "role": "track",  // ADD THIS
  "children": []
}
```

**Changes:**
- Remove `"layout": "hero-centered"` from `|HeroSection`
- Add `"role": "track"` to `|HeroSection`
- Remove `"layout": "content-stack"` from `|TrackLesson`
- Add `"role": "writing"` to `|TrackLesson`
- Remove `"layout": "content-narrow"` from `|SharedJournalSection`
- Add `"role": "focus"` to `|SharedJournalSection`

**File:** `src/01_App/apps-json/apps/journal_track/app.json`

**B) journal_replicate.json** (✅ no changes needed)

#### 2. Template Profiles

**A) Expand all 8 journal templates** (✅ JSON only)

Add `reflect` and `action` roles to layoutVariants for all journal templates:

**File:** `src/04_Presentation/lib-layout/template-profiles.json`

**Template IDs to update:**
- focus-writing (line 2024)
- guided-reflection (line 2083)
- contemplative-space (line 2142)
- structured-journal (line 2200)
- minimal-distraction (line 2258)
- evening-journal (line 2317)
- morning-pages (line 2375)
- course-reflection (line 2434)

**JSON Snippet to add to each template's layoutVariants:**

```json
"layoutVariants": {
  "writing": { /* existing */ },
  "focus": { /* existing */ },
  "track": { /* existing */ },
  
  // ADD THESE:
  "reflect": {
    "layoutId": "content-stack",
    "params": {
      "gap": "1rem",
      "padding": "1.5rem"
    }
  },
  "action": {
    "layoutId": "content-stack",
    "params": {
      "gap": "0.5rem",
      "padding": "1rem"
    }
  }
}
```

**B) Optional: Merge templates** (can defer)

If consolidating from 8 → 6:
- Merge evening-journal into minimal-distraction
- Merge course-reflection into morning-pages
- Update any references in app configs

#### 3. Journal Roles Config

**A) Update journal-roles.json** (✅ JSON only)

**File:** `src/04_Presentation/lib-layout/journal-roles.json`

Simplify to 5 core roles:

```json
{
  "criticalRoles": ["writing", "focus"],
  "optionalRoles": ["reflect", "action", "track"],
  "roleDescriptions": {
    "writing": "Primary journaling content area - where users write their entries",
    "focus": "Focused input and interaction area - for prompts, forms, and inputs",
    "reflect": "Reflection and review area - for viewing past entries",
    "action": "Action buttons and controls - save, submit, navigation",
    "track": "Progress tracking and navigation - stepper, tabs"
  },
  "roleCompatibility": {
    "writing": ["content-narrow", "content-stack"],
    "focus": ["content-stack", "content-narrow"],
    "reflect": ["content-stack", "content-narrow"],
    "action": ["content-stack"],
    "track": ["content-stack"]
  }
}
```

#### 4. TSX Changes

**Answer:** ❌ **ZERO TSX CHANGES REQUIRED**

The resolver already supports `layoutVariants`:
- `section-layout-id.ts` (lines 88-119) ✅ Already implemented
- `json-renderer.tsx` calls `getSectionLayoutId` with `templateProfile` ✅ Already passing data

**No code changes needed.**

---

## IMPLEMENTATION SUMMARY

### MINIMAL VIABLE MIGRATION

**Phase 1: app.json role migration (required for templates to work)**

```
File: src/01_App/apps-json/apps/journal_track/app.json

Changes:
1. |HeroSection: remove "layout", add "role": "track"
2. |TrackLesson: remove "layout", add "role": "writing"
3. |SharedJournalSection: remove "layout", add "role": "focus"
```

**Phase 2: Template role expansion (adds reflect + action support)**

```
File: src/04_Presentation/lib-layout/template-profiles.json

For each of 8 journal templates, add to layoutVariants:
  "reflect": { "layoutId": "content-stack", "params": {...} }
  "action": { "layoutId": "content-stack", "params": {...} }
```

**Phase 3: Optional consolidation**

```
File: src/04_Presentation/lib-layout/template-profiles.json

- Merge evening-journal → minimal-distraction
- Merge course-reflection → morning-pages
```

---

## VALIDATION CHECKLIST

After migration:

✅ journal_replicate.json renders with template control
✅ app.json renders with template control
✅ Switching templates reshapes sections based on roles
✅ All 5 roles (writing, focus, reflect, action, track) have layout mappings
✅ No explicit layouts in journal JSON files
✅ No hardcoded defaults
✅ Resolution trace shows "template layoutVariants" in decision chain

---

## APPENDICES

### A) Current Template → Role Matrix

| Template | writing | focus | track | reflect | action |
|----------|---------|-------|-------|---------|--------|
| focus-writing | ✅ | ✅ | ✅ | ❌ | ❌ |
| guided-reflection | ✅ | ✅ | ✅ | ❌ | ❌ |
| contemplative-space | ✅ | ✅ | ✅ | ❌ | ❌ |
| structured-journal | ✅ | ✅ | ✅ | ❌ | ❌ |
| minimal-distraction | ✅ | ✅ | ✅ | ❌ | ❌ |
| evening-journal | ✅ | ✅ | ✅ | ❌ | ❌ |
| morning-pages | ✅ | ✅ | ✅ | ❌ | ❌ |
| course-reflection | ✅ | ✅ | ✅ | ❌ | ❌ |

**After Phase 2:** All templates will support all 5 roles.

### B) Resolution Priority Examples

**Scenario 1: Clean journal section**
```json
{
  "id": "mySection",
  "role": "writing"
}
```
**Resolution:** `template layoutVariants["writing"]` → "content-narrow"

**Scenario 2: Override in effect**
```json
{
  "id": "mySection",
  "role": "writing"
}
// + sectionLayoutPresetOverrides = { "mySection": "hero-centered" }
```
**Resolution:** `override` → "hero-centered"

**Scenario 3: Explicit layout (legacy)**
```json
{
  "id": "mySection",
  "role": "writing",
  "layout": "content-stack"
}
```
**Resolution:** `explicit node.layout` → "content-stack"

### C) Contract Safety

**Existing contracts preserved:**
- ✅ `getSectionLayoutId` signature unchanged
- ✅ `GetSectionLayoutIdArgs` unchanged
- ✅ `GetSectionLayoutIdResult` unchanged
- ✅ Resolution order unchanged
- ✅ Fallback behavior unchanged

**New capabilities added:**
- ✅ `layoutVariants` object in templateProfile
- ✅ Role-based layout mapping
- ✅ Per-role params (gap, padding, maxWidth)

**Backward compatibility:**
- ✅ Old explicit layouts still work
- ✅ Marketing templates unaffected
- ✅ Legacy template role system still works

---

## CONCLUSION

**System Status:** ✅ **ARCHITECTED AND READY**

The journal role expansion system is **already implemented** in the resolver. The migration is **JSON-only** and requires:

1. **app.json role migration** (remove explicit layouts, add roles)
2. **Template role expansion** (add reflect + action to layoutVariants)
3. **Optional template consolidation** (8 → 6 templates)

**Zero engine changes required.**
**Zero hardcoding.**
**Zero defaults.**
**Contract safe.**

Templates will immediately reshape journal screens when explicit layouts are removed.
