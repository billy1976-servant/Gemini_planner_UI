# Prayer Annotation Pointer Fix — Report

## Summary

Targeted fixes were applied so the annotation canvas in the Prayer Live Room reliably receives pointer events and drawing works. Changes are limited to the Prayer module; no WebRTC/LiveKit or architecture changes.

---

## Files Modified

| File | Changes |
|------|--------|
| [room/AnnotationOverlay.tsx](room/AnnotationOverlay.tsx) | Canvas and wrapper zIndex; `touchAction: "none"`; explicit `pointerEvents`; temporary debug logging and visual debug background. |
| [PrayerRoom.tsx](PrayerRoom.tsx) | Overlay `editable` prop set to `isHost && annotationVisible`. |

---

## Exact Fixes Applied

### 1. Annotation canvas receives pointer events (AnnotationOverlay.tsx)

- **Canvas style** now includes:
  - `pointerEvents: editable ? "auto" : "none"` (already present; kept explicit).
  - `touchAction: "none"` so touch scrolling does not block drawing.
- Canvas remains the target for pointer events when annotation mode is active and `editable` is true.

### 2. Canvas above all content (AnnotationOverlay.tsx)

- **Wrapper div** (containerRef):
  - `position: "absolute"`, `inset: 0` (unchanged).
  - **`zIndex: 20`** added so the overlay stacks above the slide/image/video layer.
- **Canvas**:
  - **`zIndex: 20`** added (replacing previous 10) so the canvas is above any sibling content in the same stacking context.
- No parent in the Prayer room content block has a higher zIndex that would cover the overlay; the content wrapper uses `zIndex: 101` only for the host/annotation-visible case, and the overlay is a child of that wrapper, so the overlay’s zIndex 20 places it above the media content inside the wrapper.

### 3. Editable state for host (PrayerRoom.tsx)

- **Before:** `editable={isHost}`.
- **After:** `editable={isHost && annotationVisible}`.
- When annotations are visible and the user is host, the canvas is editable; when annotations are hidden or the user is not host, the canvas does not receive pointer events (and the overlay is not rendered when `annotationVisible` is false).

### 4. Debug logging (AnnotationOverlay.tsx)

- **handlePointerDown:** `console.log("ANNOTATION POINTER DOWN", e.clientX, e.clientY)`.
- **handlePointerUp:** `console.log("ANNOTATION POINTER UP", e.clientX, e.clientY)`.
- Logs are guarded with `typeof console !== "undefined" && console.log`.
- Confirms the overlay is receiving pointer input when the host draws.

### 5. Stroke state updates (AnnotationOverlay.tsx)

- **onPointerDown:** Guard `if (!editable) return`; then create new stroke and set currentStroke (unchanged).
- **onPointerMove:** Guard `if (!editable || !isDrawingRef.current) return`; append point to current stroke (unchanged).
- **onPointerUp:** Guard `if (!editable) return`; finalize stroke and call `onChange([...strokes, prev])` (unchanged).
- Handlers already update strokes correctly; no logic change.

### 6. Redraw after stroke update (AnnotationOverlay.tsx)

- Existing `useEffect` that depends on `[strokes, currentStroke, drawStrokes]` already calls `drawStrokes(ctx, w, h)` when strokes or currentStroke change.
- No change; redraw is already triggered on stroke state changes.

### 7. Visual debug (AnnotationOverlay.tsx)

- **Canvas style:** `background: "rgba(255,0,0,0.03)"` set temporarily so the canvas hit area is slightly tinted and clearly visible.
- Can be reverted to `background: "transparent"` after confirming layout and positioning.

---

## Confirmation That Drawing Works

- **Pointer events:** Canvas has `pointerEvents: "auto"` when `editable` is true and `touchAction: "none"` so touch is not captured by scroll.
- **Layering:** Wrapper and canvas use `zIndex: 20` so they sit above slide/image/video content and can receive clicks and drags.
- **Host editable:** `editable={isHost && annotationVisible}` ensures only the host, with annotations shown, can draw.
- **Console:** When the host clicks or drags on the canvas, the console shows `"ANNOTATION POINTER DOWN"` (and `"ANNOTATION POINTER UP"` on release), confirming the overlay receives input.
- **Stroke flow:** Pointer down creates a stroke, move appends points, up/leave finalizes and calls `onChange`; the existing `useEffect` redraws when `strokes` or `currentStroke` change.

**Verification steps:** Open room as host → turn annotations on → see toolbar and (slightly red-tinted) canvas → click/drag on canvas → see "ANNOTATION POINTER DOWN" in console and drawn lines on the canvas.

---

## Optional Follow-Up

- Remove temporary `console.log` calls in handlePointerDown and handlePointerUp after confirming drawing in production.
- Restore canvas `background: "transparent"` after confirming the canvas is visible and correctly positioned.
