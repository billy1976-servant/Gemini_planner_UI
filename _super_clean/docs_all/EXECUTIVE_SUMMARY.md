# EXECUTIVE SUMMARY — JOURNAL ROLE EXPANSION AUDIT

**Status:** ✅ **SYSTEM READY — JSON-ONLY MIGRATION**

---

## QUICK FACTS

- **Goal:** Make templates reshape journal screens using journal roles
- **Current state:** System already implemented, partially deployed
- **Required changes:** JSON-only (3 files)
- **Code changes:** Zero
- **Risk level:** Low (additive, backward compatible)
- **Estimated effort:** 2-4 hours

---

## KEY FINDINGS

### ✅ WHAT'S WORKING

1. **Resolver already supports journal roles**
   - `section-layout-id.ts` checks `templateProfile.layoutVariants[node.role]`
   - Resolution order: override → explicit layout → **layoutVariants** → role → default → fallback
   - Lines 88-119 implement journal role support

2. **8 journal templates already configured**
   - All have `experience: "journal"`
   - All have `layoutVariants` object
   - Currently support 3 roles: writing, focus, track

3. **journal_replicate.json already uses roles**
   - trackJournal → role: "writing"
   - sharedJournalSection → role: "focus"
   - Templates successfully reshape this screen

4. **journal-roles.json defines complete architecture**
   - 8 roles defined with descriptions
   - Layout compatibility matrix exists
   - Critical vs optional roles identified

### ⚠️ WHAT'S BROKEN

1. **app.json bypasses template system**
   - All sections have explicit `layout` property
   - No `role` properties defined
   - Templates cannot reshape this screen

2. **Incomplete role coverage in templates**
   - Templates support: writing, focus, track (3 roles)
   - Defined but unsupported: reflect, action, prompt, input, viewer (5 roles)
   - Need to add reflect + action to all templates

3. **Role redundancy**
   - 8 roles defined, but only 5 are layout-semantic
   - prompt/input/viewer are UI variants, not layout variants
   - Should consolidate to 5 core roles

---

## RECOMMENDED MIGRATION

### Phase 1: app.json Role Migration (REQUIRED)

**File:** `src/01_App/apps-json/apps/journal_track/app.json`

**Changes:**
```diff
{
  "id": "|HeroSection",
- "layout": "hero-centered",
+ "role": "track",
}

{
  "id": "|TrackLesson",
- "layout": "content-stack",
+ "role": "writing",
}

{
  "id": "|SharedJournalSection",
- "layout": "content-narrow",
+ "role": "focus",
}
```

**Impact:** Enables templates to reshape app.json screens

---

### Phase 2: Template Role Expansion (RECOMMENDED)

**File:** `src/04_Presentation/lib-layout/template-profiles.json`

**Changes:** Add `reflect` and `action` to all 8 journal templates

**Example snippet:**
```json
"layoutVariants": {
  "writing": { /* existing */ },
  "focus": { /* existing */ },
  "track": { /* existing */ },
  
  "reflect": {
    "layoutId": "content-stack",
    "params": { "gap": "1rem", "padding": "1.5rem" }
  },
  "action": {
    "layoutId": "content-stack",
    "params": { "gap": "0.5rem", "padding": "1rem" }
  }
}
```

**Impact:** Full role coverage for all journal sections

---

### Phase 3: Role Consolidation (OPTIONAL)

**File:** `src/04_Presentation/lib-layout/journal-roles.json`

**Changes:** Simplify from 8 roles to 5 core roles

```json
{
  "criticalRoles": ["writing", "focus"],
  "optionalRoles": ["reflect", "action", "track"]
}
```

**Rationale:**
- Collapse prompt/input/viewer into focus (UI variants, not layout variants)
- Focus on semantic layout roles only

**Impact:** Cleaner architecture, easier maintenance

---

## IMPLEMENTATION CHECKLIST

```
□ Phase 1: Migrate app.json
  □ Remove "layout" from |HeroSection
  □ Add "role": "track" to |HeroSection
  □ Remove "layout" from |TrackLesson
  □ Add "role": "writing" to |TrackLesson
  □ Remove "layout" from |SharedJournalSection
  □ Add "role": "focus" to |SharedJournalSection

□ Phase 2: Expand template roles
  □ focus-writing: add reflect + action
  □ guided-reflection: add reflect + action
  □ contemplative-space: add reflect + action
  □ structured-journal: add reflect + action
  □ minimal-distraction: add reflect + action
  □ evening-journal: add reflect + action
  □ morning-pages: add reflect + action
  □ course-reflection: add reflect + action

□ Phase 3: Update journal-roles.json
  □ Simplify to 5 roles
  □ Update descriptions
  □ Update compatibility matrix

□ Testing
  □ Load app.json with different templates
  □ Verify sections reshape
  □ Check resolver trace shows "template layoutVariants"
  □ Test override still works
  □ Verify journal_replicate.json still works
```

---

## TECHNICAL DETAILS

### Resolution Order (Confirmed Working)

```
1. override (sectionLayoutPresetOverrides)
2. explicit node.layout
3. templateProfile.layoutVariants[node.role]  ← JOURNAL SYSTEM
4. template role (legacy getPageLayoutId)
5. template default
6. fallback: "content-stack"
```

