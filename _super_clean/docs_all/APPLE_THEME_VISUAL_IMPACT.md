# Apple Theme Visual Impact

Runtime analysis for journal_track / journal_replicate (or equivalent journal screen) when **palette = apple** and **visualPreset = apple** (e.g. via template or styling override).

---

## Visual parameters changed

| Area | Default (compact + default palette) | Apple (apple preset + apple palette) |
|------|-------------------------------------|--------------------------------------|
| **App/section background** | #F2F2F4 / #E6E6E8 (cool gray) | #F5F5F7 (warm light gray) |
| **Card** | White, elevation.low, radius.md (12px) | White, elevation.low (softer shadow), radius.lg (12px in apple = 12) |
| **Typography body** | 16px, Inter | 17px, SF-style stack |
| **Typography title** | 32px | 28px |
| **Typography label** | 14px | 13px |
| **Spacing** | padding 6/12/20/32…, gap same | 8px rhythm: 8/12/16/24/40… |
| **Button** | radius.md | radius.pill |
| **Stepper** | Track elevated, active = primary fill | Track surface.variant (gray), active = surface.card + soft shadow (segment style) |
| **Shadows** | elevation.low/mid (0.08–0.12 opacity) | Softer (0.04–0.06 opacity) |
| **Transitions** | 150–200ms | 180–220ms (slightly slower) |

---

## Tokens that now differ from default

When palette **apple** is selected, these token paths resolve to different values (examples):

- **color.primary** → #007AFF (was #1A6BD4)
- **surface.app**, **surface.section** → #F5F5F7 (was #F2F2F4 / #E6E6E8)
- **surface.variant** → #E5E5EA (was #E0E2E5)
- **textSize.body** → 17 (was 16), **textSize.title** → 28 (was 32), **textSize.sm** → 13 (was 14)
- **lineHeight.normal** → 1.47 (was 1.5), **lineHeight.title** → 1.22 (was 1.25)
- **padding.xs** → 8 (was 6), **padding.md** → 16 (was 20), **padding.lg** → 24 (was 32)
- **gap.*** → 8px-based (was 6/12/20…)
- **radius.md** → 10 (was 12), **radius.lg** → 12 (was 18)
- **elevation.low** → 0 1px 3px rgba(0,0,0,0.04) (was 0 3px 6px…)
- **fontFamily.sans/heading** → SF Pro stack (was Inter)
- **transition.base** → 220ms (was 200ms)

When **visualPreset = apple**:

- **Section**: shadow none, radius.lg, transition.slow
- **Card**: shadow elevation.low, radius.lg
- **Button**: radius.pill
- **Stepper**: surface.variant track, activeStep = surface.card + color.primary + elevation.low
- **Chip**: surface.variant, radius.pill

---

## Components that receive new values

| Component | Source of change | Effect |
|-----------|------------------|--------|
| **Section** | apple preset (section.surface) + apple palette (surface.section, radius.lg, shadow) | Warmer background, larger radius, no shadow, slower transition |
| **Card** | apple preset (card) + apple palette (elevation.low, radius, textRole) | Softer shadow, 17px body, 28px title from palette |
| **Stepper** | apple preset (stepper) + molecules.json variant (e.g. tab-segment) | Gray track, white active segment with soft shadow, primary text |
| **Button** | apple preset (button radius.pill) + apple palette (padding, radius.pill) | Pill shape, 8px-based padding |
| **Field** | apple palette (radius, border, padding) via field variant | 12px radius, refined padding |

---

## Why the UI will visibly differ

- **Typography:** Slightly smaller title (28 vs 32), slightly larger body (17 vs 16) and SF-style font make the journal feel calmer and more readable; labels at 13px are clearer but less dominant.
- **Surfaces:** Warm gray (#F5F5F7) reads as premium and calm; white cards with very soft shadows separate content without heavy elevation.
- **Stepper:** Segment-style (gray track, white active segment) reads as a single control (Think | Repent | Ask | Conform | Keep) instead of underline tabs.
- **Buttons:** Pill shape and 8px padding align with common “premium” patterns and 44px touch targets when combined with label size.
- **Spacing:** 8px rhythm and larger card/section padding (24px) give more breathing room between prompt, input, and action.

---

## How to see the Apple theme

1. Set **palette** to **apple** (e.g. palette picker in control dock or state.values.paletteName = "apple").
2. Set **visualPreset** to **apple** (e.g. pick a template that has visualPreset "apple", or set state.values.stylingPreset to "apple" if the UI supports it).
3. Load the journal screen (e.g. journal_track/journal_replicate or equivalent). The renderer will use profile.visualPreset and the selected palette; tokens resolve from apple.json and the apple preset.
