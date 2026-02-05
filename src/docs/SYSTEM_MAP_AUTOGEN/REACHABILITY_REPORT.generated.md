# Reachability Report (Generated)

Module-level reachability from app entrypoints. **REACHABLE** = reachable from seed set; **UNREACHABLE** = not reachable.

**Seed entrypoints:** src/app/page.tsx, src/app/layout.tsx, src/engine/core/json-renderer.tsx, src/engine/core/behavior-listener.ts, src/engine/core/screen-loader.ts, src/state/state-store.ts, src/layout/index.ts, src/logic/runtime/runtime-verb-interpreter.ts

**Generated:** 2026-02-04T21:24:20.462Z

---

## Summary

| Status       | Count |
|-------------|-------|
| REACHABLE   | 55 |
| UNREACHABLE | 451 |

---

## REACHABLE modules (by folder)

### `src/app/`

- `src/app/layout.tsx`
- `src/app/page.tsx`

### `src/behavior/`

- `src/behavior/behavior-runner.ts`

### `src/compounds/ui/`

- `src/compounds/ui/index.ts`

### `src/dev/`

- `src/dev/section-layout-dropdown.tsx`

### `src/engine/core/`

- `src/engine/core/behavior-listener.ts`
- `src/engine/core/collapse-layout-nodes.ts`
- `src/engine/core/current-screen-tree-store.ts`
- `src/engine/core/json-renderer.tsx`
- `src/engine/core/layout-store.ts`
- `src/engine/core/palette-store.ts`
- `src/engine/core/screen-loader.ts`

### `src/engine/devtools/`

- `src/engine/devtools/runtime-decision-trace.ts`

### `src/layout/`

- `src/layout/index.ts`

### `src/layout-organ/`

- `src/layout-organ/index.ts`

### `src/lib/layout/`

- `src/lib/layout/card-layout-presets.ts`
- `src/lib/layout/card-preset-resolver.ts`
- `src/lib/layout/layout-schema.json.ts`
- `src/lib/layout/molecule-layout-resolver.ts`
- `src/lib/layout/profile-resolver.ts`
- `src/lib/layout/save-current-as-template.ts`
- `src/lib/layout/spacing-scale-resolver.ts`
- `src/lib/layout/template-profiles.ts`
- `src/lib/layout/visual-preset-resolver.ts`

### `src/lib/layout/definitions-molecule/`

- `src/lib/layout/definitions-molecule/layout-column.json.ts`
- `src/lib/layout/definitions-molecule/layout-grid.json.ts`
- `src/lib/layout/definitions-molecule/layout-row.json.ts`
- `src/lib/layout/definitions-molecule/layout-stacked.json.ts`

### `src/lib/layout/layout-engine/`

- `src/lib/layout/layout-engine/region-policy.ts`

### `src/lib/layout/presentation/`

- `src/lib/layout/presentation/app.profile.json.ts`
- `src/lib/layout/presentation/learning.profile.json.ts`
- `src/lib/layout/presentation/website.profile.json.ts`

### `src/lib/screens/`

- `src/lib/screens/compose-offline-screen.ts`

### `src/lib/site-renderer/`

- `src/lib/site-renderer/palette-bridge.tsx`

### `src/lib/site-skin/`

- `src/lib/site-skin/siteSkin.types.ts`

### `src/lib/site-skin/shells/`

- `src/lib/site-skin/shells/AppShell.tsx`
- `src/lib/site-skin/shells/LearningShell.tsx`
- `src/lib/site-skin/shells/WebsiteShell.tsx`

### `src/logic/bridges/`

- `src/logic/bridges/skinBindings.apply.ts`

### `src/logic/content/`

- `src/logic/content/content-resolver.ts`

### `src/logic/engines/`

- `src/logic/engines/Onboarding-flow-router.tsx`
- `src/logic/engines/json-skin.engine.tsx`

### `src/logic/runtime/`

- `src/logic/runtime/engine-bridge.ts`
- `src/logic/runtime/interaction-controller.ts`
- `src/logic/runtime/landing-page-resolver.ts`
- `src/logic/runtime/runtime-verb-interpreter.ts`

### `src/organs/`

- `src/organs/OrganPanel.tsx`
- `src/organs/organ-registry.ts`
- `src/organs/resolve-organs.ts`

### `src/palettes/`

