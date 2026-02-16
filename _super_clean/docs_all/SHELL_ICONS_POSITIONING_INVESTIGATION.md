# Shell Icons Positioning & Rendering — Structural Investigation

**Task:** Diagnose why shell icons are misaligned, boxed, not rendering like the play button, and not respecting JSON screen bounds.  
**Rule:** Assessment and written plan only — no file modifications.

---

## 1) RENDER SOURCE TRACE

| Icon | Source | TSX? | JSON? | Molecule/Atom? | Shell overlay? | Image vs SVG vs container? |
|------|--------|------|-------|----------------|-----------------|----------------------------|
| **Play button** | [PersistentLauncher.tsx](src/04_Presentation/components/global/PersistentLauncher.tsx) | Yes | No | No (plain TSX) | Yes — rendered via `createPortal()` to `document.body` or `[data-phone-frame-inner]` | **Inline `<svg>`** (play triangle path), child of `<button>`. No img, no wrapper. |
| **Habit** | [GlobalAppSkin.tsx](src/04_Presentation/shells/GlobalAppSkin.tsx) `BottomNavOnly` → `HabitIcon` | Yes | No | Strip has `data-molecule="ShellQuickIcons"`; button has `data-shell-icon` | Yes — part of bottom strip | **Inline `<svg>`** (path + circle), direct child of `<button>`. |
| **People** | Same file, `PeopleIcon` | Yes | No | Same | Yes | **Inline `<svg>`** (two users stroke paths), direct child of `<button>`. |
| **Journey** | Same file, `JourneyIcon` | Yes | No | Same | Yes | **Inline `<svg>`** (map-pin path), direct child of `<button>`. |
| **Calendar** | Same file, `CalendarIcon` | Yes | No | Same | Yes | **Inline `<svg>`** (calendar rect + lines), direct child of `<button>`. |

**Summary:**

- **All five** are **TSX-rendered only**. None come from the JSON layout system, molecules, or atoms.
- **Play button:** Rendered by `PersistentLauncher`, portaled to `body` (desktop) or `[data-phone-frame-inner]` (phone frame). So it can sit **inside** the “screen” when the phone frame is on.
- **Habit, People, Journey, Calendar:** Rendered by `BottomNavOnly` (GlobalAppSkin), which is a **child of BottomNavOverlay** in `layout.tsx`. They are **always** in the viewport-fixed bottom strip; they are **never** inside the JSON/content screen container.
- **Rendering pipeline:** All five use **inline SVG** only (no `<img>`, no mask, no icon container div). After the recent ShellQuickIcons normalization, each shell icon is `<button>` → single `<svg>` with 22×22 and `currentColor`.

---

## 2) POSITIONING ROOT CAUSE

### Why the Play button “sits inside the screen”

- `PersistentLauncher` uses `createPortal(content, portalTarget)`.
- **Desktop:** `portalTarget = document.body`. The FAB uses `position: fixed; right: Xpx; bottom: Ypx`, so it’s positioned relative to the **viewport** (bottom-right).
- **Phone frame on:** `portalTarget = document.querySelector("[data-phone-frame-inner]")`. The FAB is rendered **inside** the phone frame inner div, with `position: absolute; right: 24px; bottom: 24px + 48px`. So it is **inside** the white “device” screen and moves with it.

So the play button is **inside** the screen when phone frame is enabled because it is portaled into `data-phone-frame-inner`. On desktop it’s viewport-fixed.

### Why the other four icons “sit in the lower shell layer”

- In [layout.tsx](src/app/layout.tsx), the DOM order is:
  1. `app-chrome`
  2. `app-content` (contains `{children}` = page content, optionally wrapped in phone frame)
  3. **BottomNavOverlay** (fixed, full width, bottom 0, z-index 9999)
  4. PersistentLauncher (portal)
  5. InteractionTracerPanel (dev)

- **BottomNavOnly** is rendered **only** as a child of **BottomNavOverlay**. It is **not** a child of `app-content` and **not** inside `data-phone-frame` or `data-phone-frame-inner`.
- BottomNavOverlay has `position: fixed; bottom: 0; left: 0; width: 100%`. So the strip is always at the **viewport** bottom, regardless of phone frame.
- When phone frame is on, `app-content` contains the centered phone mockup (e.g. 390×844). The strip stays at the **bottom of the viewport**, so it appears **below** the phone device. The four icons are therefore in a “lower shell layer” (viewport bottom), not inside the device screen.

### White bar and green separator

