# System Summary (Generated)

**Generated:** 2026-02-06T15:40:33.978Z

## Total file count
1211

## Runtime vs generated ratio
- Runtime (core + engines + layout + state + renderer + compiler + ingest + primitives + compounds + contracts): **216**
- Auto-generated docs: **68**
- Unknown / other: **927**

## Top 20 most central files
| Path | Centrality | Role |
|------|------------|------|
| `src/state/state-store.ts` | 27.0 | state |
| `src/lib/layout/molecule-layout-resolver.ts` | 17.0 | - |
| `src/logic/flows/flow-loader.ts` | 17.0 | - |
| `src/components/9-atoms/primitives/surface.tsx` | 15.5 | primitives |
| `src/engine/core/palette-resolver.ts` | 15.5 | engines |
| `src/engine/core/json-renderer.tsx` | 15.0 | engines |
| `src/lib/site-compiler/normalizeSiteData.ts` | 15.0 | - |
| `src/logic/runtime/engine-bridge.ts` | 15.0 | - |
| `src/engine/core/registry.tsx` | 14.5 | engines |
| `src/components/9-atoms/primitives/collection.tsx` | 13.5 | primitives |
| `src/components/9-atoms/primitives/sequence.tsx` | 13.5 | primitives |
| `src/components/9-atoms/primitives/text.tsx` | 13.5 | primitives |
| `src/app/page.tsx` | 12.5 | runtime_core |
| `src/lib/site-renderer/renderFromSchema.tsx` | 11.0 | - |
| `src/components/9-atoms/primitives/trigger.tsx` | 10.5 | primitives |
| `src/engine/core/layout-store.ts` | 10.5 | engines |
| `src/engine/core/palette-resolve-token.ts` | 10.5 | engines |
| `src/devtools/pipeline-debug-store.ts` | 10.0 | - |
| `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` | 9.5 | - |
| `src/engine/debug/pipelineStageTrace.ts` | 9.0 | engines |

## Suspected duplication zones (folders with most similar pairs)
- `src/organs`: 54 similar pair(s)
- `src/apps-offline`: 40 similar pair(s)
- `src/content`: 40 similar pair(s)
- `content/compiled`: 23 similar pair(s)
- `src/cursor`: 13 similar pair(s)
- `src/logic`: 12 similar pair(s)
- `src/screens`: 7 similar pair(s)
- `artifacts/pipeline-contract`: 3 similar pair(s)
- `src/engine`: 3 similar pair(s)
- `src/lib`: 2 similar pair(s)

## Suspected trunk candidates (state/layout/engine entry points)
- `src/state/state-store.ts` (state)
- `src/engine/core/palette-resolver.ts` (engines)
- `src/engine/core/json-renderer.tsx` (engines)
- `src/engine/core/registry.tsx` (engines)
- `src/app/page.tsx` (runtime_core)
- `src/engine/core/layout-store.ts` (engines)
- `src/engine/core/palette-resolve-token.ts` (engines)
- `src/engine/debug/pipelineStageTrace.ts` (engines)
- `src/engine/onboarding/OnboardingFlowRenderer.tsx` (engines)
- `src/engine/site-runtime/GeneratedSiteViewer.tsx` (engines)

## Risk areas (structural only)
- Large file: `.cursor/debug.log` (1144.7 KB)
- Large file: `content/compiled/sites/bendsoap-com/site.snapshot.json` (795.0 KB)
- Large file: `content/compiled/sites/gibson-com/report.final.json` (5603.0 KB)
- Large file: `content/compiled/sites/gibson-com/site.snapshot.json` (5561.2 KB)
- Large file: `public/manifests/apps-offline.txt` (212.8 KB)
- Large file: `public/manifests/components.txt` (104.6 KB)
- Large file: `public/manifests/content.txt` (75323.8 KB)
- Large file: `public/manifests/content1049.txt` (75322.3 KB)
- Large file: `public/manifests/cursor.txt` (545.7 KB)
- Large file: `public/manifests/cursor1044.txt` (125.9 KB)