- `src/palettes/default.json.ts`
- `src/palettes/index.ts`

### `src/state/`

- `src/state/organ-internal-layout-store.ts`
- `src/state/section-layout-preset-store.ts`
- `src/state/state-store.ts`

### `src/styles/`

- `src/styles/site-theme.css.ts`

---

## UNREACHABLE modules

For each: file path, first break (nearest reachable parent that does not import it, or direct importers if all unreachable), and short reason.

### `src/app/api/flows/[flowId]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/flows/list/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-ads/campaigns/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-ads/client.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-ads/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-ads/validate/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-auth/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/google-trends (later)/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/local-screens/[...path]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/oauth2callback/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/screens/[...path]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/screens/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/search-console/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/brand/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/debug/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/normalized/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/onboarding/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/pages/[pageId]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/pages/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/schema/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/screen/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/skins/[pageId]/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/[domain]/skins/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/api/sites/list/route.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/sites/[domain]/not-found.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/app/sites/[domain]/page.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/apps-offline/apps/Onboarding/trial.json.ts`

- **First break:** `src/screens/tsx-screens/onboarding/json-skin.tsx`, `src/screens/tsx-screens/onboarding/premium-onboarding.tsx`, `src/screens/tsx-screens/onboarding/trial.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/apps-offline/apps/behavior-tests/A-to-D-Test.json.ts`

- **First break:** `src/screens/tsx-screens/onboarding/json-skin.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/apps-offline/apps/journal_track/app-1.json.ts`

- **First break:** `src/contracts/param-key-mapping.test.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/apps-offline/apps/new-blueprint-test/app-1.json.ts`

- **First break:** `src/screens/tsx-screens/onboarding/json-skin.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/apps-offline/apps/websites/demo-blueprint-site/verify-app-organs.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/apps-offline/apps/websites/showcase/showcase-home.json.ts`

- **First break:** `src/contracts/showcase-visual-quality.test.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/behavior/behavior-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/behavior/behavior-listerner.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/behavior/behavior-verb-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compiler/applyVariantsToProducts.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compiler/buildNormalizedModels.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/compileProducts.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compiler/detectBaseModels.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/detectVariantDimensions.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/detectVariantPatterns.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compiler/extractAttributes.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/groupProductsByModel.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/mapImagesToVariants.ts`

- **First break:** `src/lib/site-compiler/normalizeSiteData.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compiler/mapVariantImages.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/9-atoms/engine/atom-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/9-atoms/engine/ui-global-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/9-atoms/engine/ux-global-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/9-atoms/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/9-atoms/primitives/collection.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/condition.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/field.tsx`

