Primary Architecture Reference: docs/SYSTEM_MASTER/

# If you're new, read this

**Classification:** FOUNDATIONAL — Entry point; primary architecture reference: docs/SYSTEM_MASTER/

## What the system is

HiSense is a **JSON-driven UI system**: screens and skins are defined in JSON (blueprint + content), compiled to runtime trees, and rendered by a single engine (JsonRenderer + Registry). Logic and behavior are wired via CustomEvents and an append-only state log. The codebase also includes a **site compiler** (raw snapshot → normalized → schema) and **skin pipeline** (skin JSON → composeScreen → shells → JsonRenderer).

## Where things live

| What | Where |
|------|--------|
| **Screens** | JSON: `src/apps-offline/apps/<category>/<folder>/` (blueprint.txt, content.txt, app.json). TSX: `src/screens/` (all subfolders). Served via `/api/screens/*`. |
| **Skins** | Skin JSON: loaded by `src/lib/site-skin/loadSiteSkin.ts` (e.g. `/api/sites/:domain/skins/:pageId`). Compiled skins under `src/content/sites/*/compiled/skins/`. Shells: `src/lib/site-skin/shells/` (WebsiteShell, AppShell, LearningShell). |
| **Logic** | Behavior: `src/engine/core/behavior-listener.ts`, `src/behavior/` (runner, engine, verb resolver). State: `src/state/state-store.ts`, `src/state/state-resolver.ts`. Runtime verbs (TSX path): `src/engine/runtime/`, `src/logic/runtime/`. |
| **Adapters** | Product-to-screen: `src/lib/product-screen-adapter/` (compiled product data → offline JSON screen). Script: `npm run product-screen -- <domain>`. See ADAPTERS.md. |

## Current goal

Ship **shippable website/app skins** from the existing JSON→Layout→Regions→Molecules pipeline: lock docs, polish visual shells, connect ripper→skin output, and wire behavior/logic—without refactoring engines, molecules, or renderer. The single active plan is tracked in **PLAN_ACTIVE.md** (Phases A–D).

## One command to run

To refresh docs indexes and timestamps:

```bash
npm run cleanup
```

Then open **docs/HI_SYSTEM/** and read **START_HERE.md** (this file), **MAP.md** (system map), and **PLAN_ACTIVE.md** (current plan).

To run the **autonomous executor** (approval-based auto-builder):

```bash
npm run plan
```

This loads MAP, SYSTEM_MASTER_PLAN, MASTER_TASK_LIST, and WORKFLOW_RULES; shows phase overview and first incomplete phase; asks "Execute Phase X automatically? (y/n)". If you approve, it executes unchecked steps (auto where possible, manual confirm otherwise), marks steps done in MASTER_TASK_LIST, appends CHANGELOG, and updates MAP. Safety: JSON pipeline work must not break TSX; if uncertain, it pauses and asks.