- **BottomNavOverlay** ([layout.tsx](src/app/layout.tsx) ~293–312): `background: "rgba(0,0,0,0.85)"`, `height: 72px`. So the **overlay** is dark.
- **BottomNavOnly** ([GlobalAppSkin.tsx](src/04_Presentation/shells/GlobalAppSkin.tsx) `navRootStyle`): `background: "white"`, `borderTop: "2px solid lime"`, `height: 64`, `minHeight: 48`. The **inner** strip is white and has a green top border.
- So: the **white bar** is the BottomNavOnly root div (white background). The **green line** is its `borderTop: 2px solid lime`.

### Why icons are not aligned to JSON screen bounds

- The **JSON screen** (and all page content) lives under `app-content` → (optional phone frame) → `data-phone-frame-inner` (when phone frame on) → `{children}` (PreviewStage, WebsiteShell/AppShell, JSON content).
- The **four shell icons** live under **BottomNavOverlay** (sibling of `app-content`), which is viewport-fixed and full width. They are **never** placed inside the same container as the JSON content or the phone frame inner.
- So alignment to “JSON screen bounds” is impossible with the current structure: the strip is not a descendant of the screen container and does not use the screen’s dimensions or position. It is viewport-anchored.

### Positioning summary

| Element | Position | Parent | Anchored to |
|---------|----------|--------|-------------|
| Play FAB (desktop) | `fixed` | body | Viewport |
| Play FAB (phone frame) | `absolute` | `data-phone-frame-inner` | JSON “screen” (phone inner) |
| BottomNavOverlay | `fixed`, bottom 0 | body | Viewport |
| BottomNavOnly (4 icons) | `fixed` or `absolute`* | BottomNavOverlay | Viewport (strip is full width at bottom) |

\* BottomNavOnly uses `position: "absolute"` when `inPhoneFrame` is true, but its **parent** is still the fixed BottomNavOverlay, so the strip remains at the viewport bottom. The `inPhoneFrame` branch does **not** move the strip into the phone frame.

---

## 3) SHELL VS JSON MISMATCH

- **Are the 4 icons mounted in a TSX shell wrapper?**  
  **Yes.** They are mounted inside `BottomNavOnly` (TSX), which is inside the `BottomNavOverlay` div (TSX in `layout.tsx`). No JSON component renders them.

- **Do they bypass the JSON layout system?**  
  **Yes.** The JSON layout system (ExperienceRenderer, JsonRenderer, sections, molecules, atoms) only renders what is in `{children}` (page content). The bottom strip is rendered by the root layout as a **sibling** of that content, so it fully bypasses JSON.

- **Is the play button attached to the JSON screen container while others are attached to a shell container?**  
  **Yes, when phone frame is on.**  
  - Play: portaled into `[data-phone-frame-inner]`, which is the same wrapper that contains the page content (JSON/PreviewStage). So it is **inside** the “screen” container.  
  - The four icons: inside BottomNavOverlay, which is a **sibling** of `app-content`. So they are in a **shell container** (viewport-fixed bar), not in the JSON screen container.

---

## 4) SVG / IMAGE PIPELINE

After the ShellQuickIcons normalization:

- **Play icon:** In PersistentLauncher, a single `<svg>` (24×24 in code, play path) inside `<button>`. No img, no wrapper. Renders correctly.
- **Habit, People, Journey, Calendar:** In GlobalAppSkin, each is a single `<svg>` (22×22, `SHELL_ICON_SVG_PROPS`) as the only child of a `<button>`. All use inline SVG (stroke or fill with `currentColor`). No `<img>`, no mask, no extra container.

So **all five** are now inline SVG. If “others appear as boxed placeholders,” possible causes:

1. **Visual “box” = the 48×48 circular button**  
   Buttons use `background: "transparent"`, `borderRadius: "50%"`. If there is no visible border, the “box” might be:
   - Default focus outline (e.g. `outline` on focus).
   - A debug or global style adding a border/outline to buttons.
   - The white strip itself (rectangular bar) being perceived as a “box” around the icons.

2. **Parent container clipping**  
   BottomNavOverlay has `overflow: "visible"`. BottomNavOnly has `overflow: "visible"`. So clipping is unlikely unless a parent up the tree (e.g. body or app-chrome) has overflow hidden.

3. **Missing width/height**  
   SVGs in GlobalAppSkin use `width: 22`, `height: 22`, `viewBox: "0 0 24 24"`. So dimensions are set.

4. **Color/contrast**  
   Icons use `currentColor` / `color: "inherit"`. The strip has `background: "white"`. If the parent doesn’t set a dark color, strokes might be too light (e.g. inherited gray) and look like empty boxes. Checking computed `color` on the strip and buttons would confirm.

**Conclusion:** The pipeline is SVG-only and structurally correct. Any “boxed” look is likely from (a) the white strip / button hit area, (b) focus or debug styling, or (c) low-contrast `currentColor` on a white background.

---

## 5) CENTERING + ALIGNMENT (what is required)

To make icons:

