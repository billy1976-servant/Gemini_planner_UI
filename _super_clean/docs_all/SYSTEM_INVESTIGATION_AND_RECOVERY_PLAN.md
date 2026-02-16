# SYSTEM INVESTIGATION + RECOVERY PLAN — Template Builder + Onboarding System

**Mode:** Analysis only. No code changes or fixes applied.

**Date:** 2025-02-10

---

## A) ROOT CAUSE LIST

### Why templates vanished

1. **App template list is hardcoded**
   - `CreateNewInterfacePanel.tsx` defines `APP_TEMPLATES = [{ value: "journal_track", label: "journal_track" }]` only. There is no API or filesystem scan that populates this list from `apps-json/apps/`.
   - Other compilable app folders exist on disk (e.g. `apps-json/apps/templates/doctor/`, `templates/test-module/`, `cooking-me-up`, `what-s-app`, `wow`, `my-interface`) but are never offered in the dropdown.

2. **Module templates API returns empty**
   - `GET /api/module-templates` scans `src/08_Modules` for files matching `*.blueprint.txt` **in the vertical root** (e.g. `contractors/*.blueprint.txt`). In the repo there are **0** such files.
   - Actual 08_Modules layout is `vertical/master/blueprint.txt` and `vertical/<subtype>/content.txt` (no `vertical/<subtype>.blueprint.txt`). So the optgroup "Module templates (08_Modules)" is always empty.
   - Result: the only option the user ever sees is **journal_track** from the hardcoded list.

3. **No “app templates” API**
   - There is no endpoint that lists app folders under `apps-json/apps/` (or `apps-json/templates/`) that have `blueprint.txt`. So even though `apps-json/apps/templates/doctor` and `templates/test-module` are valid copy sources, the UI has no way to discover them.

### Why content is not generating

1. **create-from-module writes empty content by design**
   - `POST /api/create-from-module` creates `apps-json/generated/<slug>/` with `blueprint.txt` (copied from 08_Modules) and **empty** `content.txt` (`fs.writeFileSync(..., "", "utf8")`). It does not copy subtype `content.txt` from 08_Modules and does not call the compiler. So any flow that uses a “module template” produces a folder with no content and no `app.json`.

2. **create-from-module is misaligned with 08_Modules layout**
   - The API expects `moduleTemplate` like `vertical_subtype` and looks for `vertical/subtype.blueprint.txt` (e.g. `contractors/painter.blueprint.txt`). In 08_Modules, blueprints live in `vertical/master/blueprint.txt` and subtypes only have `content.txt`. So even if the dropdown showed module options, the blueprint lookup would 404 for the current folder structure.

3. **No content-generation step in the Template Builder flow**
   - The onboarding content generator lives in `07_Dev_Tools/scripts/onboarding/logic.ts` (creates `blueprint.txt`, `content.txt`, `supportAI.txt`). That pipeline is separate (CLI/build) and is not invoked by the Create New Interface UI. So “content generation” in the sense of filling sections does not run when creating an app from the control dock.

### Why folders are empty / dead

1. **Generated folder with no compile**
   - When the user selects a “module template” (when that list is non-empty), the flow calls only `create-from-module`. It creates `apps-json/generated/<slug>/` with `blueprint.txt` + empty `content.txt` and then navigates to `?screen=generated/<slug>/app`. No compile step runs, so `app.json` is never written. The folder exists but is “dead” (no runnable screen).

2. **Empty `apps-json/generated/`**
   - In the repo, `src/01_App/apps-json/generated/` has no children. So either no one has successfully created an app via the module path, or generated apps were removed. Any navigation to `generated/<slug>/app` will try to load a non-existent `app.json`.

3. **Duplicate-app flow does populate**
   - For the **app template** path (e.g. journal_track), `duplicate-app` copies the full template folder (including `content.txt`) to `apps-json/apps/<slug>`, then `compile-app` runs and writes `app.json` + `content.manifest.json`. So folders created from journal_track are not empty; “dead folder” applies mainly to the **module** (create-from-module) path.

### Why fetch is failing

1. **Screen load after create-from-module**
   - After create-from-module, the client navigates to `?screen=generated/<slug>/app`. The screen loader normalizes this and calls `safeImportJson` → `fetch(/api/screens/generated/<slug>/app.json)`. Since `app.json` was never created, the screens API returns 404 → user sees “Screen not found” or (if the error is surfaced as a network message) “Failed to fetch” style messaging.

2. **Relative path and API contract**
   - The screens API correctly resolves `generated/` to `apps-json/generated/`. The failure is not path resolution but **missing file**: no compile step runs for the module path, so `app.json` does not exist.

3. **Compiler not involved in “failed to fetch”**
   - The blueprint compiler (`blueprint.ts`) does not perform any fetch. It reads from the filesystem. “Failed to fetch” comes from the **browser** (screen-loader → safeImportJson → fetch to `/api/screens/...`) when the API returns 404 or on network error.

---

## B) SYSTEM MAP

