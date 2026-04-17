---
name: generic_vs_cc_platform_audit
overview: "Repo-grounded audit: there is no separate generic landing/slide-builder React module besides ContainerCreationsLandingRenderer; the cross-app generic layer is ExperienceRenderer + loadScreen + json-skin. Consolidation removed landing-2.tsx and wired everything to the CC-named renderer; a dormant bridge exists but is unwired."
todos:
  - id: neutral-wrapper-import
    content: Add neutral re-export/wrapper for landing deck renderer; switch app/landing-2 + tsx-screen-resolver to neutral path (no logic change).
    status: completed
  - id: generalize-deck-api
    content: Replace container-creations-landing-config single CONFIG_DIR with generic deck API + migration aliases (Phase 4).
    status: cancelled
  - id: optional-skin-merge
    content: Decide if convertLandingConfigToJsonSkin should unify wizard JSON with ExperienceRenderer; wire only after decision.
    status: cancelled
isProject: false
---