- **First break:** `src/compounds/ui/12-molecules/field.compound.tsx`, `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/media.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`, `src/compounds/ui/12-molecules/chip.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/sequence.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/shell.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/surface.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/text.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/9-atoms/primitives/trigger.tsx`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/BadgeSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/CalculatorSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/CategoryGridSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/ComparisonSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/Footer.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderPage.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/HeroSection.tsx`

- **First break:** `src/engine/bridge/WebsiteBlockRenderer.tsx`, `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/ImageSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/ListSection.tsx`

- **First break:** `src/engine/bridge/WebsiteBlockRenderer.tsx`, `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/NavBar.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderPage.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/PageContainer.tsx`

- **First break:** `src/engine/site-runtime/GeneratedSiteViewer.tsx`, `src/lib/site-renderer/renderPage.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/ProductGridSection.tsx`

- **First break:** `src/engine/bridge/WebsiteBlockRenderer.tsx`, `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/RecommendationSection.tsx`

- **First break:** `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/site/TextSection.tsx`

- **First break:** `src/engine/bridge/WebsiteBlockRenderer.tsx`, `src/lib/site-renderer/renderFromSchema.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/CTASection.tsx`

- **First break:** `src/screens/core/ScreenRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/ContentSection.tsx`

- **First break:** `src/screens/core/ScreenRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/HeroSection.tsx`

- **First break:** `src/screens/core/ScreenRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/ProductGrid.tsx`

- **First break:** `src/screens/core/ScreenRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/SiteLayout.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/components/siteRenderer/SiteRenderer.tsx`

- **First break:** `src/app/sites/[domain]/page.tsx`, `src/screens/generated-websites/gibson/CompiledSiteViewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/siteRenderer/ValueSection.tsx`

- **First break:** `src/screens/core/ScreenRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/components/system/app-loader.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compounds/ui/12-molecules/avatar.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/button.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/card.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/chip.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/field.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/footer.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/list.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/modal.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/navigation.compound.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compounds/ui/12-molecules/pricing-table.compound.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compounds/ui/12-molecules/section.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/stepper.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/toast.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/12-molecules/toolbar.compound.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/compounds/ui/BaseCompound.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compounds/ui/ContentCompound.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/compounds/ui/definitions/registry.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/content/content-map.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/content/content-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/content/sites/containercreations.com/compiled/skins/organ-test.skin.json.ts`

- **First break:** `src/organs/organs.layer1.test.ts`, `src/organs/organs.layer2.test.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/contracts/param-key-mapping.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/contracts/showcase-visual-quality.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/devtools/runtime-trace-viewer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/diagnostics/diagnostics.provider.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/diagnostics/engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/diagnostics/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/bridge/WebsiteBlockRenderer.tsx`

- **First break:** `src/engine/onboarding/OnboardingFlowRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/core/global-scan.engine.ts`

- **First break:** `src/state/global-scan.state-bridge.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/core/palette-resolve-token.ts`

- **First break:** `src/components/9-atoms/primitives/collection.tsx`, `src/components/9-atoms/primitives/field.tsx`, `src/components/9-atoms/primitives/sequence.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/core/palette-resolver.ts`

- **First break:** `src/compounds/ui/12-molecules/avatar.compound.tsx`, `src/compounds/ui/12-molecules/button.compound.tsx`, `src/compounds/ui/12-molecules/card.compound.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/core/registry.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/core/site-loader.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/core/styler.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/core/ui-state.ts`

- **First break:** `src/behavior/behavior-engine.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/core/useUIState.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/loaders/theme-loader.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/loaders/ui-loader.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/loaders/ux-loader.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/onboarding/IntegrationFlowEngine.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/onboarding/OnboardingFlowRenderer.tsx`

- **First break:** `src/screens/generated-websites/containercreations.com/OnboardingGeneratedScreen.tsx`, `src/screens/generated-websites/_template_OnboardingGeneratedScreen.tsx`, `src/screens/SiteOnboardingScreen.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/runners/engine-runner.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/runtime/runtime-navigation.ts`

- **First break:** `src/engine/runtime/runtime-verb-interpreter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/runtime/runtime-verb-interpreter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/schedulers/scan-scheduler.ts`

- **First break:** `src/screens/tsx-screens/global-scans/ScanDashboard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/selectors/global-scan-snapshot.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/selectors/global-scan-time-window-reducer.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/selectors/global-scan-time-window-viewer.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/selectors/select-global-scan-time-window.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/selectors/select-global-window-by-source.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/selectors/select-global-window.ts`

- **First break:** `src/screens/tsx-screens/global-scans/ScanDashboard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/site-runtime/GeneratedSiteViewer.tsx`

- **First break:** `src/screens/generated-websites/containercreations.com/SiteGeneratedScreen.tsx`, `src/screens/generated-websites/_template_SiteGeneratedScreen.tsx`, `src/screens/SiteViewerScreen.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/engine/system7/channels/content.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/environment.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/identity.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/media.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/parameters.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/style.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/channels/timeline.channel.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/content.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/environment.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/identity.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/media.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/parameters.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/style.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/definitions/timeline.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/audio.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/camera.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/device.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/lidar.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/location.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/sensors/screen.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/system7-router.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/system7/system7.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/engine/types/ui-node.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout-organ/organ-layout-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/compatibility/compatibility-evaluator.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/compatibility/content-capability-extractor.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/compatibility/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/compatibility/requirement-registry.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/component/component-layout-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/component/index.ts`

- **First break:** `src/layout/resolver/layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/page/capabilities.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/page/index.ts`

- **First break:** `src/layout/resolver/layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/page/page-layout-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/page/section-helpers.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/renderer/LayoutMoleculeRenderer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/layout/requirements/card-layout-requirements.json.ts`

- **First break:** `src/layout/compatibility/requirement-registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/requirements/organ-internal-layout-requirements.json.ts`

- **First break:** `src/layout/compatibility/requirement-registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/requirements/section-layout-requirements.json.ts`

- **First break:** `src/layout/compatibility/requirement-registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/resolver/index.ts`

- **First break:** `src/layout/renderer/LayoutMoleculeRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/layout/resolver/layout-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/component-sliders.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/layout/definitions-screen/column.json.ts`

- **First break:** `src/lib/layout/screen-layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/definitions-screen/grid.json.ts`

- **First break:** `src/lib/layout/screen-layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/definitions-screen/page.json.ts`

- **First break:** `src/lib/layout/screen-layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/definitions-screen/row.json.ts`

- **First break:** `src/lib/layout/screen-layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/definitions-screen/stack.json.ts`

- **First break:** `src/lib/layout/screen-layout-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/layout/layout-dropdown.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/layout/layout-engine/composeScreen.ts`

- **First break:** `src/lib/site-skin/SiteSkin.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/molecules/column-layout.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/molecules/grid-layout.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/molecules/page-layout.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/molecules/row-layout.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/molecules/stack-layout.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/layout/screen-layout-resolver.ts`

- **First break:** `src/lib/site-renderer/layout-bridge.tsx`, `src/lib/site-renderer/renderFromSchema.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/media/bestImage.ts`

- **First break:** `src/components/site/ProductGridSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/product-screen-adapter/compileProductDataToScreen.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/product-screen-adapter/index.ts`

- **First break:** `src/scripts/compile-product-screen.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/product-screen-adapter/types.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-compiler/compileSiteToSchema.ts`

- **First break:** `src/app/api/sites/[domain]/debug/route.ts`, `src/scripts/websites/build-site.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-compiler/compileSiteToScreenModel.ts`

- **First break:** `src/app/api/sites/[domain]/screen/route.ts`, `src/lib/site-renderer/renderPage.tsx`, `src/lib/site-renderer/renderSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-compiler/normalizeSiteData.ts`

- **First break:** `src/app/api/sites/[domain]/debug/route.ts`, `src/components/site/CategoryGridSection.tsx`, `src/engine/bridge/WebsiteBlockRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-engines/applyEngineOverlays.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-normalizer/derivePages.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-normalizer/derivePagesFromNav.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-renderer/layout-bridge.tsx`

- **First break:** `src/engine/site-runtime/GeneratedSiteViewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-renderer/renderFromSchema.tsx`

- **First break:** `src/components/site/CategoryGridSection.tsx`, `src/engine/site-runtime/GeneratedSiteViewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-renderer/renderPage.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-renderer/renderSection.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-schema/siteLayout.types.ts`

- **First break:** `src/components/site/CategoryGridSection.tsx`, `src/components/site/RecommendationSection.tsx`, `src/engine/site-runtime/GeneratedSiteViewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-skin/SiteSkin.tsx`

- **First break:** `src/screens/tsx-screens/site-skin/OnboardingSkinPreviewScreen.tsx`, `src/screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-skin/compileSkinFromBlueprint.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/site-skin/loadSiteSkin.ts`

- **First break:** `src/lib/site-skin/SiteSkin.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-skin/mappers/productToMoleculeNodes.ts`

- **First break:** `src/lib/product-screen-adapter/compileProductDataToScreen.ts`, `src/lib/site-skin/mappers/siteDataToSlots.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-skin/mappers/siteDataToSlots.ts`

- **First break:** `src/logic/bridges/engineToSkin.bridge.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/site-skin/shells/RegionDebugOverlay.tsx`

- **First break:** `src/lib/site-skin/SiteSkin.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/siteCompiler/compileSite.ts`

- **First break:** `src/app/sites/[domain]/page.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/siteCompiler/index.ts`

- **First break:** `src/app/api/sites/[domain]/route.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/lib/siteCompiler/loaders.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/siteCompiler/normalize.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/lib/siteCompiler/types.ts`

- **First break:** `src/components/siteRenderer/ContentSection.tsx`, `src/components/siteRenderer/CTASection.tsx`, `src/components/siteRenderer/HeroSection.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/actions/resolve-onboarding.action.ts`

- **First break:** `src/logic/runtime/action-registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/actions/run-calculator.action.ts`

- **First break:** `src/logic/runtime/action-registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/bridges/engineToSkin.bridge.ts`

- **First break:** `src/screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/config/business-profiles.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/content/compiled-report-loader.ts`

- **First break:** `src/app/api/sites/[domain]/onboarding/route.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/content/content-map.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/content/education-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/content/education.flow.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/content/flows/flow-a.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/content/flows/flow-b.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/content/flows/flow-c.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/content/flows/flow-with-meta.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/content/flows/test-flow.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/controllers/control-flow.ts`

- **First break:** `src/screens/tsx-screens/google-ads/google-ads-dashboard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/controllers/control-registry.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/controllers/google-ads.controller.ts`

- **First break:** `src/app/api/google-ads/validate/route.ts`, `src/screens/tsx-screens/google-ads/google-ads-dashboard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engine-system/engine-explain.ts`

- **First break:** `src/logic/ui-bindings/engine-viewer.tsx`, `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`, `src/screens/tsx-screens/onboarding/engine-viewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engine-system/engine-registry.ts`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/logic/flow-runtime/FlowRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/25x.engine.ts`

