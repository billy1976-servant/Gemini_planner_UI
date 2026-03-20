# Prayer Annotation Overlay Stage Fix ΓÇö Report

## Summary

Layout was updated so the annotation overlay sits in the same container as the live content (video, slide, screen share, blank slide) and covers it with a single positioned stage. Drawing now happens directly on top of the content, Zoom-style. Only layout and overlay mounting were changed; no WebRTC/LiveKit or file moves.

---

## Files Modified

| File | Changes |
|------|--------|
| [PrayerRoom.tsx](PrayerRoom.tsx) | Wrapped content and overlay in a single `prayer-content-stage` container; added `className="prayer-content-stage"` and `width: "100%"` on the wrapper. |
| [prayer-theme.css](prayer-theme.css) | Added `.prayer-content-stage` with `position: relative`, `width: 100%`, `min-height: 200px`. |
| [room/AnnotationOverlay.tsx](room/AnnotationOverlay.tsx) | Single overlay wrapper (with `containerRef`) containing toolbar + canvas; wrapper `zIndex: 50`, `pointerEvents: editable ? "auto" : "none"`; toolbar moved inside wrapper and positioned bottom-center; canvas `zIndex: 51`, `touchAction: "none"`, `background: "transparent"`. |

---

## Layout Fixes Applied

### 1. Single content stage (PrayerRoom.tsx)

- The block that renders **ScreenShareView**, **SlideViewer**, **SessionSlidesView**, **VideoContentView**, and the blank slide is now a single container with:
  - `ref={contentWrapperRef}` (unchanged, for capture)
  - `className="prayer-content-stage"`
  - `style={{ position: "relative", width: "100%", marginTop: "1rem" }}`
- **AnnotationOverlay** is rendered **inside** this same container, as a sibling of the active content view, so overlay and content share the same positioning context and the overlay can cover the content.

### 2. Content stage CSS (prayer-theme.css)

- **.prayer-content-stage**:
  - `position: relative` ΓÇö establishes the containing block for the overlayΓÇÖs `position: absolute`
  - `width: 100%` ΓÇö stage spans the available width
  - `min-height: 200px` ΓÇö stage has a minimum height so the overlay has a drawable area even with minimal content

### 3. Overlay covers the content (AnnotationOverlay.tsx)

- **Single wrapper** (the element with `ref={containerRef}`):
  - `position: "absolute"`
  - `inset: 0`
  - `width: "100%"`, `height: "100%"`
  - `zIndex: 50` ΓÇö above the content (default stacking)
  - `pointerEvents: editable ? "auto" : "none"` ΓÇö canvas receives pointer events only when editable
- **Canvas**:
  - `position: "absolute"`, `inset: 0`, `width: "100%"`, `height: "100%"`
  - `zIndex: 51` ΓÇö above the wrapperΓÇÖs background, below the toolbar
  - `touchAction: "none"` ΓÇö avoids touch scrolling stealing drag
  - `background: "transparent"` ΓÇö no tint over the content
  - `pointerEvents: editable ? "auto" : "none"` ΓÇö same as wrapper for clarity

### 4. Toolbar floats above content (AnnotationOverlay.tsx)

- Toolbar was moved **inside** the overlay wrapper (the same div as the canvas).
- Toolbar positioning:
  - `position: "absolute"`
  - `bottom: 20`
  - `left: "50%"`
  - `transform: "translateX(-50%)"`
  - `zIndex: 60`
- So the toolbar floats at the bottom center of the content area (Zoom-style) and no longer affects the layout of the content below.

### 5. Canvas resizes with content

- **ResizeObserver** already observes the overlay wrapper (`containerRef`). The wrapper has `position: absolute; inset: 0`, so it matches the size of `.prayer-content-stage`.
- When the stage (or content) size changes, the wrapper size changes, ResizeObserver runs, and **resizeAndDraw** runs:
  - Uses `container.getBoundingClientRect()` for width/height.
  - Sets `canvas.width` / `canvas.height` (with DPR) and redraws strokes.
- **drawStrokes** already guards with `if (!ctx || width === 0 || height === 0) return`.

### 6. Overlay stays mounted when content changes

- **AnnotationOverlay** is rendered whenever `annotationVisible` is true, independent of which content is shown (video, slide, session slide, screen share, blank slide).
- It is not unmounted when switching between those views; only `annotationVisible` controls mount/unmount, so annotations stay visible and the overlay keeps covering the active content.

---

## Confirmation: Annotations Overlay Video/Slides Correctly

- **Single stage:** Content and overlay are siblings inside `.prayer-content-stage`, so the overlayΓÇÖs `position: absolute; inset: 0` covers exactly the content area.
- **Stacking:** Content has default z-index (0); overlay wrapper 50, canvas 51, toolbar 60, so drawing appears on top of video/slides/screen share.
- **Pointer events:** With `editable` true, the canvas receives pointer events; strokes are drawn where the pointer moves; console still shows `ANNOTATION POINTER DOWN` when the host draws.
- **Toolbar:** Floats at bottom center over the content and does not push the layout; host can draw on the full content area including under the toolbarΓÇÖs horizontal strip.

**Verification:** Open room as host ΓåÆ turn annotations on ΓåÆ confirm overlay and toolbar sit over the current view (video/slide/screen share) ΓåÆ draw on the content ΓåÆ strokes appear on the content and console logs `ANNOTATION POINTER DOWN`.
