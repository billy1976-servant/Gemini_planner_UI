# OSB Shell Integration Plan

**Document type:** Design only. Describes how the center FAB becomes OSB and how the launcher adapts. No implementation.

---

## 1. Goal

- **Center FAB** = primary life input = open OSB (smart capture modal).
- **Launcher** = one place to open OSB; nav links (Journal, Learn, Apps, etc.) remain available without competing with the primary tap.

---

## 2. Current Shell Layout (Reference)

**GlobalAppSkin.tsx (BottomNavOnly):**

- **Left strip:** person, people (Me, Others).
- **Center:** Orange launcher button (2/3 FAB size). Currently: onClick closes dropdown and **navigates to Play** (NAV_TARGET_BY_ICON["play"]). A dropdown (Journal, Learn, Apps, Diagnostics, Home) is rendered when `launcherOpen` is true; in the file there is no handler that sets `launcherOpen` to true (only false on click), so the dropdown may be inert or controlled elsewhere.
- **Right strip:** build, tools (Build, Tools).

**PersistentLauncher.tsx:**

- Standalone FAB (blue, 56px), bottom-right. Toggle opens a panel with same nav links (Journal, Learn, Apps, Diagnostics, Home). No input.

---

## 3. Center FAB Becomes OSB

**Primary behavior:**

- **Single tap on center FAB** → open OSB modal (smart capture). Do not navigate to Play; do not open a nav dropdown.
- **Implementation:** In GlobalAppSkin (or wherever the center button is rendered), change onClick to set "OSB modal open" to true (e.g. `setOsbModalOpen(true)` or `dispatchState("state.update", { key: "osb_modalOpen", value: true })`). The shell (or layout) must render the OSB modal when that state is true; the modal contains the OSB content (input, dynamic question, suggestion chips, optional confirm).

**Remove or repurpose:**

- **Play navigation from center tap:** Move "Play" to one of the strip icons or into a secondary menu so the center has a single meaning: capture.
- **Launcher dropdown from center:** If the dropdown was intended to open on tap, replace that with "open OSB modal." If the dropdown should stay, make it a **long-press** or **second tap** on the center FAB so that:
  - First tap = open OSB (primary).
  - Long-press or second tap = open dropdown (Journal, Learn, Apps, Diagnostics, Home) for quick nav. That way the primary action is always capture.

**Recommendation:** Center = OSB only on single tap. Expose "Play" and other nav via the left/right strip (e.g. keep person, people, build, tools; add or relabel one as Play) or via a small "More" / overflow that opens the same nav list. Avoid overloading the center button with two different actions (capture vs nav) on the same gesture.

---

## 4. Launcher Adaptation

**Option A — Center = OSB only; nav elsewhere**

- Center FAB: single tap → open OSB modal. No dropdown on center.
- Nav targets (Journal, Learn, Apps, Diagnostics, Home, Play): available via strip icons (Me, Others, Build, Tools) and optionally one more icon or "More" that opens a sheet/menu with the full list. No change to navigate event or routes; only the trigger moves.

**Option B — Center = OSB on tap; dropdown on long-press**

- Single tap → open OSB modal.
- Long-press → open existing dropdown (Journal, Learn, Apps, Diagnostics, Home). Play can be added to that list or kept on strip.

**Option C — Center = OSB; dropdown replaced by "Quick capture" + nav**

- Single tap → open OSB modal.
- Dropdown content replaced: first item could be "Quick capture" (same as opening OSB) and rest = nav links. Redundant but clear.

**Recommendation:** Option A or B. Prefer **Option A** for clearest mental model: center = capture; nav = strip and/or overflow. Option B is acceptable if product requires quick access to the current dropdown from the same button.

---

## 5. Where OSB Modal Renders

**Options:**

1. **In GlobalAppSkin** — Same file that owns the bottom nav. When osb_modalOpen is true, render a portal or inline modal (using ModalCompound or a wrapper) that contains the OSB content. Pros: shell owns both FAB and modal; no layout change. Cons: GlobalAppSkin grows slightly.
2. **In layout (app/layout.tsx or equivalent)** — Layout reads osb_modalOpen (from state or context) and renders the OSB modal above the rest of the app. Pros: separation of shell chrome and overlay. Cons: layout must know about OSB.
3. **In a dedicated OSB shell component** — e.g. OSBShell or OSBProvider that wraps the app and provides both the FAB (or receives a callback from shell) and the modal. Shell only triggers "open OSB" and the provider renders the modal. Pros: OSB logic and UI in one place. Cons: one more wrapper.

**Recommendation:** Either (1) or (3). For minimal change, (1): extend GlobalAppSkin so that when the center FAB is pressed it sets modal open state and the same component (or a child) renders the OSB modal content. For cleaner separation, (3): shell dispatches "open OSB" (e.g. state.update or a callback), and a dedicated OSB component (mounted in layout or shell) listens and renders the modal.

---

## 6. PersistentLauncher

If PersistentLauncher is used in addition to GlobalAppSkin (e.g. on a different breakpoint or page):

- **Align behavior:** Its main action should also open OSB (same modal), not a different UI. So: one OSB modal for the app; both GlobalAppSkin center FAB and PersistentLauncher (if shown) open that same modal.
- **Implementation:** Both trigger the same "open OSB" state or callback (e.g. setOsbModalOpen(true) or dispatch state.update osb_modalOpen). The modal is rendered once (in layout or in a provider); which button opened it does not matter.

---

## 7. Summary

- **Center FAB:** Single tap opens OSB modal. Do not use center tap for Play nav or for a nav-only dropdown; move those to strip or long-press.
- **Launcher:** Becomes "OSB launcher" (primary action = capture). Nav links live on strip icons or overflow/long-press.
- **Modal:** Rendered when osb_modalOpen is true; content = OSB (input, question, chips, confirm). Rendered in shell or in a dedicated OSB component; single instance for the app.
- **PersistentLauncher:** If used, same "open OSB" behavior so one consistent entry point.

This document is design only. No code has been modified.