- **First break:** `src/logic/runtime/action-registry.ts`, `src/screens/tsx-screens/global-scans/25x-Onboarding.Test.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/abc.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/calculator/calcs/calc-registry.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/calculator/calcs/long-term-exposure.calculator.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/calculator/calcs/product-calculator.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`, `src/screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/calculator/calcs/types.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/calculator/calculator-types/profit.calculator.json.ts`

- **First break:** `src/logic/registries/calculator.registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/calculator/calculator-types/simple-hours.json.ts`

- **First break:** `src/logic/registries/calculator.registry.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/calculator/calculator.engine.ts`

- **First break:** `src/logic/actions/run-calculator.action.ts`, `src/logic/engines/calculator/calculator.module.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/calculator/calculator.module.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/comparison/value-comparison.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/comparison/value-dimensions.ts`

- **First break:** `src/scripts/websites/adapters/value-translation-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/comparison/value-translation.engine.ts`

- **First break:** `src/scripts/websites/adapters/value-translation-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/decision-engine.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/decision/decision-types.ts`

- **First break:** `src/logic/engines/post-processing/hi-engine-runner.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/decision/decision.engine.ts`

- **First break:** `src/logic/engines/post-processing/hi-engine-runner.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/flow-router.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/learning.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/next-step-reason.ts`

