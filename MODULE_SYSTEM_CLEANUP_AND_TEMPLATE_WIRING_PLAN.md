# Module System Cleanup + Template Wiring Plan (PLAN ONLY)

**Objective:** Stabilize the blueprint/content module system using **only** the existing compiler (`blueprint.txt` + `content.txt` → exporter → `app.json`). No new engine, no new generator. Only cleanup, folder normalization, template wiring, and sidebar generation plan.

**Hard rules (non-negotiable):**
- DO NOT create a compiler
- DO NOT modify existing blueprint exporter logic / parsing
- DO NOT create new TS rendering systems or file formats
- This task is ONLY: cleanup, folder normalization, template wiring, sidebar generation plan
- Everything must use: `blueprint.txt`, `content.txt`, existing exporter

---

## PHASE 1 — System Audit (Read-Only)

### 1.1 Current structure mapped

| Location | Purpose | Used? | Notes |
|----------|---------|-------|--------|
| **src/01_App/apps-json/apps/** | Root for all JSON/TXT app artifacts | **YES** | Canonical. Screens API and compiler use this. |
| **apps/behavior-tests/** | Standalone JSON screens (no blueprint) | **YES** | Test/demo JSON only; no `blueprint.txt`. Not compiled. |
| **apps/generated/** | Compiled apps from module-system or copy | **YES** | Contains: contractor-jones, dentist-smith, my-interface, sieburg-design. Each has blueprint.txt, content.txt, app.json, content.manifest.json. |
| **apps/journal_track/** | Hand-maintained TXT app | **YES** | blueprint.txt + content.txt + app.json. No content.manifest.json on disk (created on compile). |
| **apps/templates/doctor/** | Single “template” folder | **LEGACY** | Only `content.manifest.txt` (old format). No blueprint.txt, no content.txt. **Breaks** blueprint contract (templates must be copy sources with blueprint + content). |
| **src/08_Blueprints/** | Intended “master” blueprint holding area | **UNUSED** | README + master.blueprint.txt placeholder. No compiler or API reads from here. |
| **src/module-system/** | TS trees → blueprint/content generator | **ALTERNATIVE PATH** | Generates blueprint.txt + content.txt from TS trees (business.tree.ts, etc.), then caller runs compileApp(). Does **not** copy from TXT templates. |
| **src/07_Dev_Tools/scripts/blueprint.ts** | **Existing exporter (compiler)** | **AUTHORITATIVE** | Reads blueprint.txt + content.txt from a folder, writes app.json + content.manifest.json. Used by CLI and /api/compile-app. **Do not modify.** |
| **Right sidebar / CreateNewInterfacePanel** | “Create new interface” UI | **PARTIAL** | Uses duplicate-app (copy folder) + compile-app. Template dropdown **hardcoded** to `journal_track`. Writes to `apps/<slug>` and navigates to `apps/<slug>/app` (not under `generated/`). |

### 1.2 Which folders are actually used

- **Used:** `apps/`, `apps/generated/<slug>/`, `apps/journal_track/`, `apps/behavior-tests/` (for loading JSON). Compiler uses `apps/` (any subfolder with blueprint.txt).
- **Used by alternative path:** `module-system/` is used by script `generate-dentist-and-contractor.ts` to generate into `apps/generated/` then compile.

### 1.3 Which are legacy

- **apps/templates/doctor/** — Legacy. Only content.manifest.txt; no blueprint.txt/content.txt. Not usable as copy source.
- **content.manifest.txt** — Referenced in CONTENT_DERIVATION_CONTRACT.md as “human-editable”; actual compiler **generates** content.manifest.**json** and does not read .txt. So .txt is legacy/doc only.

### 1.4 Which are duplicates / two paths

- **Two ways to get an app:**  
  1) **Copy + compile:** duplicate-app copies an existing app folder (e.g. journal_track) to `apps/<slug>`, then compile-app.  
  2) **Tree-based generate + compile:** module-system `generateFiles()` writes from TS trees to `apps/generated/<slug>/`, then script calls `compileApp()`.  
- So: “template” today is either a full app folder (journal_track) or a TS tree (module-system). No single “TXT template” folder is wired for business/physician, dentist, etc., as copy sources.

### 1.5 Which break the blueprint contract

- **apps/templates/doctor:** No blueprint.txt, no content.txt. Only content.manifest.txt (different format). Cannot be used as copy source for existing exporter.
- **CreateNewInterfacePanel:** Puts new apps at `apps/<slug>` instead of `apps/generated/<slug>`, and only offers one template (journal_track). No “Business → Type (Physician/Dentist/…)” flow.

---

## PHASE 2 — Final Canonical Structure

Standardize to **two roles only**.

### A) Templates (master modules — NOT compiled)

- **Location:** `src/01_App/apps-json/templates/`  
  (sibling to `apps/`, not inside `apps/`.)

**Structure (target):**

```
templates/
  business/
    blueprint.txt              ← one master business blueprint
    physician.content.txt
    dentist.content.txt
    contractor.content.txt
    church.content.txt
  schools/
    blueprint.txt
    elementary.content.txt
    college.content.txt
  government/
    blueprint.txt
    city.content.txt
```

- These are **copy sources only**. No compilation here. One blueprint per template group; one content file per “type” (e.g. physician, dentist).

### B) Generated apps (compiled targets)

- **Location:** `src/01_App/apps-json/apps/generated/<appName>/`

**Per-app contents (required):**

- `blueprint.txt` (copied from template or written by tree — we keep existing exporter only)
- `content.txt` (copied from template type or written by tree)
- `app.json` (output of existing compiler only)
- `content.manifest.json` (output of existing compiler only)

- **Creation rule:** Copy from `templates/<group>/` into `apps/generated/<slug>/` (blueprint.txt + `<type>.content.txt` → content.txt), then call existing exporter. No new logic.

---

## PHASE 3 — Cleanup Plan (No Delete Yet)

### 3.1 Mark and classify

| Item | Classification | Action (plan only) |
|------|----------------|--------------------|
| **src/08_Blueprints/** | Redundant with canonical templates | **Archive** after `templates/` is populated. Move README + master.blueprint.txt into docs or archive; optionally copy useful content into `templates/` then remove folder. |
| **apps/templates/doctor/** | Legacy; wrong format | **Archive** or remove. If doctor content is to be kept, convert to `templates/business/physician.content.txt` (+ business blueprint.txt) and then remove this folder. |
| **content.manifest.txt** (any) | Legacy; compiler uses .json only | **Do not use as source.** Compiler generates content.manifest.json. Remove or archive .txt references; update CONTENT_DERIVATION_CONTRACT.md to say “content.manifest.json (generated)”. |
| **module-system tree generators** | Alternative to TXT templates | **Keep** but treat as optional path. Do not duplicate: either templates are TXT copy sources OR tree generates; for “template wiring” we wire **TXT copy + compile** only. Trees can remain for scripts/dev; sidebar flow uses only templates. |
| **Duplicate blueprint files** | N/A today | No duplicate blueprint files found; only one blueprint per app/template. |
| **Incorrect paths** | CreateNewInterfacePanel + duplicate-app | **Fix:** New apps must be created under `apps/generated/<slug>`. duplicate-app target = `generated/<slug>`. CreateNewInterfacePanel screen path = `apps/generated/<slug>/app`. |

### 3.2 Safe cleanup summary

- **Archive:** 08_Blueprints (after templates exist), apps/templates/doctor (after migration if needed).
- **Remain:** apps/, apps/generated/, apps/journal_track/, apps/behavior-tests/, blueprint.ts, compile-app API, duplicate-app API, module-system (as optional), screens API, screen-loader.
- **Move:** None required for compiler. For canonical structure: **add** `apps-json/templates/` with business/, schools/, government/ and per-type content files; **populate** from existing generated examples or module-system output if desired (no change to compiler).

---

## PHASE 4 — Sidebar Template System (Plan Only)

### 4.1 Minimal flow (existing exporter only)

1. User clicks **“Generate Business Site”** (or similar).
2. Sidebar expands:
   - **Business name** (text → slug).
   - **Type:** Physician | Dentist | Contractor | Church (radio or select).
   - **Options (optional):** e.g. Payments? Booking? Services? (radio each).
3. On confirm:
   - **Copy**
     - `templates/business/blueprint.txt` → `apps/generated/<slug>/blueprint.txt`
     - `templates/business/<type>.content.txt` → `apps/generated/<slug>/content.txt`
   - **Call existing exporter** (POST /api/compile-app with `appPath: "generated/<slug>"`).
4. Navigate to `?screen=apps/generated/<slug>/app`.

No new compiler, no new generator. Only copy + existing compile.

### 4.2 API / backend

- **New or extended endpoint (optional):** e.g. POST “create from template” that: ensures `apps/generated/<slug>` exists, copies the two files from `templates/<group>/`, then calls existing compile-app. Or keep duplicate-app and add a “template source” that points to a path under `templates/` (e.g. virtual “app” that is actually templates/business + physician.content.txt). Simplest: new route that does copy (from templates) + compile, or extend duplicate-app to accept “templatePath” like `templates/business` + `contentFile: physician.content.txt` and copy to `generated/<slug>`.
- **duplicate-app today:** Copies from `apps/<templateAppPath>` to `apps/<newAppPath>`. To align with canonical structure: either (1) add a “from template” flow that copies from `apps-json/templates/<group>/` into `apps/generated/<slug>/` (with content file selection), or (2) pre-create “template app” folders under `apps/` that are just copies of template content and duplicate from there. Prefer (1) so templates stay out of `apps/`.

### 4.3 CreateNewInterfacePanel wiring

- **Template list:** From config or discovery: list template groups (e.g. Business, Schools, Government) and per-group types (Physician, Dentist, …).
- **Target path:** Always `generated/<slug>`.
- **Screen path after create:** `apps/generated/<slug>/app`.
- **Flow:** Copy template files → `apps/generated/<slug>/` → call compile-app → open screen.

---

## PHASE 5 — Content Placeholder Strategy

- Templates must contain **rich placeholder content** (images, text, services, testimonials) so the first render looks complete.
- Users then edit content (in content.txt or via future UI) and recompile (existing exporter).
- **Action:** When creating `templates/<group>/<type>.content.txt`, fill with realistic placeholders (same format as current content.txt); ensure blueprint and content slot keys match so the compiler does not warn. Use existing generated apps (e.g. dentist-smith, contractor-jones) as reference for structure and style.

---

## PHASE 6 — Remove Old Confusion Points (Proposed, No Delete Yet)

| Item | Proposal |
|------|----------|
| **src/08_Blueprints** | Remove or merge: after `templates/` is in place, move any useful content into `templates/` or docs, then delete folder or leave as a single README pointing to `apps-json/templates/`. |
| **content.manifest.txt as source** | Everywhere: stop treating as source. Compiler generates content.manifest.json. Update docs; remove or rename apps/templates/doctor/content.manifest.txt when migrating. |
| **module-system tree generators** | Do not remove. They can stay for scripted generation (e.g. generate-dentist-and-contractor). Sidebar “template” flow uses only TXT copy + compile; no requirement to use trees in the UI. |
| **apps/templates/** | Replace with `apps-json/templates/` (sibling to apps). Migrate doctor content to templates/business/physician if needed; then remove apps/templates/. |

---

## OUTPUT SUMMARY

### Final folder architecture diagram

```
src/01_App/apps-json/
  templates/                    ← COPY SOURCES (not compiled)
    business/
      blueprint.txt
      physician.content.txt
      dentist.content.txt
      contractor.content.txt
      church.content.txt
    schools/
      blueprint.txt
      elementary.content.txt
      college.content.txt
    government/
      blueprint.txt
      city.content.txt

  apps/                         ← Compiled and loadable apps
    generated/
      <appName>/
        blueprint.txt
        content.txt
        app.json
        content.manifest.json
    journal_track/              ← Hand-maintained (unchanged)
    behavior-tests/             ← JSON-only (unchanged)
```

### Migration plan (high level)

1. **Add** `apps-json/templates/` with business/, schools/, government/ and per-type .content.txt + one blueprint.txt per group.
2. **Populate** template files (from existing generated apps or module-system output); ensure placeholders.
3. **Wire** sidebar: “Generate Business Site” → type → copy from templates to `apps/generated/<slug>` → call compile-app → open `apps/generated/<slug>/app`.
4. **Fix** CreateNewInterfacePanel and duplicate-app (or new endpoint) so new apps are created under `generated/<slug>` and screen path is `apps/generated/<slug>/app`.
5. **Optional:** Add “Create from template” API that copies from `templates/<group>/` into `apps/generated/<slug>/` then compiles.
6. **Later:** Archive 08_Blueprints; migrate or remove apps/templates/doctor; doc updates for content.manifest.

### What to move / keep / archive

- **Move:** Nothing from compiler. Add new `templates/` tree and optionally move “master” idea from 08_Blueprints into README under templates.
- **Keep:** blueprint.ts, compile-app API, duplicate-app API, apps/generated/, apps/journal_track/, apps/behavior-tests/, module-system (optional path), screens API, screen-loader, safe-screen-registry (update if we add dynamic generated list).
- **Archive:** 08_Blueprints (after templates exist); apps/templates/doctor (after migration).

### Sidebar wiring flow (confirmation)

- User selects template group + type → copy `templates/<group>/blueprint.txt` and `templates/<group>/<type>.content.txt` to `apps/generated/<slug>/blueprint.txt` and `content.txt` → POST compile-app with `appPath: "generated/<slug>"` → navigate to `?screen=apps/generated/<slug>/app`.

### Confirmation: only blueprint.txt, content.txt, existing exporter

- **Structure:** From templates we use only `blueprint.txt` and `*.content.txt` (renamed to `content.txt` in target).
- **Compilation:** Only the existing exporter in `src/07_Dev_Tools/scripts/blueprint.ts` (read blueprint.txt + content.txt → write app.json + content.manifest.json). No new compiler, no new parser, no new file formats.
- **This is a wiring task:** Turn the switch on (templates as copy sources, sidebar calling copy + compile). Do not build new “electricity” (no new engine/generator).

---

*End of plan. No code changes or deletions in this document; execution to follow in separate steps.*
