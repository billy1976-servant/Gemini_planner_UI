# JOURNAL ROLE SYSTEM ARCHITECTURE

**Visual guide to how journal templates reshape screens**

---

## SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     JOURNAL SCREEN JSON                      │
│  (app.json / journal_replicate.json)                        │
├─────────────────────────────────────────────────────────────┤
│  {                                                           │
│    "id": "mySection",                                       │
│    "type": "section",                                       │
│    "role": "writing"  ← JOURNAL ROLE                       │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYOUT RESOLVER (section-layout-id.ts)         │
│  Authority ladder:                                          │
│  1. override (store)                                        │
│  2. explicit node.layout                                    │
│  3. template layoutVariants[node.role]  ← JOURNAL SYSTEM   │
│  4. template role (legacy)                                  │
│  5. template default                                        │
│  6. fallback: "content-stack"                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           TEMPLATE PROFILE (template-profiles.json)         │
│  {                                                           │
│    "id": "focus-writing",                                   │
│    "experience": "journal",                                 │
│    "layoutVariants": {                                      │
│      "writing": { "layoutId": "content-narrow", ... },     │
│      "focus": { "layoutId": "content-stack", ... },        │
│      "reflect": { "layoutId": "content-narrow", ... }      │
│    }                                                         │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        LAYOUT DEFINITION (layout-definitions.json)          │
│  {                                                           │
│    "componentLayouts": {                                    │
│      "content-narrow": {                                    │
│        "type": "column",                                    │
│        "params": { "gap": "...", "padding": "..." }        │
│      }                                                       │
│    }                                                         │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  RENDERED UI    │
            └─────────────────┘
```

---

## DATA FLOW EXAMPLE

### Scenario: User switches from "focus-writing" to "contemplative-space"

#### INPUT: Section with role
```json
{
  "id": "trackJournal",
  "type": "section",
  "role": "writing"
}
```

#### TEMPLATE: focus-writing
```json
{
  "id": "focus-writing",
  "layoutVariants": {
    "writing": {
      "layoutId": "content-narrow",
      "params": {
        "gap": "0.5rem",
        "padding": "2rem 1rem",
        "maxWidth": "65ch"
      }
    }
  }
}
```

**Result:** Narrow column, tight gap, focused writing experience

---

#### TEMPLATE: contemplative-space
```json
{
  "id": "contemplative-space",
  "layoutVariants": {
    "writing": {
      "layoutId": "content-narrow",
      "params": {
        "gap": "3rem",
        "padding": "4rem 2rem"
      }
    }
  }
}
```

**Result:** Same narrow column, but HUGE gaps and padding → spacious, contemplative

---

## ROLE MAPPING MATRIX

| Journal Role | Purpose | Typical Layouts | Used By |
|--------------|---------|----------------|---------|
| **writing** | Primary content area | content-narrow, content-stack | Main journal entry section |
| **focus** | Prompts + inputs | content-stack, content-narrow | Interactive form areas |
| **reflect** | Past entries view | content-stack, content-narrow | History/review sections |
| **action** | Buttons, controls | content-stack | Save buttons, navigation |
| **track** | Progress UI | content-stack | Stepper, tabs |

---

## TEMPLATE COMPARISON

### Template: focus-writing (minimal, distraction-free)

```
┌────────────────────────────────────────────┐
│                                            │
│   [writing: 65ch width, tiny gaps]        │
│   ┌──────────────────────────────────┐    │
│   │ Entry text here...               │    │
│   │                                  │    │
│   └──────────────────────────────────┘    │
│                                            │
│   [focus: tight spacing]                  │
│   ┌──────────────────────────────────┐    │
│   │ Prompt                           │    │
│   │ Input field                      │    │
│   └──────────────────────────────────┘    │
│                                            │
└────────────────────────────────────────────┘
```

### Template: contemplative-space (generous whitespace)

```
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│   [writing: 65ch width, huge gaps]        │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │                                  │    │
│   │ Entry text here...               │    │
│   │                                  │    │
│   └──────────────────────────────────┘    │
│                                            │
│                                            │
│                                            │
│   [focus: spacious layout]                │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │                                  │    │
│   │ Prompt                           │    │
│   │                                  │    │
│   │ Input field                      │    │
│   │                                  │    │
│   └──────────────────────────────────┘    │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

### Template: structured-journal (compact, efficient)

```
┌────────────────────────────────────────────┐
│ [writing: tight, contained]               │
│ ┌──────────────────────────────────┐      │
│ │ Entry text here...               │      │
│ └──────────────────────────────────┘      │
│                                            │
│ [focus: minimal spacing]                  │
│ ┌──────────────────────────────────┐      │
│ │ Prompt                           │      │
│ │ Input field                      │      │
│ └──────────────────────────────────┘      │
│                                            │
│ [action: inline]                          │
│ [Save] [Cancel]                           │
└────────────────────────────────────────────┘
```

---

## RESOLUTION PRIORITY EXAMPLES

### Example 1: Clean section (template controls)

```json
{
  "id": "mySection",
  "role": "writing"
}
```

**Resolution path:**
1. ❌ No override
2. ❌ No explicit layout
3. ✅ **Template layoutVariants["writing"]** → "content-narrow"
4. (skip remaining)

**Result:** Template reshapes section

---

### Example 2: Explicit layout (legacy)

```json
{
  "id": "mySection",
  "role": "writing",
  "layout": "hero-centered"
}
```

**Resolution path:**
1. ❌ No override
2. ✅ **Explicit node.layout** → "hero-centered"
3. (skip remaining)

**Result:** Section ignores template, uses explicit layout

---

### Example 3: Override in store

```json
{
  "id": "mySection",
  "role": "writing"
}
// + sectionLayoutPresetOverrides = { "mySection": "content-stack" }
```

**Resolution path:**
1. ✅ **Override** → "content-stack"
2. (skip remaining)

**Result:** Store override wins

---

## TEMPLATE VARIANT PARAMS

Templates can customize more than just layoutId:

```json
"layoutVariants": {
  "writing": {
    "layoutId": "content-narrow",           // Which layout engine
    "containerWidth": "narrow",             // Container constraint
    "params": {
      "gap": "0.5rem",                     // Spacing between items
      "padding": "2rem 1rem",              // Internal padding
      "maxWidth": "65ch",                  // Typography constraint
      "align": "stretch",                  // Flex alignment
      "justify": "center"                  // Flex justification
    }
  }
}
```

**All of these get passed to the layout engine!**

---

## FILE DEPENDENCY GRAPH

```
journal_replicate.json
app.json
    │
    ├─ role: "writing"
    ├─ role: "focus"
    └─ role: "track"
            ↓
    section-layout-id.ts (resolver)
            ↓
    template-profiles.json
            ↓
    layoutVariants["writing"] → { layoutId, params }
            ↓
    layout-definitions.json
            ↓
    componentLayouts["content-narrow"] → { type, params }
            ↓
    json-renderer.tsx
            ↓
    RENDERED UI
```

---

## COMPARISON: BEFORE vs AFTER

### BEFORE (app.json with explicit layouts)

```json
{
  "id": "|SharedJournalSection",
  "type": "Section",
  "layout": "content-narrow"  ← HARDCODED
}
```

**Problem:**
- ❌ Template change does nothing
- ❌ Layout is frozen
- ❌ No role-based customization

---

### AFTER (app.json with roles)

```json
{
  "id": "|SharedJournalSection",
  "type": "Section",
  "role": "focus"  ← SEMANTIC
}
```

**Benefits:**
- ✅ Template change reshapes section
- ✅ Layout adapts to template's vision
- ✅ Role-based customization

---

## ROLE PHILOSOPHY

### Marketing Roles (websites)
**Semantic:** hero, features, testimonials, pricing, cta
**Purpose:** Define content type (what it is)
**Layout:** Varies by template (grid vs column vs row)

### Journal Roles (apps)
**Semantic:** writing, focus, reflect, action, track
**Purpose:** Define interaction mode (how users engage)
**Layout:** Varies by template (spacious vs compact vs narrow)

**Key insight:** Roles describe PURPOSE, not STRUCTURE

---

## TEMPLATE PERSONALITY MATRIX

| Template | Spacing | Width | Padding | Use Case |
|----------|---------|-------|---------|----------|
| focus-writing | Tight | Narrow | Minimal | Flow state writing |
| guided-reflection | Moderate | Contained | Balanced | Structured prompts |
| contemplative-space | Generous | Narrow | Luxurious | Deep reflection |
| structured-journal | Dense | Contained | Compact | Efficient logging |
| minimal-distraction | Tiny | Narrow | Minimal | Pure minimalism |
| morning-pages | Spacious | Contained | Generous | Freeform exploration |

---

## TESTING SCENARIOS

### Scenario 1: Template reshaping works

**Setup:**
1. Load journal_replicate.json
2. Note current layout of trackJournal section
3. Switch template from "focus-writing" to "contemplative-space"

**Expected:**
- trackJournal section gets wider padding
- Gap between elements increases
- Visual preset changes (colors, shadows)

**Trace verification:**
```
decision: "template layoutVariants"
layoutId: "content-narrow"
variantParams: { gap: "3rem", padding: "4rem 2rem" }
```

---

### Scenario 2: Override takes precedence

**Setup:**
1. Load journal_replicate.json with template "focus-writing"
2. Set override: `{ "trackJournal": "hero-centered" }`

**Expected:**
- trackJournal ignores template
- Uses hero-centered layout
- Trace shows `decision: "override"`

---

### Scenario 3: Explicit layout blocks template

**Setup:**
1. Load app.json (has explicit layouts)
2. Switch template

**Expected:**
- No visual change
- Trace shows `decision: "explicit node.layout"`

**Fix:**
- Remove `"layout"` properties
- Add `"role"` properties
- Now template controls layout

---

## MIGRATION IMPACT MAP

### Files Modified: 3

```
✅ app.json                        (remove layouts, add roles)
✅ template-profiles.json          (expand layoutVariants)
✅ journal-roles.json              (simplify to 5 roles)
```

### Files Unchanged: All engine code

```
✅ section-layout-id.ts            (already supports layoutVariants)
✅ json-renderer.tsx               (already passes templateProfile)
✅ layout-definitions.json         (no changes needed)
```

### Risk Level: LOW

- ✅ Additive changes only (no breaking changes)
- ✅ Backward compatible (explicit layouts still work)
- ✅ Contract safe (no API changes)
- ✅ Already implemented in resolver

---

## SUCCESS METRICS

After migration, you should see:

1. **Template switching reshapes journal screens**
   - Change template → spacing/padding/gaps change
   - Role-based layout mapping visible in trace

2. **All 5 roles resolve correctly**
   - writing → template-defined layout
   - focus → template-defined layout
   - reflect → template-defined layout
   - action → template-defined layout
   - track → template-defined layout

3. **No fallbacks to "content-stack"**
   - Every journal role has explicit mapping
   - Trace shows "template layoutVariants" not "fallback"

4. **Override still works**
   - Store override beats template
   - Explicit layout beats template

---

## ARCHITECTURE BENEFITS

### 1. Separation of Concerns
- **Screen JSON:** Defines structure + roles (semantic)
- **Templates:** Define visual personality (aesthetic)
- **Layouts:** Define spatial arrangement (structural)

### 2. Template Flexibility
- One screen JSON works with ANY template
- Templates can interpret roles differently
- No hardcoded layouts in app code

### 3. User Personalization
- User picks template → entire journal reshapes
- Roles ensure consistent semantics
- Visual experience adapts to preference

### 4. Designer Control
- Designers create templates with unique personalities
- Roles ensure functional sections stay functional
- No code changes needed

---

## CONCLUSION

The journal role system transforms templates from decorative to functional:

**Before:**
- Templates only change colors/fonts
- Layout hardcoded in screen JSON
- One size fits all

**After:**
- Templates reshape entire screen
- Layout controlled by template personality
- Roles ensure semantic consistency

**Implementation:** JSON-only, zero code changes, contract safe.