- **Anchored to JSON screen container**  
  The strip (or a second strip) would need to be rendered **inside** the same container that wraps the JSON content (e.g. inside `data-phone-frame-inner` when phone frame is on, or inside the main content wrapper when not). Alternatively, the strip could be positioned with JS (e.g. measure the content/screen rect and set `bottom`/`left`/`width` to match).

- **Centered horizontally**  
  BottomNavOnly already uses `justifyContent: "space-around"` on the strip and a flex row for the icon buttons. To center the **group** of icons as a whole within the strip, the strip could use `justifyContent: "center"` and a fixed or max width for the icon row, or keep full width and center the inner nav (e.g. `margin: 0 auto` with a max width).

- **Responsive (desktop, tablet, phone, phone frame)**  
  - **Desktop / tablet:** Strip is viewport-full-width, fixed bottom. Centering is within that strip.  
  - **Phone:** Same unless the layout has a different breakpoint for “phone” content width.  
  - **Phone frame:** To align with the “screen,” the strip must either:
    - Live inside `data-phone-frame-inner` (same as Play FAB when portaled there), with fixed or responsive width (e.g. 100% of inner), or
    - Be positioned (e.g. absolute/fixed) with coordinates derived from the phone frame inner rect so it sits at the bottom of the device rectangle.

So alignment to JSON screen bounds and consistent centering require **either** moving the strip into the content/screen container **or** computing the screen rect and positioning the strip to match.

---

## 6) BOX REMOVAL

- **There is no `ShellQuickIcons.tsx` file.** The strip and icons are implemented in [GlobalAppSkin.tsx](src/04_Presentation/shells/GlobalAppSkin.tsx) (`BottomNavOnly` and the icon components).

- **What draws the “icon boxes”:**
  1. **White bar:** The root div of BottomNavOnly (`navRootStyle`: `background: "white"`, height 64px). That’s the full-width white strip.
  2. **Green line:** Same div, `borderTop: "2px solid lime"`.
  3. **Per-icon “box”:** Each icon is a `<button>` (48×48, flex center, borderRadius 50%, transparent background). If anything looks like a box around an icon, it’s either:
     - The button (no visible fill by default), or
     - Focus/outline/debug styles, or
     - The dark BottomNavOverlay (rgba(0,0,0,0.85)) behind the white strip, creating a visible edge.

- **Layout container:** BottomNavOverlay in `layout.tsx` creates the fixed bottom layer; it doesn’t draw the white bar or green line — BottomNavOnly does.

- **Debug overlay:** InteractionTracerPanel is dev-only and not the source of the strip or icon boxes.

**Summary:** The “boxes” are the **white strip** (GlobalAppSkin BottomNavOnly root) and the **green border** (same div). Per-icon boxes are the **circular buttons** (GlobalAppSkin) or focus/outline. No separate ShellQuickIcons component; all from GlobalAppSkin + layout.tsx.

---

## FIX PLAN (high level — do not implement yet)

1. **Unify placement (shell vs JSON):**
   - **Option A:** When phone frame is on, render the **same** bottom strip (or a clone) **inside** `data-phone-frame-inner` (e.g. via a shared component or portal), so the four icons sit at the bottom of the device screen like the Play FAB. When phone frame is off, keep the strip in BottomNavOverlay (viewport-fixed).
   - **Option B:** Always render the strip inside the “content” container (e.g. as the last child of the same div that has `{children}`), so its width and position follow the content/screen container (and thus the phone frame when enabled). Layout would need to pass or expose that container.

2. **Strip styling:**
   - Decide whether to keep the white bar and lime border or replace with a transparent/dark strip to match BottomNavOverlay. If keeping white, ensure contrast for `currentColor` icons (e.g. set `color` on the strip so SVGs are visible).

3. **Centering:**
   - Keep or adjust flex on the ShellQuickIcons div so the icon row is centered within the strip (e.g. `justifyContent: "center"` and optional max width for the button row).

4. **Box removal:**
   - Remove or override the lime `borderTop` if the green line is unwanted.
   - Ensure icon buttons have no visible border/outline unless for focus. Add explicit `outline: "none"` and focus-visible style if needed.

5. **Responsive:**
   - Use the same strip in both viewport-fixed (desktop) and in-screen (phone frame) modes, with width 100% of its container so it behaves correctly in both.

6. **Verification:**
   - With phone frame on: Play FAB and the four icons should both sit at the bottom of the **device** screen.
   - With phone frame off: Strip at viewport bottom; Play FAB at viewport bottom-right.
   - All five icons should render as inline SVG only (no img, no mask, no extra wrapper).
   - Run `runShellIconsVisibilityDiagnostic()` and confirm it reports the strip and SVGs as expected.

End of investigation.
