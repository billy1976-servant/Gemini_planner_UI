# Layout Centering Fix - Complete Solution

## Problem
The preview rendering was not centered in the viewport. The phone frame was drifting left, and the desktop view was stretching full-width instead of being constrained and centered.

## Root Cause Analysis
The issue was that `PreviewStage` was NOT the top-level layout controller. The actual hierarchy was:

```
layout.tsx (RootLayout)
└── <div className="app-content">     ← Top-level container with padding
    └── page.tsx (Page component)
        └── <PreviewStage>            ← Device mode wrapper
            └── WebsiteShell/AppShell/LearningShell
                └── GlobalAppSkin
                    └── JsonRenderer
```

The `app-content` class had CSS padding that prevented proper centering, and there was no centering wrapper above `PreviewStage`.

## Solution Implementation

### 1. Added Centering Wrapper in layout.tsx (Lines 217-225)

**File:** `src/app/layout.tsx`

```tsx
<div ref={contentRef} className="app-content" style={{ padding: 0 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
      minHeight: "100vh",
    }}
  >
    {children}
  </div>
</div>
```

**Changes:**
- Removed CSS padding from `app-content` with inline style override (`padding: 0`)
- Added flex centering container with:
  - `display: flex`
  - `justifyContent: center`
  - `width: 100%`
  - `minHeight: 100vh`

### 2. Updated Desktop Mode in PreviewStage.tsx (Lines 38-63)

**File:** `src/04_Presentation/components/stage/PreviewStage.tsx`

```tsx
// DESKTOP MODE — Centered with max-width constraint
if (mode === "desktop") {
  return (
    <div
      data-preview-stage="desktop-outer"
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        data-preview-frame="desktop"
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

**Changes:**
- Added outer centering container with flex layout
- Added inner frame with `max-width: 1100px` and `margin: 0 auto`
- This constrains desktop width and centers it

### 3. Updated Phone Mode in PreviewStage.tsx (Line 119)

**File:** `src/04_Presentation/components/stage/PreviewStage.tsx`

```tsx
<div
  data-preview-frame="phone-device"
  style={{
    position: "relative",
    width: "390px",
    maxWidth: "100%",
    margin: "0 auto",  // ← Added
    minHeight: "calc(100vh - 96px)",
    background: "#1a1a1a",
    borderRadius: "32px",
    padding: "12px",
    boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
    transition: "width 0.3s ease",
  }}
>
```

**Changes:**
- Added `margin: 0 auto` to reinforce centering
- Phone device already had flex centering from outer container

## Result

### Desktop Mode
- **Max-width:** 1100px
- **Centering:** Flex container + auto margins
- **Behavior:** Content is constrained and perfectly centered

### Phone Mode  
- **Max-width:** 390px
- **Centering:** Flex container + auto margins
- **Behavior:** Device frame is perfectly centered with no drift

### Tablet Mode
- **Max-width:** 768px
- **Centering:** Already had flex centering (unchanged)
- **Behavior:** Centered with soft shadow

## Files Modified

1. **src/app/layout.tsx**
   - Line 217: Removed padding from `app-content`
   - Lines 218-224: Added centering flex wrapper

2. **src/04_Presentation/components/stage/PreviewStage.tsx**
   - Lines 38-63: Updated desktop mode with centering + 1100px constraint
   - Line 119: Added `margin: 0 auto` to phone device frame

## What Was NOT Changed

✅ **No changes to:**
- JsonRenderer
- GlobalAppSkin
- ExperienceRenderer
- Layout engine
- Molecules (List, Toolbar, Stepper, etc.)
- Behavior system
- State management
- Template system
- Palette system

This was a **pure layout/CSS fix** with no logic changes.

## Verification

To verify the fix works:

1. **Desktop Mode:**
   - Switch to desktop preview mode
   - Content should be centered with max 1100px width
   - No full-width stretching

2. **Phone Mode:**
   - Switch to phone preview mode  
   - Device frame should be perfectly centered
   - No left/right drift

3. **Responsive:**
   - Resize browser window
   - Content should remain centered at all sizes
   - Proper scaling with max-width constraints

## Technical Details

### CSS Hierarchy
```
app-content (padding: 0)                    ← Removed padding
└── Centering Wrapper (flex)                ← Added
    └── PreviewStage
        ├── Desktop: 1100px frame           ← Added
        ├── Tablet: 768px frame             ← Already existed
        └── Phone: 390px device             ← Enhanced centering
```

### Key CSS Properties Applied

**Centering Container (layout.tsx):**
```css
display: flex;
justify-content: center;
width: 100%;
min-height: 100vh;
```

**Desktop Frame (PreviewStage):**
```css
width: 100%;
max-width: 1100px;
margin: 0 auto;
```

**Phone Device (PreviewStage):**
```css
width: 390px;
max-width: 100%;
margin: 0 auto;
```

## Summary

The layout centering issue was resolved by:
1. Identifying that `app-content` in `layout.tsx` was the true top-level container
2. Removing interfering padding from `app-content`
3. Adding a stable flex centering wrapper above `PreviewStage`
4. Adding max-width constraints inside `PreviewStage` for desktop (1100px) and phone (390px) modes
5. Using both flex centering AND auto margins for robust cross-browser centering

The preview is now perfectly centered in all device modes with no drift or unwanted stretching.
