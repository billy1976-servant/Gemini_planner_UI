# Stage Width Clamp Removal — Report

## 1. Where stageMaxWidth existed

- **File:** [src/app/layout.tsx](src/app/layout.tsx)
- **Constants (removed):** Lines 25–27 — `STAGE_MAX_WIDTH_PHONE = 420`, `STAGE_MAX_WIDTH_TABLET = 768`, `STAGE_MAX_WIDTH_DESKTOP = 1100`.
- **Computed value (removed):** Lines 124–129 — `stageMaxWidth` derived from `devicePreviewMode` (phone → 420, tablet → 768, else 1100).
- **Usage (removed):** Line 503 — `json-stage` had `maxWidth: isOnboardingTsx ? "none" : \`min(100%, ${stageMaxWidth}px)\``, which clamped the stage to 420 / 768 / 1100px and blocked full-bleed.

Additional constraints removed:

- **Phone frame in layout.tsx:** The branch `phoneFrameEnabled ? ( ... 390px device frame ... ) : ( app-shell ... )` was removed. The editor always renders the same app-shell (full viewport); no separate 390px preview frame.
- **PreviewStage:** Phone, tablet, and phoneGrid modes that wrapped content in 390px / 768px / grid frames were removed. PreviewStage always renders a single full-width canvas; `data-device-mode` is set for breakpoint simulation only and does not change container width.

---

## 2. Files modified

| File | Change |
|------|--------|
| [src/app/layout.tsx](src/app/layout.tsx) | Removed `STAGE_MAX_WIDTH_*` and `stageMaxWidth`. `json-stage` now has `maxWidth: "none"` and `data-device-mode={devicePreviewMode}`. Removed phone-frame branch so content is always app-shell (full width). Content div set to `overflow: "auto"` so only CanvasArea scrolls. |
| [src/04_Presentation/components/stage/PreviewStage.tsx](src/04_Presentation/components/stage/PreviewStage.tsx) | Removed phone, tablet, and phoneGrid branches. Single full-viewport layout only; outer div has `data-device-mode={deviceMode}` for breakpoint simulation. Inner frame `maxWidth: "none"`. Removed unused `PHONE_FRAME_WIDTH`. |

---

## 3. Confirmation that full bleed works

- **json-stage:** Uses `width: "100%"`, `maxWidth: "none"`. No width clamp.
- **CanvasArea:** `flex: 1`, `minWidth: 0`, `overflow: "auto"`; renderer root can use full width.
- **JsonSkinEngine** (unchanged): For `params.containerLayout === "full"` the section wrapper has `width: "100%"`, `maxWidth: "none"`, `padding: 0`. Full-bleed sections reach viewport edges when the stage no longer clamps.
- **Pipeline:** Unchanged — loadScreen → composeOfflineScreen → ExperienceRenderer → JsonRenderer → JsonSkinEngine. No route bypass.
- **Editor vs production:** Same layout; no separate preview frame; device icons do not resize the container (device mode is data-only for simulation).

Full-bleed behavior is confirmed: with the stage clamp and device frames removed, schema-driven `containerLayout: "full"` sections render at full viewport width in both editor and production.
