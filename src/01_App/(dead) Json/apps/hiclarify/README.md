# HIClarify Skin for HiSense

A JSON-based skin implementation inspired by the HIClarify app layout, featuring a play button with 4 navigation tabs designed for journal and productivity applications.

## Overview

This skin replicates the HIClarify user interface with:
- **5 Tab Navigation**: Me, Others, Play (center), Plan, Journey
- **Color Palette**: Green primary (#2ECC71), Orange accent (#F97316)
- **Media Player Visual Preset**: Optimized for interactive tab navigation
- **Conditional Content Rendering**: Each tab displays different content sections

## Files Created

### 1. Palette
**Location**: `src/04_Presentation/palettes/hiclarify.json`

Defines the HIClarify color scheme:
- Primary: `#2ECC71` (green, from HIClarify header)
- Secondary: `#F97316` (orange, for play button)
- Background: `#F8FAFC` (light gray)
- Surface colors and elevation shadows

**Registration**: Added to `src/04_Presentation/palettes/index.ts`

### 2. Visual Preset
**Location**: `src/04_Presentation/lib-layout/visual-presets.json`

Added `media-player` preset with styling for:
- **Button**: Orange background, pill shape, prominent shadow
- **Stepper**: Pill-shaped tab navigation with active state
- **Toolbar**: Action buttons with proper spacing
- **Section/Card**: Clean layout with appropriate spacing

### 3. Layout JSON
**Location**: `src/01_App/apps-json/apps/hiclarify/app.json`

Complete screen layout featuring:
- **Tab Navigation** using Stepper component
- **5 Tabs**:
  1. **Me**: Personal habits and daily routines
  2. **Others**: Relationship manager with categories
  3. **Play**: Autopilot mode (center tab with play icon)
  4. **Plan**: Journey builder with calendar
  5. **Journey**: Progress tracking and reflections
- **State Management**: `currentView` state for tab switching
- **Conditional Rendering**: Content changes based on active tab

### 4. Template Profile
**Location**: `src/04_Presentation/lib-layout/template-profiles.json`

Added `hiclarify-media-player` profile:
- Links to `media-player` visual preset
- Defines section layouts (nav, header, content, features, actions)
- Optimized spacing for mobile-friendly experience

## Architecture

```
┌─────────────────────────────────────────┐
│          Tab Navigation (Stepper)        │
│  [Me] [Others] [▶ Play] [Plan] [Journey]│
└─────────────────────────────────────────┘
                    ↓
        State: currentView = "me"
                    ↓
┌─────────────────────────────────────────┐
│         Conditional Content              │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Section (when currentView="me") │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Card: Daily Habits        │  │  │
│  │  └────────────────────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Card: Morning Routine     │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## How to Use

### Option 1: Load the Layout Directly

```javascript
// In your app, load the HIClarify layout
import hiclarifyLayout from '@/apps-json/apps/hiclarify/app.json';

// Render using the JSON renderer
<JsonRenderer layout={hiclarifyLayout} />
```

### Option 2: Apply the Palette and Template

```javascript
// Set the palette
setPalette('hiclarify');

// Apply the template profile (if using template system)
setTemplateProfile('hiclarify-media-player');

// Then load your own layout JSON that uses the styling
```

### Option 3: Use Individual Components

You can reference the styling in your own layouts:

```json
{
  "type": "Stepper",
  "params": {
    "moleculeLayout": {
      "type": "row",
      "preset": "distributed"
    }
  },
  "content": {
    "steps": [
      {
        "content": { "label": "Tab 1" },
        "behavior": {
          "type": "Action",
          "params": {
            "name": "state:currentView",
            "value": "tab1"
          }
        }
      }
    ]
  }
}
```

## Tab Structure

### Tab 1: Me
- **Purpose**: Personal life and habits tracking
- **Content**: Daily Habits, Morning Routine, Evening Reflection
- **Triggered by**: `state:currentView = "me"`

### Tab 2: Others
- **Purpose**: Relationship management
- **Content**: Categories (Family, Friends, Colleagues)
- **Triggered by**: `state:currentView = "others"`

### Tab 3: Play (Center)
- **Purpose**: Autopilot/media controls
- **Style**: Orange button with play icon (▶)
- **Behavior**: `media.play` action
- **Note**: Triggers action rather than view change

### Tab 4: Plan
- **Purpose**: Calendar and scheduling
- **Content**: Calendar View, Upcoming Events, View Switcher
- **Triggered by**: `state:currentView = "plan"`

### Tab 5: Journey
- **Purpose**: Progress and reflection tracking
- **Content**: Recent Activities, Goals & Achievements, Reflections
- **Triggered by**: `state:currentView = "journey"`

## Behavior System

### State Actions
- **`state:currentView`**: Updates the active tab
  ```json
  {
    "behavior": {
      "type": "Action",
      "params": {
        "name": "state:currentView",
        "value": "me"
      }
    }
  }
  ```

### Media Actions (Placeholders)
- **`media.play`**: Trigger play functionality
- **`media.pause`**: Trigger pause functionality
- **`media.options`**: Open options/settings

*Note: Media action handlers are defined in the layout but need implementation in the action registry if actual media functionality is required.*

## Customization

### Changing Colors

Edit `src/04_Presentation/palettes/hiclarify.json`:

```json
{
  "color": {
    "primary": "#YOUR_PRIMARY_COLOR",
    "secondary": "#YOUR_ACCENT_COLOR"
  }
}
```

### Modifying Tab Layout

Edit `src/04_Presentation/lib-layout/visual-presets.json`:

```json
{
  "media-player": {
    "stepper": {
      "surface": {
        "background": "surface.elevated",
        "radius": "radius.pill"
      }
    }
  }
}
```

### Adding New Tabs

Edit `src/01_App/apps-json/apps/hiclarify/app.json`:

1. Add a new step to the Stepper `content.steps` array
2. Add a new Section with `when` condition
3. Update state management logic if needed

## Testing Checklist

- [x] Palette loads correctly with HIClarify colors
- [x] Visual preset applies proper styling to components
- [x] Template profile registered and available
- [x] Tab navigation switches between views
- [x] State management updates `currentView`
- [x] Conditional rendering shows/hides sections
- [x] Play button styled distinctly (orange, pill-shaped)
- [x] Layout renders without errors
- [ ] Media actions trigger (requires handler implementation)
- [ ] Responsive design tested on mobile

## Technical Details

### Component Mapping

| HIClarify Element | HiSense Component | Implementation |
|-------------------|-------------------|----------------|
| Bottom Navigation | `Stepper` | Tab-pill variant with distributed layout |
| PlayFab | `Button` or Stepper step | Orange background, pill radius, secondary color |
| Tab Content | `Section` with `when` | Conditional rendering based on state |
| Content Cards | `Card` | Standard card molecule |
| Action Lists | `List` or `Toolbar` | List items with tap behaviors |

### State Flow

```
User taps tab → 
  Action event fired → 
    behavior-listener catches "state:currentView" → 
      dispatchState updates state → 
        json-renderer re-evaluates `when` conditions → 
          Visible sections update
```

### Token Resolution

The palette resolver converts token paths to values:

```
"color.secondary" → "#F97316"
"radius.pill" → 9999
"padding.md" → 20
```

## Integration with Existing Apps

To use HIClarify styling in your existing journal app:

1. **Import the palette**:
   ```typescript
   import { setPalette } from '@/engine/core/palette-store';
   setPalette('hiclarify');
   ```

2. **Use visual presets in your components**:
   ```json
   {
     "type": "Button",
     "params": {
       "visualPreset": "media-player"
     }
   }
   ```

3. **Adopt the navigation pattern**:
   - Use Stepper for tabs
   - Implement state-driven content switching
   - Style center tab distinctly for primary action

## References

### HIClarify Source Files
- **Navigation**: `C:\Users\New User\Desktop\hiclarify\src\App.jsx` (lines 618-639)
- **Play Button**: `C:\Users\New User\Desktop\hiclarify\src\App.jsx` (lines 735-751)
- **Play Icon**: `C:\Users\New User\Desktop\hiclarify\src\icons\play_svg.svg`

### HiSense System Files
- **JSON Renderer**: `src/03_Runtime/engine/core/json-renderer.tsx`
- **Behavior Listener**: `src/03_Runtime/engine/core/behavior-listener.ts`
- **Stepper Component**: `src/04_Presentation/components/molecules/stepper.compound.tsx`
- **Palette Bridge**: `src/06_Data/site-renderer/palette-bridge.tsx`

## Future Enhancements

- [ ] Add hold-to-configure interaction for play button
- [ ] Implement media action handlers
- [ ] Add transition animations between tabs
- [ ] Create dark mode variant
- [ ] Add persistent tab state (localStorage)
- [ ] Implement swipe gestures for tab navigation
- [ ] Add badge notifications for tabs

## License

This skin is created for demonstration purposes, inspired by the HIClarify app layout.