- **First break:** `src/logic/ui-bindings/engine-viewer.tsx`, `src/screens/tsx-screens/onboarding/engine-viewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/post-processing/hi-engine-runner.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/presentation-types.ts`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/logic/flow-runtime/FlowRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/shared/engine-selector.ts`

- **First break:** `src/logic/engines/post-processing/hi-engine-runner.ts`, `src/logic/flow-runtime/FlowRenderer.tsx`, `src/logic/ui-bindings/engine-viewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/engines/summary/export-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/engines/summary/summary.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/executors/google-ads.executor.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/flow-runtime/FlowRenderer.tsx`

- **First break:** `src/screens/tsx-screens/Gibson_Guitars/Gibson_Landing.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/flows/flow-definitions.ts`

- **First break:** `src/logic/runtime/flow-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/flows/flow-loader.ts`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/logic/engine-system/engine-explain.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/modules/25x-sample.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/onboarding-engines/abc.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/onboarding-engines/calculator.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/onboarding-engines/learning.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/onboarding-engines/summary.engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/orchestration/Onboarding-flow-router.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/orchestration/integration-flow-engine.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/orchestration/next-step-reason.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/compare.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/export-pdf.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/external-reference-config.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/external-references.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/ExternalReferenceCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/extractors/extract-category.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/extractors/extract-product.ts`

- **First break:** `src/scripts/websites/adapters/normalize-adapter.ts`, `src/scripts/websites/adapters/scan-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/extractors/fetch-html.ts`

- **First break:** `src/scripts/websites/adapters/normalize-adapter.ts`, `src/scripts/websites/adapters/scan-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/extractors/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/extractors/parse-jsonld.ts`

- **First break:** `src/scripts/websites/adapters/scan-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/products/product-normalizer.ts`

- **First break:** `src/scripts/websites/adapters/normalize-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/product-repository.ts`

- **First break:** `src/app/api/sites/[domain]/onboarding/route.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/products/product-types.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/ComparisonCard.tsx`, `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`, `src/screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/registries/calculator.registry.ts`

- **First break:** `src/logic/actions/run-calculator.action.ts`, `src/logic/engines/calculator/calculator.module.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/research/research-collectors.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/research/research-fact-library.ts`

