# ROUND 2 — Phase 05: Layout Decision Consolidation

**Goal:** Single layout decision ladder documented; optional merge of profile default into layout.

---

## Objectives

1. Document the authority ladder for layout: override (store) → node.layout → template default (getDefaultSectionLayoutId) → undefined. This may already exist in RUNTIME_AUTHORITY_LADDER; ensure it reflects getSectionLayoutId in layout/.
2. Optionally: have layout module accept templateId and resolve "default section layout id" internally (so page doesn't need to call getTemplateProfile for layout; only for experience profile if needed). If not done, document that getTemplateProfile is used by page to pass templateId to JsonRenderer and layout uses it in getSectionLayoutId.

---

## Acceptance criteria

- [x] Layout decision order is documented: override → node → template default → undefined (with template role between node and template default).
- [x] Either (a) layout owns getDefaultSectionLayoutId(templateId) and getSectionLayoutId uses it, or (b) getDefaultSectionLayoutId stays in page and is passed/called from getSectionLayoutId; (b) is minimal change.
- [x] No second authority for "section layout id" outside layout/.

---

## Files to touch (planning)

- layout/resolver/layout-resolver.ts or section-layout-id.ts
- layout/page/page-layout-resolver.ts (if getDefaultSectionLayoutId moves or is called from layout)
- docs/ARCHITECTURE_AUTOGEN or system-architecture (RUNTIME_AUTHORITY_LADDER / layout section)

---

## Dependencies

- Phase 01 complete.

---

---

## Execution Record

**Summary of changes made**

- Layout decision ladder is documented in one place and aligned with getSectionLayoutId. Order: override (store) → node.layout → template role → template default → undefined. getDefaultSectionLayoutId remains in layout/page and is called from getSectionLayoutId (minimal; single authority in layout/).

**Files modified**

- src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_AUTHORITY_LADDER.md — Section Layout Authority: order set to override → node.layout → template role → template default → undefined; "Implemented in" updated to layout/section-layout-id.ts getSectionLayoutId. Layout Resolver Output: authority for "which layout ref" set to getSectionLayoutId.
- src/system-architecture/05_LAYOUT_SYSTEM.md — Layout resolution order: single authority getSectionLayoutId; added template role step; Authority precedence table and State and override orchestration updated to reference layout/section-layout-id.ts.

**Tests run**

- No code change; runtime-pipeline-contract unchanged (Phases 01–04).

**Confirmation acceptance criteria met**

- Layout decision order documented (override → node → template role → template default → undefined) in RUNTIME_AUTHORITY_LADDER and 05_LAYOUT_SYSTEM.
- getDefaultSectionLayoutId stays in layout/page; getSectionLayoutId uses it (option (b)).
- No second authority: section layout id only in layout/getSectionLayoutId.