### Files Requiring Changes

| File | Type | Changes | Risk |
|------|------|---------|------|
| app.json | JSON | Remove layouts, add roles | Low |
| template-profiles.json | JSON | Expand layoutVariants | Low |
| journal-roles.json | JSON | Simplify role set | Low |

### Files NOT Requiring Changes

| File | Reason |
|------|--------|
| section-layout-id.ts | Already supports layoutVariants |
| json-renderer.tsx | Already passes templateProfile |
| layout-definitions.json | No new layout IDs needed |
| All other engine code | Contract safe |

---

## BENEFITS

### 1. Templates Actually Reshape Screens
- User switches template → entire journal UI transforms
- Spacing, padding, gaps all template-controlled
- No hardcoded layouts in screen JSON

### 2. Designer Empowerment
- Designers create templates without code changes
- Each template has unique personality
- Roles ensure functional consistency

### 3. User Personalization
- Users pick template matching their preference
- One screen JSON works with all templates
- Visual experience adapts seamlessly

### 4. Clean Architecture
- Separation of concerns (structure vs style)
- No duplicate layout logic
- JSON-first, no hardcoding

---

## RISKS & MITIGATIONS

### Risk 1: Breaking existing screens
**Mitigation:** 
- Backward compatible (explicit layouts still work)
- journal_replicate.json already uses roles (proven working)
- Can test before deploying

### Risk 2: Missing role mappings
**Mitigation:**
- Fallback to "content-stack" if role not found
- Validation in development mode warns about missing mappings
- Phase 2 adds full role coverage

### Risk 3: Override conflicts
**Mitigation:**
- Override still takes precedence (top of ladder)
- Store overrides work unchanged
- No API changes to override system

---

## VALIDATION PLAN

### Test Case 1: Template Switching
**Action:** Load app.json, switch from focus-writing to contemplative-space
**Expected:** Sections get wider padding, larger gaps
**Validation:** Visual inspection + resolver trace

### Test Case 2: Role Coverage
**Action:** Add sections with each of 5 roles
**Expected:** All resolve without fallback
**Validation:** Check trace for "template layoutVariants" not "fallback"

### Test Case 3: Override Precedence
**Action:** Set store override on section with role
**Expected:** Override wins, template ignored
**Validation:** Trace shows "override" decision

### Test Case 4: Backward Compatibility
**Action:** Load screen with explicit layout (no role)
**Expected:** Still works, uses explicit layout
**Validation:** Trace shows "explicit node.layout"

---

## TIMELINE ESTIMATE

### Phase 1: app.json Migration
- **Effort:** 30 minutes
- **Files:** 1 (app.json)
- **Testing:** 15 minutes
- **Total:** 45 minutes

### Phase 2: Template Expansion
- **Effort:** 1-2 hours (8 templates)
- **Files:** 1 (template-profiles.json)
- **Testing:** 30 minutes
- **Total:** 1.5-2.5 hours

### Phase 3: Role Consolidation
- **Effort:** 15 minutes
- **Files:** 1 (journal-roles.json)
- **Testing:** 15 minutes
- **Total:** 30 minutes

**Total estimated time:** 2.75-3.75 hours

---

## RECOMMENDATION

**Proceed with migration in 3 phases:**

1. ✅ **Phase 1 (critical):** Migrate app.json to use roles
   - Enables template reshaping for app.json
   - Low risk, high impact

2. ✅ **Phase 2 (recommended):** Expand template role coverage
   - Adds reflect + action to all templates
   - Future-proofs against new sections

3. ⚠️ **Phase 3 (optional):** Consolidate roles
   - Cleaner architecture
   - Can defer if timeline is tight

**Minimal viable migration:** Phase 1 only (45 minutes)
**Recommended migration:** Phase 1 + Phase 2 (3 hours)
**Complete migration:** All 3 phases (4 hours)

---

## RESOURCES

### Documentation Created

1. **JOURNAL_TEMPLATE_ROLE_AUDIT.md** — Complete system audit + analysis
2. **JOURNAL_MIGRATION_SNIPPETS.md** — Copy-paste JSON snippets
3. **JOURNAL_SYSTEM_ARCHITECTURE.md** — Visual architecture guide
4. **EXECUTIVE_SUMMARY.md** — This document

### Code References

- Resolver: `src/04_Presentation/layout/section-layout-id.ts` (lines 88-119)
- Templates: `src/04_Presentation/lib-layout/template-profiles.json` (lines 2024-2490)
- Roles: `src/04_Presentation/lib-layout/journal-roles.json`
- Example: `src/01_App/apps-json/apps/journal_track/journal_replicate.json` (working example)

---

## CONCLUSION

**The journal role system is architected and functional.**

Migration requires only JSON changes to:
1. Remove explicit layouts from app.json
2. Add roles to app.json sections
3. Expand template layoutVariants

**Zero code changes. Zero new engines. JSON-first. Contract safe.**

Templates will immediately reshape journal screens when explicit layouts are removed.

**Recommended action:** Proceed with Phase 1 + Phase 2 migration.
