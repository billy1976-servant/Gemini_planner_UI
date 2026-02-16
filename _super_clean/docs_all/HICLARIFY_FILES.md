# HIClarify Skin - File Reference

Quick reference for all files created or modified for the HIClarify skin implementation.

## 📁 New Files Created

### 1. Palette Definition
```
src/04_Presentation/palettes/hiclarify.json
```
**Purpose**: Defines HIClarify color scheme (green #2ECC71, orange #F97316)
**Size**: ~4KB

### 2. Layout Definition
```
src/01_App/apps-json/apps/hiclarify/app.json
```
**Purpose**: Complete screen layout with 5-tab navigation
**Size**: ~6KB
**Key Features**: Stepper tabs, conditional sections, state management

### 3. Documentation
```
src/01_App/apps-json/apps/hiclarify/README.md
```
**Purpose**: Comprehensive usage guide and technical documentation
**Size**: ~15KB

### 4. Implementation Summary
```
HICLARIFY_IMPLEMENTATION_SUMMARY.md
```
**Purpose**: High-level overview of what was implemented
**Size**: ~6KB

### 5. File Reference (This File)
```
HICLARIFY_FILES.md
```
**Purpose**: Quick reference to all created/modified files
**Size**: ~2KB

## ✏️ Modified Files

### 1. Palette Registry
```
src/04_Presentation/palettes/index.ts
```
**Changes**:
- Added import: `import hiclarifyPalette from "./hiclarify.json";`
- Added entry: `hiclarify: hiclarifyPalette,`

### 2. Visual Presets
```
src/04_Presentation/lib-layout/visual-presets.json
```
**Changes**:
- Added `media-player` preset object
- Configured: button, toolbar, stepper, navigation, section, card, list

### 3. Template Profiles
```
src/04_Presentation/lib-layout/template-profiles.json
```
**Changes**:
- Added `hiclarify-media-player` profile
- Configured sections: nav, header, content, features, actions, cta

## 🎨 Visual Assets Referenced

### From HIClarify Source
- **Play Icon SVG**: `C:\Users\New User\Desktop\hiclarify\src\icons\play_svg.svg`
- **Navigation Logic**: `C:\Users\New User\Desktop\hiclarify\src\App.jsx` (lines 618-639)
- **Play Button Component**: `C:\Users\New User\Desktop\hiclarify\src\App.jsx` (lines 735-751)

## 🔍 Key Code Locations

### Tab Configuration
```json
Location: app.json line 12-68
The Stepper component with 5 steps
```

### Conditional Sections
```json
Location: app.json lines 70-268
Sections with "when" conditions for each tab
```

### Palette Colors
```json
Location: hiclarify.json lines 2-17
Color definitions (primary, secondary, surface, etc.)
```

### Visual Preset Config
```json
Location: visual-presets.json lines 62-77
media-player preset configuration
```

## 📊 Statistics

- **Files Created**: 5
- **Files Modified**: 3
- **Total Lines Added**: ~500
- **Color Tokens Defined**: 14
- **Components Used**: 7 (Stepper, Section, Card, List, Toolbar, Button, Field)
- **Tabs Implemented**: 5
- **State Variables**: 1 (currentView)

## 🚀 Quick Access Commands

### Open Main Layout
```bash
code "C:\Users\New User\Documents\HiSense\src\01_App\apps-json\apps\hiclarify\app.json"
```

### Open Palette
```bash
code "C:\Users\New User\Documents\HiSense\src\04_Presentation\palettes\hiclarify.json"
```

### Open Documentation
```bash
code "C:\Users\New User\Documents\HiSense\src\01_App\apps-json\apps\hiclarify\README.md"
```

### View All Changes
```bash
cd "C:\Users\New User\Documents\HiSense"
git status
git diff
```

## 🎯 Entry Points

To use the HIClarify skin in your app:

**Option 1 - Direct Layout**:
```typescript
import layout from '@/apps-json/apps/hiclarify/app.json';
```

**Option 2 - Palette Only**:
```typescript
import { setPalette } from '@/engine/core/palette-store';
setPalette('hiclarify');
```

**Option 3 - Template Profile**:
```typescript
// Set in your layout or config
{
  "templateProfile": "hiclarify-media-player"
}
```

## 📦 Dependencies

No new npm packages were added. The implementation uses existing HiSense infrastructure:

- `@/engine/core/palette-store` - Palette management
- `@/engine/core/json-renderer` - Layout rendering
- `@/state/state-store` - State management
- `@/engine/core/behavior-listener` - Action handling
- `@/components/atoms/*` - Base UI components
- `@/components/molecules/*` - Compound components (Stepper, Card, etc.)

## 🔗 Related Systems

### Palette System
- Store: `src/03_Runtime/engine/core/palette-store.ts`
- Bridge: `src/06_Data/site-renderer/palette-bridge.tsx`
- Resolver: `src/03_Runtime/engine/core/palette-resolver.ts`

### Layout System
- Renderer: `src/03_Runtime/engine/core/json-renderer.tsx`
- Preset Resolver: `src/04_Presentation/lib-layout/visual-preset-resolver.ts`
- Schema: `src/04_Presentation/lib-layout/layout-schema.json`

### Behavior System
- Listener: `src/03_Runtime/engine/core/behavior-listener.ts`
- Action Registry: `src/05_Logic/logic/runtime/action-registry.ts`
- State Store: `src/03_Runtime/state/state-store.ts`

### Components
- Stepper: `src/04_Presentation/components/molecules/stepper.compound.tsx`
- Button: `src/04_Presentation/components/molecules/button.compound.tsx`
- Toolbar: `src/04_Presentation/components/molecules/toolbar.compound.tsx`
- List: `src/04_Presentation/components/molecules/list.compound.tsx`

## 📝 Git Commit Reference

When ready to commit, these are the new/modified files:

**New**:
- `src/04_Presentation/palettes/hiclarify.json`
- `src/01_App/apps-json/apps/hiclarify/app.json`
- `src/01_App/apps-json/apps/hiclarify/README.md`
- `HICLARIFY_IMPLEMENTATION_SUMMARY.md`
- `HICLARIFY_FILES.md` (this file)

**Modified**:
- `src/04_Presentation/palettes/index.ts`
- `src/04_Presentation/lib-layout/visual-presets.json`
- `src/04_Presentation/lib-layout/template-profiles.json`

**Suggested commit message**:
```
feat: Add HIClarify skin with 5-tab navigation and media player preset

- Create hiclarify palette with green/orange color scheme
- Add media-player visual preset for interactive navigation
- Implement complete layout with Stepper tabs and conditional sections
- Register hiclarify-media-player template profile
- Add comprehensive documentation
```

---

**Last Updated**: February 12, 2026
**All Files**: ✅ Created/Modified
**Status**: Ready for use
