---
name: Engine Refactor Architecture Report
overview: "Analysis-only deliverable: produce ENGINE_REFACTOR_ARCHITECTURE_REPORT.md documenting current TSX runtime engines, duplication, wrapper opportunities, contract compliance, and proposed target architecture—no code changes."
todos: []
isProject: false
---

# Engine Refactor Architecture Report (Analysis Only)

## Objective

Produce a single markdown report **ENGINE_REFACTOR_ARCHITECTURE_REPORT.md** that:

- Inventories all TSX modules that act as runtime engines (Prayer + 03_Runtime + components/prayer + structure/lib).
- Documents duplication (timing, session, replay, state patterns).
- Classifies each module as engine / wrapper / UI-to-structure / logic-to-utilities.
- Maps modules to the 8 structure types (list, board, dashboard, editor, timeline, detail, wizard, gallery).
- Analyzes compliance with 02_Contracts_Reports, Blueprint contract, and build protocols.
- Proposes a target architecture (minimal engines, thin wrappers, shared utilities) and recommended refactor steps.

**No code modifications.** Analysis and report writing only.

---

## Report Location and Structure

- **Path:** [src/01_App/Christian/Prayer/ENGINE_REFACTOR_ARCHITECTURE_REPORT.md](src/01_App/Christian/Prayer/ENGINE_REFACTOR_ARCHITECTURE_REPORT.md) (or project root if preferred; will use Prayer folder to align with existing PRAYER_* docs).
- **Sections (per user spec):**
  1. Current engine inventory (path, size, responsibility, UI vs logic %, state, dependencies)
  2. Duplication findings
  3. Wrapper opportunities (engine vs wrapper vs UI vs logic classification)
  4. Comparison against 8 structure types
  5. Contract compliance analysis (02 contract reports, Blueprint, build protocols)
  6. Proposed final architecture
  7. Recommended refactor steps

---

## Data Already Gathered

- **Prayer TSX line counts:** From shell agent — e.g. PrayerRoom 750, PrayerApp 865, ModeratorPanel 586, SessionReplayViewer 260, AnnotationOverlay 319, ReplayTimeline 75, etc.; room/* and subfolders enumerated.
- **03_Runtime engine TSX:** json-renderer 1611, OnboardingFlowRenderer 441, IntegrationFlowEngine 362, ExperienceRenderer 227, registry 160, etc.; system7 and channels (small stubs).
- **RecorderModule/PlayerModule:** RecorderModule has local `formatTime` (duplicate of Prayer `utils/formatTime`); PlayerModule is thin wrapper around PrayerPlayer + ReplayTimeline.
- **Timing/format duplication:** `formatTime`/`formatDuration` — shared in Prayer `utils/formatTime`; RecorderModule defines its own `formatTime`; SessionReplayViewer, ModeratorPanel, PrayerRoom, PrayerPlayer, StudyPagesManager, MomentsSection use shared utils.
- **State usage:** Prayer uses `getSlice`/`writeSlice` (prayer-room-session.state), `getReplay`/`setReplay` (replay in HICLARIFY); AnnotationOverlay, SlideViewer, SessionSlidesView, ModeratorPanel all use getSlice/writeSlice.
- **Contract docs:** 03_ENGINE_SYSTEM.md, 06_CONTRACTS_MASTER.md, BUILD_BLUEPRINT_CONTRACT_V2.md, ENGINE_REDUNDANCY_REPORT.md, UNIVERSAL_ENGINE_BASELINE.md reviewed.
- **8 structure types:** Defined in `src/lib/tsx-structure` (list, board, dashboard, editor, timeline, detail, wizard, gallery); PrayerApp resolved as list; convention.ts and builtinTemplates.ts.
- **Blueprint/build:** BUILD_BLUEPRINT_CONTRACT_V2 (molecules, content, layer model); CURSOR_CREATE_PLANS_PROTOCOL; TSX_ENGINE_BUILD_AUDIT_REPORT.

---

## Execution

1. **Write ENGINE_REFACTOR_ARCHITECTURE_REPORT.md** under `src/01_App/Christian/Prayer/` with:
  - **Section 1 — Current engine inventory:** Table/list of each TSX engine candidate (Prayer room stack, PrayerApp, RecorderModule, PlayerModule, 03_Runtime engine TSX, system7, Presentation timeline organisms if relevant) with: file path, approximate size (lines), responsibility, UI vs logic percentage (estimate), state usage, key dependencies.
  - **Section 2 — Duplication findings:** Timing (formatTime in RecorderModule vs shared utils), event/timeline logic (session-timeline vs annotation-timeline vs replay in state), session logic (getSlice/writeSlice pattern vs any duplicate local state), media controls (RecorderModule vs room recording), state update patterns, replay systems (ReplayTimeline, SessionReplayViewer, getReplay/setReplay).
  - **Section 3 — Engine vs wrapper classification:** For each major module, label as A) true runtime engine, B) wrapper around an engine, C) UI that should become a structure wrapper, D) logic that should move to shared utilities. Use tables for clarity.
  - **Section 4 — Eight structure types:** Which modules could become wrappers using list/board/dashboard/editor/timeline/detail/wizard/gallery; map PrayerApp (list), WorkspaceLayout (dashboard), onboarding flows (wizard), timeline organisms, etc.
  - **Section 5 — Contract compliance:** Whether engines follow 02 contract reports and ENGINE_LAWS; whether wrappers match intended structure system; whether Blueprint rules are enforced; references to BUILD_BLUEPRINT_CONTRACT_V2, 06_CONTRACTS_MASTER, ENGINE_REDUNDANCY_REPORT.
  - **Section 6 — Proposed target architecture:** Diagram (mermaid) or bullet flow: runtime engines (minimal set) → thin TSX wrappers → structure types (8) → layout/palette → JSON screens (future). Call out minimal engines (e.g. session state engine, replay/timeline engine, media/recording engine, annotation engine, WebRTC bridge), shared utilities (time, empty UI), thin wrappers (room UI, moderator UI, player UI).
  - **Section 7 — Recommended refactor steps:** Ordered list (no code edits in this task): e.g. extract RecorderModule formatTime to shared utils; split PrayerRoom into engine vs wrapper; align ModeratorPanel with structure; consolidate replay timeline into one engine; etc.
2. **Do not** modify any application code, config, or other files—report only.

---

## Output

- Single file: **ENGINE_REFACTOR_ARCHITECTURE_REPORT.md** containing the seven sections above, with concrete file paths and citations from the codebase and contract docs.

