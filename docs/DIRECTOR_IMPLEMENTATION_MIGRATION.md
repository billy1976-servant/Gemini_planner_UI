# Director implementation — migration notes

## File changes

### New files
- `src/lib/director/primitive-registry.ts` — 25 primitives, types, getDefaultDirectorProps
- `src/lib/director/director-types.ts` — AppSchema, ModeProfileConfig, DirectorContextValue, Archetype
- `src/lib/director/DirectorContext.tsx` — React context and useDirector / useDirectorProps
- `src/lib/director/AppShellDirector.tsx` — Stateless resolver: reads state + config, provides directorProps via context
- `src/lib/director/index.ts` — Public exports
- `src/lib/director/DIRECTOR_CONTRACT.md` — Director contract
- `src/config/mode-profiles.json` — google, child, adult, business (envelope + visual/interaction/behavior/density/safety)
- `src/config/experience-visibility.json` — experience → strategy (renderAll, dashboard, step, maxDepth)
- `docs/DIRECTOR_IMPLEMENTATION_MIGRATION.md` — This file

### Modified files
- `src/app/page.tsx` — TSX branch wrapped in AppShellDirector
- `src/lib/tsx-structure/TSXScreenWithEnvelope.tsx` — useDirector(); getDefaultTsxEnvelopeProfile(screenPath, experience, profileName)
- `src/lib/tsx-structure/getDefaultTsxEnvelopeProfile.ts` — Optional profileName; config lookup from mode-profiles.json envelope
- `src/03_Runtime/engine/core/experience-visibility.ts` — Config-driven strategies from experience-visibility.json; no switch on experience string

### Unchanged (per constraints)
- state-store, state-resolver, behavior-listener, layout-store, action-runner, runtime-verb-interpreter, palette-store, event log

## Primitive registry (25)

| Key | Type | Default |
|-----|------|---------|
| visibility | boolean | true |
| disabled | boolean | false |
| variant | enum | "default" |
| layoutDensity | enum | "normal" |
| buttonMode | enum | "primary" |
| sliderEnable | boolean | false |
| numericInputMode | boolean | false |
| modalEnable | boolean | true |
| tooltipEnable | boolean | true |
| stepSequenceMode | boolean | false |
| collectionMode | enum | "list" |
| cardMode | enum | "default" |
| presentationMode | boolean | false |
| dragEnable | boolean | false |
| inlineEditEnable | boolean | false |
| readOnlyMode | boolean | false |
| compactMode | boolean | false |
| advancedToggle | boolean | false |
| roleBasedAccess | boolean | true |
| animationLevel | enum | "full" |
| feedbackLevel | enum | "full" |
| paletteOverride | enum | "default" |
| typographyOverride | enum | "default" |
| interactionStrictness | enum | "standard" |
| loggingVerbosity | enum | "normal" |

## Setting profileName

Director defaults to `profileName === "adult"` when `state.values.profileName` is missing. To switch mode, dispatch:

```ts
dispatchState("state.update", { key: "profileName", value: "child" });
```

No changes to state-resolver were required; `values` already accepts arbitrary keys.

## Experience visibility

Visibility is now driven by `src/config/experience-visibility.json`. Each experience maps to a strategy: `renderAll`, `dashboard`, `step`, `maxDepth`. Add or change experiences by editing the JSON only.
