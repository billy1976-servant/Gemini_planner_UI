# Phase 1: Folder reorganization (01–08)

## Target structure (with 04_Presentation)

| #   | Folder                       | Purpose |
| --- | ---------------------------- | ------- |
| 01  | **01_App**                   | Entry: screens, app definitions (Next.js `app/` stays at `src/app`). |
| 02  | **02_Contracts_Reports** | Authority: contracts, system reports, docs, cursor plans, system. |
| 03  | **03_Runtime**               | Engine, behavior, state, runtime (spine: JSON → Engines → State → Layout → Renderer). |
| 04  | **04_Presentation**         | Layout, components, UI, palettes, registry (what gets rendered). |
| 05  | **05_Logic**                 | Engines, flows, actions, products, runtime verbs. |
| 06  | **06_Data**                  | Content, site pipeline, web2extractor. |
| 07  | **07_Dev_Tools**            | Scripts, diagnostics, debug, config, styles, types, system-control, scans. |
| 08  | **08_Cleanup**              | Legacy, refactor docs, unused. |

## Decisions locked (per suggestions)

- **system/** → 02_Contracts_Reports
- **system-control/** → 07_Dev_Tools
- **scans/** → 07_Dev_Tools
- **blocks/** → 08_Cleanup
- **dev/** → 07_Dev_Tools
- **types/** → 07_Dev_Tools
- **cursor/** → all in 02
- **docs/** → all in 02
- **Layout/components/UI/palettes/registry** → 04_Presentation (not 03_Runtime)

## Move list summary

- **01_App:** screens, apps-tsx, apps-json (app stays at src/app).
- **02_Contracts_Reports:** contracts, system-reports, docs, system-architecture, cursor, system.
- **03_Runtime:** engine, runtime, behavior, state only.
- **04_Presentation:** layout, layout-organ, lib/layout→lib-layout, components, ui, ux, palettes, registry, lib/media→lib-media, component-sliders.
- **05_Logic:** logic.
- **06_Data:** content, compiler, web2extractor, lib/site-*, lib/product-screen-adapter, lib/screens.
- **07_Dev_Tools:** devtools, diagnostics, debug, scripts, config, styles, types, system-control, scans, dev, engine/debug→engine-debug, engine/devtools→engine-devtools, engine/core/diagnostics→engine-diagnostics, runtime/diagnostics.
- **08_Cleanup:** map (old)→map-old, refactor_ROUND 1/2/3, KNOCKOUT, temp files→temp-files, 0-core, 1-ui, blocks.