End-to-end flow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TEMPLATE SOURCES (what should feed the dropdown)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  • apps-json/apps/          → journal_track, templates/doctor,                │
│                              templates/test-module, cooking-me-up, etc.     │
│                              (only journal_track is hardcoded in UI)         │
│  • 08_Modules               → vertical/master/blueprint.txt +               │
│                              vertical/<subtype>/content.txt                 │
│                              (module-templates API looks for *.blueprint    │
│                               in vertical root → finds 0 files)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  UI: CreateNewInterfacePanel                                                 │
│  • Dropdown = APP_TEMPLATES (hardcoded) + moduleTemplates (from /api/        │
│    module-templates → empty)                                                │
│  • Button: "Duplicate template & open"                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
          ┌────────────────────────────┴────────────────────────────┐
          │ isModuleTemplate (template has "_" && in moduleTemplates) │
          │ → always false today (moduleTemplates empty)              │
          └────────────────────────────┬────────────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────┐  ┌─────────────────────────────────────────────┐
│ create-from-module      │  │ duplicate-app                                 │
│ (module path)           │  │ (app template path)                           │
│ • Writes to             │  │ • Copies from apps-json/apps/<template>        │
│   apps-json/generated/  │  │   to apps-json/apps/<slug>                    │
│   <slug>/               │  │ • Skips app.json (so compile regenerates)    │
│ • blueprint.txt +       │  │ • blueprint.txt + content.txt present        │
│   content.txt (empty)   │  └─────────────────────────────────────────────┘
│ • No compile            │                    │
└─────────────────────────┘                    ▼
          │                    ┌─────────────────────────────────────────────┐
          │                    │ compile-app                                 │
          │                    │ • Resolves appPath to apps-json/apps/<slug>  │
          │                    │   or apps-json/generated/<slug>             │
          │                    │ • Calls blueprint.ts compileApp()          │
          │                    │ • Reads blueprint.txt + content.txt        │
          │                    │ • Writes app.json + content.manifest.json   │
          │                    └─────────────────────────────────────────────┘
          │                                    │
          │                                    ▼
          │                    ┌─────────────────────────────────────────────┐
          │                    │ App folder (apps or generated)               │
          │                    │ • blueprint.txt, content.txt                 │
          │                    │ • app.json, content.manifest.json            │
          │                    └─────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────┐  ┌─────────────────────────────────────────────┐
