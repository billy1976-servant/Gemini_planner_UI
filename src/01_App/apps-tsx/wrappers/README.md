# Wrappers Test Directory

This directory contains standalone test versions of wrapper components for the TSX viewer.

## Available Tests

### GlobalAppSkin-test.tsx

**Fixed Icon Rendering Test**

- **Path**: `wrappers/GlobalAppSkin-test`
- **View URL**: `/screens/wrappers/GlobalAppSkin-test`

#### What Was Fixed

1. **Inline SVG Icons** - All icons converted from broken CSS masks to inline React SVG components
2. **currentColor Support** - Icons now properly inherit text color
3. **Reliable Rendering** - No more Next.js import/loader issues
4. **Proper Styling** - Icons display correctly with slate-500 inactive color

#### Icons Included

- ✅ HabitIcon - Inline SVG (person icon)
- ✅ PeopleIcon - Converted from people_svg.svg
- ✅ JourneyIcon - Converted from journey_svg.svg  
- ✅ CalendarIcon - Converted from calendar_svg.svg
- ✅ PlayIcon - Converted from play_svg.svg (green play button)

#### Original Issues

The original GlobalAppSkin.tsx had several problems:

1. **Broken CSS Masks** - Used `maskImage: url(${src})` without quotes
2. **SVG Imports** - Next.js returns URLs, not raw SVG content
3. **Hardcoded Colors** - All icons stuck at `#64748b` gray
4. **Mixed Approaches** - Inconsistent icon rendering techniques

All issues are now resolved in this test version.

## Usage

To view any test component in the TSX viewer:

1. Navigate to `/screens/<path>`
2. For GlobalAppSkin test: `/screens/wrappers/GlobalAppSkin-test`
3. The component will render in the viewer with sample content

## Adding New Wrapper Tests

1. Create a new `.tsx` file in this directory
2. Export a default component
3. Access via `/screens/wrappers/<filename>` (without .tsx extension)