- **First break:** `src/scripts/websites/adapters/research-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/runtime/action-registry.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/runtime/action-runner.ts`

- **First break:** `src/screens/tsx-screens/onboarding/cards/CalculatorCard.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/runtime/calc-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/runtime/engine-runtime-provider.tsx`

- **First break:** `src/logic/flow-runtime/FlowRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/runtime/engine-state.ts`

- **First break:** `src/logic/engines/post-processing/hi-engine-runner.ts`, `src/logic/flow-runtime/FlowRenderer.tsx`, `src/logic/ui-bindings/engine-viewer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/runtime/flow-resolver.ts`

- **First break:** `src/logic/actions/resolve-onboarding.action.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/runtime/view-resolver.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/ui-bindings/calculatorUI.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/ui-bindings/engine-viewer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/value/assumption-library.ts`

- **First break:** `src/scripts/websites/adapters/research-adapter.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/logic/value/validation-guardrails.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/logic/value/value-annotation.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/map (old)/engine/content-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/map (old)/engine/live-content-generator.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/map (old)/engine/live-map-builder.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/map (old)/engine/map-blueprint-parser.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/map (old)/engine/map-engine.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer1.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer2.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer3.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer4.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer5.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer6.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/organs.layer7.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/organs/validate-variants.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/registry/atoms.json.ts`

- **First break:** `src/engine/core/styler.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/registry/molecules.json.ts`

- **First break:** `src/engine/core/styler.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/registry/palettes.json.ts`

- **First break:** `src/engine/core/styler.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/scans/global-scans/global-scan.analyzer.ts`

- **First break:** `src/screens/tsx-screens/global-scans/GlobalSystemProbe.tsx`, `src/state/global-scan.state-bridge.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/scans/global-scans/global-scan.config.json.ts`

- **First break:** `src/engine/schedulers/scan-scheduler.ts`, `src/screens/tsx-screens/global-scans/GlobalSystemProbe.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/scans/global-scans/global-scan.sources.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scans/global-scans/global-scan.test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scans/global-scans/providers/google-ads.provider.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scans/global-scans/providers/google-trends.provider.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scans/global-scans/types.ts`

- **First break:** `src/logic/controllers/control-flow.ts`, `src/logic/controllers/control-registry.ts`, `src/logic/controllers/google-ads.controller.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/SiteOnboardingScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/SiteViewerScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/SitesDirectoryScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/core/ScreenRenderer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/generated-websites/_template_OnboardingGeneratedScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/generated-websites/_template_SiteGeneratedScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/generated-websites/containercreations.com/OnboardingGeneratedScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/generated-websites/containercreations.com/SiteGeneratedScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/generated-websites/gibson/CompiledSiteViewer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/Gibson_Guitars/Gibson_Landing.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/Gibson_Guitars/generated.flow-Gibson.json.ts`

- **First break:** `src/logic/flows/flow-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/calculators/Education-flow.tsx`

- **First break:** `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-2.tsx`, `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-3.tsx`, `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-5.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/calculators/calculator-1.tsx`

- **First break:** `src/screens/tsx-screens/calculators/pricing-jump-flow.tsx`, `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-2.tsx`, `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-3.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/calculators/pricing-jump-flow.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/control-json/tsx-proof.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/flows-cleanup-CO/calculator.tsx`

- **First break:** `src/screens/tsx-screens/flows-cleanup-CO/premiumOnboarding-TSX2.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/flows-cleanup-CO/education.tsx`