│ Navigate:                │  │ Navigate: apps/<slug>/app                    │
│ generated/<slug>/app     │  │ → loadScreen → safeImportJson               │
│ • No app.json → 404      │  │   → GET /api/screens/apps/<slug>/app.json   │
│ • “Failed to fetch” /    │  │ → OK (file exists after compile)             │
│   Screen not found       │  └─────────────────────────────────────────────┘
└─────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Screens API (GET /api/screens/[...path])                                    │
│  • apps/* → SCREENS_ROOT = apps-json/apps                                   │
│  • generated/* → GENERATED_ROOT = apps-json/generated                       │
│  • Returns JSON or 404 "Screen not found"                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Summary chain:**  
Template source (apps or 08_Modules) → UI dropdown (currently only journal_track) → duplicate-app or create-from-module → target folder (apps/<slug> or generated/<slug>) → compile-app (app path only) → blueprint.txt + content.txt → Compiler (blueprint.ts) → app.json → Screen loader (fetch /api/screens) → App folder.

---

## C) RECOVERY PLAN (STEP-BY-STEP, SURGICAL)

### Phase 1 — Restore template discovery

1. **Add an “app templates” API**
   - New endpoint, e.g. `GET /api/app-templates`, that:
     - Scans `apps-json/apps/` (and optionally a future `apps-json/templates/`) for directories containing `blueprint.txt`.
     - Returns a list of `{ value, label }` where `value` is the path used as `templateAppPath` (e.g. `journal_track`, `templates/doctor`, `templates/test-module`). Exclude `behavior-tests` (no blueprint) and optionally `generated` if it ever lives under apps.
   - No changes to compiler or screen loader; read-only discovery.

2. **Populate CreateNewInterfacePanel from the new API**
   - In `CreateNewInterfacePanel`, add a `useEffect` that fetches `GET /api/app-templates` and sets the list of “App templates” options (replace or merge with current `APP_TEMPLATES`). Keep a fallback to `journal_track` if the API fails or returns empty.

3. **Fix module template discovery (08_Modules)**
   - Option A: Change `/api/module-templates` to discover from the actual 08_Modules layout: e.g. for each vertical, list subdirs that have `content.txt` (e.g. `painter`, `dentist`), and expose value as `vertical_subtype` with label like `vertical / subtype`.
   - Option B: Add `vertical/master/blueprint.txt` as a single “master” option per vertical and have create-from-module copy master blueprint + chosen subtype content (see Phase 2). Then list subtypes (with or without a separate “master” option) in the API so the dropdown shows e.g. “contractors / painter”, “medical / dentist”.

### Phase 2 — Restore content creation (no empty folders)

4. **Fix create-from-module to copy content and optionally compile**
   - Resolve blueprint from `vertical/master/blueprint.txt` (not `vertical/subtype.blueprint.txt`).
   - Copy `vertical/<subtype>/content.txt` to `apps-json/generated/<slug>/content.txt` (do not write empty string).
   - Optionally run the same compiler used by compile-app (or call compile-app) so `app.json` exists before redirect. If you keep “no compile” by design, then at least ensure content is copied so the folder is not empty and a later manual or separate “Compile” action can run.

5. **Ensure generated apps are compileable and loadable**
   - After create-from-module, either:
     - Call compile-app for `generated/<slug>`, then navigate to `generated/<slug>/app`, or
     - Add a “Compile” button or auto-compile so that by the time the user is redirected, `app.json` exists and the screen fetch succeeds.

### Phase 3 — Restore proper app generation (duplicate path)

6. **Keep duplicate-app + compile-app as the main “app template” path**
   - No change needed for the flow itself; it already copies and compiles. Ensure the new app-templates list uses `templateAppPath` values that match real folders under `apps-json/apps/` (e.g. `templates/doctor`, `templates/test-module`).

7. **Optional: Write new apps under generated**
   - Per MODULE_SYSTEM_CLEANUP_AND_TEMPLATE_WIRING_PLAN.md, new apps could be created under `apps/generated/<slug>` instead of `apps/<slug>`. If desired: (a) duplicate-app (or a new endpoint) copies template to `apps-json/apps/generated/<slug>`, (b) compile-app is called with `appPath: "generated/<slug>"`, (c) navigation uses `generated/<slug>/app`. Requires duplicate-app to support a target path under `generated/` and compile-app already supports `generated/`.

### Phase 4 — Restore full onboarding UI richness (control deck)

8. **Clarify “simplified” vs “richer”**
   - **Current:** `page.tsx` mounts `RightFloatingSidebar` (Google-style inline, 280px panel, pills: Experience, Mode, Palette, Template, Styling, Behavior, Layout, New Interface, Expand). For website/app experience it receives `layoutPanelContent={OrganPanel(...)}`; for learning it does not.
   - **Unused:** `ControlDock.tsx` uses `editor-theme.css`, `DockSection`/`DockPanel`, 320px width, and a different pill set (no “New Interface” or “Expand” in the visible list). `RightSidebarDock` / `RightSidebarDockContent` use CSS variables and the same pills as the floating sidebar but are not mounted in `page.tsx`.
   - Decide whether “richer” means: (a) switching back to `ControlDock` and wiring it into the page (and adding New Interface/Expand if needed), (b) using `RightSidebarDock` in layout instead of the floating sidebar, or (c) enhancing `RightFloatingSidebar` with sections/grouping and editor-theme tokens so it matches the intended design. No code change until this decision is made.

9. **If restoring ControlDock or RightSidebarDock**
   - Replace or branch the sidebar in `page.tsx` so the chosen component is mounted with the same props (state, palette, template list, layout panel content, etc.). Ensure `CreateNewInterfacePanel` and layout (OrganPanel) remain available. Test all three experiences (website, app, learning) so layout panel and New Interface still work.

10. **Layout panel for learning**
    - Currently `RightFloatingSidebar` is called with no `layoutPanelContent` for learning, so the Layout pill shows “Layout controls appear when a website-style screen is loaded.” If the desired behavior is to show a richer layout UI for learning too, pass an appropriate `layoutPanelContent` (or a placeholder) for the learning branch.

---

## D) RISK CHECK — What NOT to touch

To avoid breaking runtime:

1. **Do not modify** `src/07_Dev_Tools/scripts/blueprint.ts` parsing, `compileApp()`, or the contract of `blueprint.txt` / `content.txt`. The plan assumes the compiler remains the single source of truth for app.json generation.

2. **Do not change** the screens API path resolution (`SCREENS_ROOT`, `GENERATED_ROOT`, or the `generated/` prefix handling). Only add or fix data (templates, content, app.json) so existing resolution keeps working.

3. **Do not remove or rename** `apps-json/apps`, `apps-json/generated`, or the existing `duplicate-app` / `compile-app` API contracts. Extend or add endpoints (e.g. app-templates) rather than replacing behavior used by the current flow.

4. **Do not change** `loadScreen` / `safeImportJson` semantics (normalization, fetch URL shape). Fix “failed to fetch” by ensuring `app.json` exists and the API returns 200, not by changing the loader.

5. **Do not wire** the onboarding CLI (`logic.ts`, `build-onboarding.ts`) into the Template Builder unless you explicitly want that pipeline to run on “Duplicate template & open.” Keeping them separate avoids accidental dependency on the onboarding directory or supportAI format.

6. **Safe-screen-registry** (`safe-screen-registry.ts`): if you add new app paths (e.g. under `generated/`), consider whether the registry needs updating for any runtime that depends on it. Do not remove existing journal_track or generated entries without verifying no code paths assume them.

7. **State store, layout store, palette store:** sidebar and OrganPanel depend on these. Recovery should only add or fix template/content/compile; avoid changing keys or dispatch contracts used by the control dock or layout panel.

---

**END OF PLAN — No implementation performed.**
