# Template Layout System — Upgrade or Not (Your Comments vs Plan)

**Classification:** REFERENCE — Template upgrade evaluation; primary architecture reference: docs/SYSTEM_MASTER/

## Verdict: Upgrade

Your refined spec is an upgrade in clarity and correctness. It does not change the architecture; it tightens the contract and the executable steps.

## What improved

1. **Explicit "do not touch"** — Listing palette, behavior, state, screen JSON, renderer logic as out-of-scope makes the boundary clear and avoids accidental changes.
2. **Explicit effectiveProfile merge** — Spelling out the ternary in Step 3 removes ambiguity; no need to "modify composeOfflineScreen" or JsonRenderer.
3. **Naming** — `getTemplateList()` is clearer than `getTemplateIds()` for dropdown options (id + label).
4. **Types** — `sections: Record<string, LayoutDef>` is more flexible than optional keys per role; same shape, easier to extend (e.g. gallery, testimonials) without changing the type.
5. **Success test** — "Hero alignment, section spacing, grid vs stacked, visual density" + "Palette only colors/fonts" is a concrete verification checklist.

## Suggestions (optional next steps)

1. **Deep-link template** — Support `?template=startup-split-hero` in layout.tsx (similar to `?experience=app`) so links can open with a specific template.
2. **"Use experience layout" option** — If you want a "no template" mode, add a template id (e.g. `experience-default`) that returns `null` from `getTemplateProfile` so `effectiveProfile` falls back to `experienceProfile`; or have that template mirror the current experience profile.
3. **Template list from JSON** — If you later want non-developers to add templates, move the template array to a JSON file and load it in template-profiles.ts; keep types and getters in TS.
4. **Flow / section order** — If you later want templates to control section order or reading flow, add optional `sectionOrder?: string[]` or `defaults.readingFlow` to `TemplateProfile` and merge into effectiveProfile.defaults where the shell or renderer reads it.
