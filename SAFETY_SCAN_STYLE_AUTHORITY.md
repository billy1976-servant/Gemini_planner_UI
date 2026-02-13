# Phase 5 — Safety Scan: Style Authority in TS/TSX

Scan for remaining style-related authority in TypeScript/TSX (excludes docs). Listed by file and line. **Do not auto-edit** — report only.

---

## Acceptable fallbacks (no change required)

These use `"default"` or `PRESETS.default` only as a **fallback when value is missing**. They do not list theme names or restrict which themes can exist.

| File | Line(s) | What | Note |
|------|---------|------|------|
| palette-store.ts | 29 | `palettes[name] ? name : "default"` | Fallback when palette name invalid. |
| visual-preset-resolver.ts | 27 | `PRESETS[resolvedName] ?? PRESETS.default` | Fallback when preset name missing. |
| page.tsx | 213 | `|| "default"` for paletteName | Fallback when state/store has no palette. |
| layout.tsx | 102 | Same | Same. |
| RightFloatingSidebar.tsx | 168 | Same | Same. |
| RightSidebarDock.tsx | 36 | Same | Same. |
| palette-bridge.tsx | 146, 157 | `paletteName === "default"` and `\|\| "default"` | Fallback for palette resolution. |
| card-preset-resolver.ts | 18 | `PRESETS[presetId] ?? PRESETS.default` | Card presets from JSON; fallback only. |

---

## Experience → preset fallback (could move to JSON later)

| File | Line(s) | What | Note |
|------|---------|------|------|
| visual-preset-resolver.ts | 12–16 | `EXPERIENCE_TO_PRESET = { app: "compact", website: "default", learning: "editorial" }` | Used when profile does not specify visualPreset; experience type picks a default preset. Could be moved to presentation-profiles.json (e.g. defaultVisualPreset per experience) in a future pass. Not a list of theme names; only default mapping. |

---

## UI dropdown lists (control dock)

These hardcode the **list of options** shown in the styling/behavior dropdowns. They do not prevent "apple" from being used if the user sets it via state or a template; they only limit what appears in the picker.

| File | Line(s) | What | Note |
|------|---------|------|------|
| RightFloatingSidebar.tsx | 65 | `STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft"]` | Styling preset dropdown options. "apple" is not in the list, so it cannot be selected from this UI until this list is extended or derived from visual-presets.json keys. |
| RightSidebarDockContent.tsx | 14 | Same | Same. |

To make "apple" selectable from the styling panel without editing TS, the UI would need to derive the list from the keys of visual-presets.json (e.g. pass preset names from the resolver or from a static import of the bundle keys). Not done in this pass per plan.

---

## Summary

- **No theme-specific branches** (no `if paletteName === "apple"` or similar).
- **No manual palette or visual-preset registration** in index/resolver (palettes from context, PRESETS from bundle).
- **Remaining:** (1) Fallbacks to `"default"` when name is missing — acceptable. (2) EXPERIENCE_TO_PRESET — optional to move to JSON later. (3) STYLING_PRESETS in control dock — limits dropdown only; "apple" can still be used via template or state.
