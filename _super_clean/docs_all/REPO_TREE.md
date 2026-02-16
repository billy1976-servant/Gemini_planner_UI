# REPO_TREE.md — Full repository tree (top-down)

**Generated:** Full system analysis. Excludes `node_modules` and build artifacts under `.next` for readability; source and config are complete.

---

## Root

```
HiSense/
├── .cursor/
│   ├── debug.log
│   └── plans/
│       └── json_layout_regions_shippable_skins_92ffbe94.plan.md
├── .gitignore
├── .idx/
│   ├── airules.md
│   ├── dev.nix
│   └── _Legacy_do_not_delete/
│       ├── behavior-listener.ts
│       ├── journal-viewer.tsx
│       └── state/
│           ├── persistence-adapter.ts
│           ├── state-adapter.ts
│           ├── state-log.ts
│           ├── state-resolver.txt
│           ├── state-store.ts
│           ├── state.ts
│           ├── user-input-viewer.tsx
│           ├── view-resolver.txt
│           ├── view-store.txt
│           └── views/
│               ├── decisions.json
│               ├── index.ts
│               ├── journal.json
│               ├── life.json
│               ├── metrics.json
│               ├── minimal.json
│               ├── monthly.json
│               ├── tasks.json
│               ├── timeline.json
│               ├── track.json
│               ├── weekly.json
│               └── ...
├── config/
│   └── ui-verb-map.json
├── content/
│   └── compiled/
│       └── sites/
│           ├── bendsoap-com/
│           │   ├── product.graph.json
│           │   ├── research.bundle.json
│           │   └── site.snapshot.json
│           └── gibson-com/
│               ├── product.graph.json
│               ├── report.final.json
│               ├── research.bundle.json
│               ├── site.snapshot.json
│               └── value.model.json
├── public/
│   └── screens/
│       ├── apps/
│       │   ├── next.json
│       │   └── test-buttons.json
│       ├── dashboard.json
│       ├── diagnostics/
│       │   ├── behaviors.json
│       │   ├── content.json
│       │   └── layout.json
│       └── websites/
│           └── scouts.json
├── scripts/
│   ├── cleanup-docs.js
│   ├── migrate-grid-to-content-only.js
│   └── plan-runner.js
├── src/                    # [901 files: 331 *.json, 251 *.ts, 150 *.tsx, ...]
│   ├── app/
│   │   ├── api/
│   │   │   ├── flows/
│   │   │   ├── google-ads/
│   │   │   ├── google-auth/
│   │   │   ├── local-screens/
│   │   │   ├── oauth2callback/
│   │   │   ├── screens/
│   │   │   │   ├── route.ts
│   │   │   │   └── [...path]/
│   │   │   │       └── route.ts
│   │   │   ├── search-console/
│   │   │   └── sites/
│   │   │       └── [domain]/
│   │   │           ├── brand/
│   │   │           ├── debug/
│   │   │           ├── normalized/
│   │   │           ├── onboarding/
│   │   │           ├── pages/
│   │   │           ├── schema/
│   │   │           ├── screen/
│   │   │           └── skins/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── apps-offline/
│   ├── behavior/
│   │   ├── behavior-engine.ts
│   │   ├── behavior-interactions.json
│   │   ├── behavior-navigations.json
│   │   ├── behavior-runner.ts
│   │   └── behavior-verb-resolver.ts
│   ├── compiler/
│   │   ├── applyVariantsToProducts.ts
│   │   ├── buildNormalizedModels.ts
│   │   ├── compileProducts.ts
│   │   ├── detectBaseModels.ts
│   │   ├── detectVariantDimensions.ts
│   │   ├── detectVariantPatterns.ts
│   │   ├── extractAttributes.ts
│   │   ├── groupProductsByModel.ts
│   │   ├── mapImagesToVariants.ts
│   │   └── mapVariantImages.ts
│   ├── compounds/
│   │   ├── schema/
│   │   └── ui/
│   │       ├── 12-molecules/
│   │       ├── definitions/
│   │       ├── BaseCompound.tsx
│   │       ├── ContentCompound.tsx
│   │       └── index.ts
│   ├── config/
│   ├── contracts/
│   │   ├── BLUEPRINT_UNIVERSE_CONTRACT.md
│   │   ├── CONTENT_DERIVATION_CONTRACT.md
│   │   ├── ENGINE_LAWS.md
│   │   ├── JSON_SCREEN_CONTRACT.json
│   │   ├── PARAM_KEY_MAPPING.md
│   │   ├── param-key-mapping.test.ts
│   │   └── showcase-visual-quality.test.ts
│   ├── content/
│   ├── cursor/
│   │   ├── layout/
│   │   │   ├── complete/
│   │   │   ├── inbox/
│   │   │   ├── planned/
│   │   │   ├── 1_organ-layout-plan.md
│   │   │   └── 2_LAYOUT_EVOLUTION_SYSTEM_PLAN.md
│   │   ├── logic/
│   │   ├── molecules/
│   │   ├── organs/
│   │   ├── MASTER_ROADMAP.md
│   │   └── RULES.md
│   ├── dev/
│   ├── diagnostics/
│   ├── docs/
│   │   ├── ARCHIVE_RECOVERED/
│   │   │   ├── docs/
│   │   │   └── docs_SYSTEM_MASTER/
│   │   ├── HI Vision Definitions/
│   │   ├── HI_SYSTEM/
│   │   └── SYSTEM_MASTER/
│   ├── engine/
│   │   ├── bridge/
│   │   ├── core/
│   │   │   ├── behavior-listener.ts
│   │   │   ├── collapse-layout-nodes.ts
│   │   │   ├── current-screen-tree-store.ts
│   │   │   ├── json-renderer.tsx
│   │   │   ├── layout-store.ts
│   │   │   ├── palette-resolver.ts
│   │   │   ├── palette-resolve-token.ts
│   │   │   ├── palette-store.ts
│   │   │   ├── registry.tsx
│   │   │   ├── screen-loader.ts
│   │   │   ├── site-loader.ts
│   │   │   ├── styler.tsx
│   │   │   ├── ui-state.ts
│   │   │   └── useUIState.ts
│   │   ├── loaders/
│   │   ├── maps/
│   │   ├── onboarding/
│   │   ├── runners/
│   │   ├── runtime/
│   │   ├── schedulers/
│   │   ├── selectors/
│   │   ├── site-runtime/
│   │   ├── system7/
│   │   └── types/
│   ├── KNOCKOUT/
│   ├── layout/
│   │   ├── compatibility/
│   │   ├── component/
│   │   ├── cursor/
│   │   ├── page/
│   │   ├── renderer/
│   │   ├── requirements/
│   │   │   ├── card-layout-requirements.json
│   │   │   ├── organ-internal-layout-requirements.json
│   │   │   ├── section-layout-requirements.json
│   │   │   └── SLOT_NAMES.md
│   │   └── resolver/
│   ├── layout-organ/
│   ├── lib/
│   │   ├── layout/
│   │   ├── site-compiler/
│   │   ├── site-renderer/
│   │   ├── site-skin/
│   │   ├── screens/
│   │   └── ...
│   ├── logic/
│   │   ├── actions/
│   │   ├── bridges/
│   │   ├── engine-system/
│   │   ├── engines/
│   │   ├── flow-runtime/
│   │   ├── runtime/
│   │   ├── ui-bindings/
│   │   └── ...
│   ├── organs/
│   ├── palettes/
│   ├── registry/
│   ├── scans/
│   ├── screens/
│   ├── scripts/
│   ├── state/
│   │   ├── organ-internal-layout-store.ts
│   │   ├── section-layout-preset-store.ts
│   │   ├── state-resolver.ts
│   │   ├── state-store.ts
│   │   └── state.ts
│   ├── styles/
│   ├── system/
│   ├── types/
│   ├── ui/
│   ├── ux/
│   └── web2extractor/
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── [root *.md reports: APPS_OFFLINE_SYSTEM_MAP, BLUEPRINT_QUICK_REFERENCE, CONTRACT_*, GLOBAL_*, MOLECULE_*, NAVIGATION_*, NORMALIZATION_*, PIPELINE_*, PRODUCT_*, SECTION_*, SITE_*, SYSTEM_*, UI_*, VISUAL_*, etc.]
```

## Doc folders (all identified)

| Folder | Purpose |
|--------|--------|
| **/** (repo root) | Root-level reports and plans (*.md) |
| **docs/** | MISSING at root — git status shows deleted `docs/` (was at repo root) |
| **src/docs/** | Live docs: ARCHIVE_RECOVERED, HI_SYSTEM, SYSTEM_MASTER, HI Vision Definitions |
| **src/definitions/** | DELETED (git status) — was legacy definitions .txt files |
| **src/cursor/** | Cursor plans: layout/, logic/, molecules/, organs/, MASTER_ROADMAP.md, RULES.md |
| **src/contracts/** | Contract docs: BLUEPRINT_*, CONTENT_*, ENGINE_LAWS, PARAM_KEY_MAPPING, etc. |
| **src/layout/requirements/** | SLOT_NAMES.md + requirement JSONs |
| **src/layout/cursor/** | Layout plan markdown |
| **.cursor/plans/** | Cursor plan files |
| **.idx/** | Legacy/indexer: airules.md, _Legacy_do_not_delete |

**Note:** Full flat file listing with `.next` and `node_modules` omitted is in `REPO_TREE_RAW.txt` (tree /F /A). Source-only listing in `REPO_SOURCE_TREE.txt`.
