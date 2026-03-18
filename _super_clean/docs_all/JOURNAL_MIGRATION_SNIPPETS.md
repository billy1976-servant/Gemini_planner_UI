# JOURNAL ROLE MIGRATION — READY-TO-USE JSON SNIPPETS

**Quick reference for implementing journal role expansion**

---

## SNIPPET 1: app.json Migration

**File:** `src/01_App/apps-json/apps/journal_track/app.json`

### BEFORE (lines 9-11)
```json
{
  "id": "|HeroSection",
  "type": "Section",
  "layout": "hero-centered",
  "children": [],
  "content": {
    "title": "TRACK Journal"
  }
}
```

### AFTER
```json
{
  "id": "|HeroSection",
  "type": "Section",
  "role": "track",
  "children": [],
  "content": {
    "title": "TRACK Journal"
  }
}
```

---

### BEFORE (lines 18-22)
```json
{
  "id": "|TrackLesson",
  "type": "Section",
  "layout": "content-stack",
  "content": {},
  "children": [ /* ... */ ]
}
```

### AFTER
```json
{
  "id": "|TrackLesson",
  "type": "Section",
  "role": "writing",
  "content": {},
  "children": [ /* ... */ ]
}
```

---

### BEFORE (lines 96-100)
```json
{
  "id": "|SharedJournalSection",
  "type": "Section",
  "layout": "content-narrow",
  "content": {},
  "children": [ /* ... */ ]
}
```

### AFTER
```json
{
  "id": "|SharedJournalSection",
  "type": "Section",
  "role": "focus",
  "content": {},
  "children": [ /* ... */ ]
}
```

---

## SNIPPET 2: Template Role Expansion

**File:** `src/04_Presentation/lib-layout/template-profiles.json`

### Template: focus-writing (line 2024)

**ADD to existing layoutVariants:**

```json
{
  "id": "focus-writing",
  "label": "Focus Writing",
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
    },
    
    "reflect": {
      "layoutId": "content-narrow",
      "containerWidth": "narrow",
      "params": {
        "gap": "1rem",
        "padding": "1.5rem 1rem"
      }
    },
    "action": {
      "layoutId": "content-stack",
      "containerWidth": "narrow",
      "params": {
        "gap": "0.5rem",
        "padding": "1rem"
      }
    }
  },
  "sections": {
    "writing": {
      "type": "column",
      "params": {
        "gap": "0.5rem",
        "align": "stretch"
      }
    },
    "focus": {
      "type": "column",
      "params": {
        "gap": "0.75rem",
        "align": "stretch"
      }
    },
    "track": {
      "type": "row",
      "params": {
        "gap": "0.5rem",
        "justify": "center"
      }
    }
  }
}
```

---

### Template: guided-reflection (line 2083)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "1rem",
    "padding": "1.5rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "0.75rem",
    "padding": "1rem"
  }
}
```

---

### Template: contemplative-space (line 2142)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-narrow",
  "containerWidth": "narrow",
  "params": {
    "gap": "2rem",
    "padding": "3rem 2rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "narrow",
  "params": {
    "gap": "1.5rem",
    "padding": "2rem"
  }
}
```

---

### Template: structured-journal (line 2200)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "0.75rem",
    "padding": "1rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "0.5rem",
    "padding": "0.75rem"
  }
}
```

---

### Template: minimal-distraction (line 2258)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-narrow",
  "containerWidth": "narrow",
  "params": {
    "gap": "0.5rem",
    "padding": "1rem 0.5rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "narrow",
  "params": {
    "gap": "0.25rem",
    "padding": "0.5rem"
  }
}
```

---

### Template: evening-journal (line 2317)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-narrow",
  "containerWidth": "narrow",
  "params": {
    "gap": "1.5rem",
    "padding": "2rem 1.5rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "narrow",
  "params": {
    "gap": "1rem",
    "padding": "1.5rem"
  }
}
```

---

### Template: morning-pages (line 2375)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "1.5rem",
    "padding": "2rem 1.5rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "contained",
  "params": {
    "gap": "1rem",
    "padding": "1.5rem"
  }
}
```

---

### Template: course-reflection (line 2434)

**ADD to existing layoutVariants:**

```json
"reflect": {
  "layoutId": "content-narrow",
  "containerWidth": "narrow",
  "params": {
    "gap": "1.5rem",
    "padding": "2rem 1.5rem"
  }
},
"action": {
  "layoutId": "content-stack",
  "containerWidth": "narrow",
  "params": {
    "gap": "1rem",
    "padding": "1.5rem"
  }
}
```

---

## SNIPPET 3: journal-roles.json Update

**File:** `src/04_Presentation/lib-layout/journal-roles.json`

**REPLACE entire file:**

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

---

## TESTING CHECKLIST

After applying snippets:

### 1. Test app.json with different templates

**Action:** Switch template in app metadata/config
**Expected:** Sections reshape according to template's layoutVariants

### 2. Validate resolution trace

**Action:** Open DevTools, check console for `[getSectionLayoutId]` traces
**Expected:** See `ruleApplied: "template layoutVariants"` for journal sections

### 3. Test role coverage

**Action:** Add sections with each of 5 roles
**Expected:** All roles resolve to valid layouts (no fallback to "content-stack")

### 4. Verify override still works

**Action:** Set override in section-layout-preset store
**Expected:** Override takes precedence over template layoutVariants

### 5. Backward compatibility

**Action:** Load journal_replicate.json
**Expected:** Still works (already using roles)

---

## MIGRATION ORDER

1. **First:** Update app.json (remove layouts, add roles)
2. **Second:** Expand all 8 templates with reflect + action roles
3. **Third:** Update journal-roles.json (simplify to 5 roles)
4. **Test:** Load journal app, switch templates, verify reshaping
5. **Optional:** Consolidate templates (8 → 6)

---

## ROLLBACK PLAN

If issues arise:

1. **Revert app.json:** Re-add `layout` properties, remove `role`
2. **Keep template changes:** They don't break anything (unused until roles are present)
3. **Debug:** Check resolver trace to see which rule is being applied

---

## COMMON ISSUES

### Issue: Sections still use explicit layout

**Symptom:** Template switch doesn't change layout
**Cause:** Section has `"layout"` property
**Fix:** Remove `"layout"` from section JSON

### Issue: Fallback to "content-stack"

**Symptom:** Trace shows `ruleApplied: "fallback"`
**Cause:** Role not in template's layoutVariants
**Fix:** Add role to template's layoutVariants object

### Issue: Template not found

**Symptom:** Error loading template
**Cause:** Template ID typo or missing from profiles
**Fix:** Check template ID matches exactly in template-profiles.json

---

## QUICK WIN: Test with journal_replicate.json

**This file already uses roles!**

1. Open journal_replicate.json in app
2. Switch template from "focus-writing" to "contemplative-space"
3. Observe:
   - `trackJournal` (role: "writing") gets spacious padding
   - `sharedJournalSection` (role: "focus") gets wider gaps

**This proves the system works without any code changes.**