- **First break:** `src/screens/tsx-screens/flows-cleanup-CO/premiumOnboarding-TSX2.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/flows-cleanup-CO/premiumOnboarding-TSX2.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/25x-Onboarding.Test.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/GlobalSystemProbe.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/ScanDashboard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/charts/LineChart.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/MomentumTimeline.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/ScoreTimeline.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/SnapshotTable.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/SourceBreakdown.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/StabilityMatrix.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/panels/SystemDirective.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/providers/google-ads.provider.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/selectors/UseGlobalWindow.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/test-google-ads.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/global-scans/types.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/google-ads/google-ads-dashboard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/OnboardingEngine.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/OnboardingEngineV3.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/OnboardingEnginev2.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/OnboardingSkin.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/ambiant-assistant.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/beautiful-skin.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/CalculatorCard.tsx`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/screens/tsx-screens/onboarding/integration-flow-engine.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/onboarding/cards/ComparisonCard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/logic/flow-runtime/FlowRenderer.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/ExternalReferenceCard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/ProductCard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/cards/SummaryCard.tsx`

- **First break:** `src/engine/onboarding/IntegrationFlowEngine.tsx`, `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/screens/tsx-screens/onboarding/integration-flow-engine.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/screens/tsx-screens/onboarding/cards/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/engine-viewer.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/executive-dashboard.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/guided-story.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/integration-flow-engine.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/json-skin.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/kid-emotion-mode.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/legacy/IntegrationFlowEngine.legacy.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-2.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-3.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-4.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-5.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-6.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx-7.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding-tsx.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/premium-onboarding.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/system-xray.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/trial.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/onboarding/tscController.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/site-skin/OnboardingSkinPreviewScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/site-skin/SiteSkinPreviewScreen.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/sites/SiteIndex.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/skins/beautiful-skin.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/screens/tsx-screens/skins/json-skin.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/blueprint.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/compile-product-screen.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/contract-report.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/contract-validate.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/docs/generate-reachability-report.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/generate-allfiles.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/generate-schema.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/global-scan.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/logic-compiler/blueprint.schema.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/logic-compiler/compile.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/logic-compiler/emit-flow.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/logic/compile.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/merge-manifests-old.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/onboarding/build-onboarding.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/onboarding/logic.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/pipeline-proof.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/proof-runs/run-bend-soap-proof.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/proof-runs/run-gibson-proof.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/regenerate-gibson-products-full.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/regenerate-gibson-products.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/run-chain-test.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/run-diagnostics.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/adapters/normalize-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/adapters/research-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/adapters/scan-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/adapters/value-translation-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/build-site.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/compile-website.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/scripts/websites/compile.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/state/global-scan.state-bridge.ts`

- **First break:** `src/engine/schedulers/scan-scheduler.ts`, `src/scripts/global-scan.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/state/logic-interaction.reducer.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/state/persistence-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/state/state-adapter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/state/state-resolver.ts`

- **First break:** `src/engine/selectors/global-scan-time-window-viewer.ts`, `src/logic/actions/resolve-onboarding.action.ts`, `src/logic/runtime/flow-resolver.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/state/state.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/state/view-store.ts`

- **First break:** `src/ui/experience-dropdown.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/state/views.ts`

- **First break:** `src/ui/experience-dropdown.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/system/contracts/SystemContract.ts`

- **First break:** `src/logic/engine-system/engine-registry.ts`, `src/logic/engines/decision/decision-types.ts`, `src/logic/engines/presentation-types.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/types/site.types.ts`

- **First break:** `src/engine/core/site-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/types/siteSchema.ts`

- **First break:** `src/components/site/CategoryGridSection.tsx`, `src/engine/site-runtime/GeneratedSiteViewer.tsx`, `src/lib/site-compiler/compileSiteToSchema.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/cultures.json.ts`

- **First break:** `src/engine/loaders/ui-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/definitions/ui-scale-ranges.json.ts`

- **First break:** `src/components/9-atoms/engine/ui-global-engine.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/engine/ui-presets.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/ui/engine/ui-scale-converter.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/ui/experience-dropdown.tsx`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/ui/global-styles/google.json.ts`

- **First break:** `src/components/9-atoms/engine/ui-global-engine.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/index.json.ts`

- **First break:** `src/engine/loaders/ui-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/intensity.json.ts`

- **First break:** `src/engine/loaders/ui-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/molecules/JournalHistory.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/motion.json.ts`

- **First break:** `src/engine/loaders/ui-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/user-input-viewer.tsx`

- **First break:** `src/engine/core/registry.tsx`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/ux/driver.json.ts`

- **First break:** `src/engine/loaders/ux-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/ux/modes.json.ts`

- **First break:** `src/engine/loaders/ux-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ui/ux/ux.json.ts`

- **First break:** `src/engine/loaders/ux-loader.ts`
- **Why unreachable:** Only imported by other unreachable modules.

### `src/ux/engine/apply-ux-styles.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/ux/index.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/buildProductCatalog.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/compile2.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/crawler.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/extractor.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/normalizer.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

### `src/web2extractor/types.ts`

- **First break:** (no importers)
- **Why unreachable:** Never imported by any module.

