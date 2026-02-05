# SCREEN_JSON_SCHEMA.generated.md

Runtime-supported JSON node schema derived from json-renderer, registry, layout resolvers, and behavior listener. Not a design guess.

---

## Root / screen document

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `id` | — | ✓ | e.g. "screenRoot"; not used for routing | — |
| `type` | — | ✓ | "screen" / "Screen" → passthrough wrapper | `src/engine/core/registry.tsx` |
| `state` | — | ✓ | Default state; applied on load if `state.currentView` present | `src/engine/core/screen-loader.ts` |
| `state.currentView` | — | ✓ | Initial view key; triggers `dispatchState("state:currentView", { value })` | `src/engine/core/screen-loader.ts` |
| `root` | — | ✓ | Preferred root node for rendering | `src/app/page.tsx` |
| `screen` | — | ✓ | Fallback root key | `src/app/page.tsx` |
| `node` | — | ✓ | Fallback root key | `src/app/page.tsx` |
| `children` | — | ✓ | Fallback: root is object with children | `src/app/page.tsx` |
| `data` | — | ✓ | Passed to `applySkinBindings` | `src/app/page.tsx` |

---

## Per-node (generic)

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `type` | ✓ | — | Must match Registry key (case-sensitive then lower); missing → red "Missing registry entry" | `src/engine/core/json-renderer.tsx` (Registry lookup) |
| `id` | — | ✓ | Used for key, debug, `data-node-id`, section key when no role | `src/engine/core/json-renderer.tsx`, `applyProfileToNode` |
| `role` | — | ✓ | Section role (hero, features, etc.); used for template slot, organ id, compatibility | `src/engine/core/json-renderer.tsx`, `src/layout/compatibility/content-capability-extractor.ts` |
| `variant` | — | ✓ | Definition-driven: def.variants[variant] else "default"/"filled"/first key | `src/engine/core/json-renderer.tsx` |
| `size` | — | ✓ | def.sizes[size] else "md" | `src/engine/core/json-renderer.tsx` |
| `params` | — | ✓ | Merged with visual preset, variant, size; section: layout keys stripped in applyProfileToNode | `src/engine/core/json-renderer.tsx` |
| `content` | — | ✓ | Passed to component; slot content per compound | `src/engine/core/json-renderer.tsx` |
| `children` | — | ✓ | Array of nodes; recursive renderNode | `src/engine/core/json-renderer.tsx` |
| `items` | — | ✓ | Repeater: render each as Card; `params.repeater.itemType` (default "card") | `src/engine/core/json-renderer.tsx` |
| `behavior` | — | ✓ | Stripped for section, field, avatar; for modal stripped unless close-only | `src/engine/core/json-renderer.tsx` (`shouldStripBehavior`) |
| `onTap` | — | ✓ | Passed through to component | `src/engine/core/json-renderer.tsx` |
| `when` | — | ✓ | Conditional visibility: `when.state`, `when.equals`; render only if state[key] === equals | `src/engine/core/json-renderer.tsx` (`shouldRenderNode`) |
| `layout` | — | ✓ | Section only: explicit layout id string; applied after overrides, before template default; then passed to Section, stripped from other nodes | `src/engine/core/json-renderer.tsx` (`applyProfileToNode`) |

---

## Expected params (diagnostic only, trace=ui)

Source: `EXPECTED_PARAMS` in `src/engine/core/json-renderer.tsx`.

| typeKey | Expected param keys |
|---------|---------------------|
| button | surface, label, trigger |
| section | surface, title |
| card | surface, title, body, media |
| toolbar | surface, item |
| list | surface, item |
| footer | surface, item |

---

## Behavior stripping rules

| Rule | File | Logic |
|------|------|--------|
| NON_ACTIONABLE_TYPES | `src/engine/core/json-renderer.tsx` | Types `section`, `field`, `avatar` → behavior set to `{}` |
| Modal non-close | `src/engine/core/json-renderer.tsx` | If type `modal` and behavior is not close-only (Navigation verb "close" or Action name "close") → strip |
| Close-only | `src/engine/core/json-renderer.tsx` | `isCloseOnlyBehavior`: Navigation params.verb === "close" or Action params.name === "close" |

---

## Repeater (items)

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `items` | — | ✓ | Non-empty array; each item rendered as Card (or feature-card → Card) | `src/engine/core/json-renderer.tsx` |
| Item shape | — | id, title, body, icon/image, params | `itemNode` built with type Card, content.title/body/media from item | `src/engine/core/json-renderer.tsx` |
| `params.repeater.itemType` | — | ✓ | "card" | "feature-card" → Card | `src/engine/core/json-renderer.tsx` |

---

## Section-specific

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `layout` | — | ✓ | String layout id; precedence: organ/store override > node.layout > template defaultSectionLayoutId | `src/engine/core/json-renderer.tsx` |
| params stripped at runtime | — | moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split | Section layout from layout engine only | `src/engine/core/json-renderer.tsx` (`applyProfileToNode`) |
| Section key | — | id ?? role ?? "" | Used for override maps | `src/engine/core/json-renderer.tsx` |

---

## Card (in section)

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| Card preset | — | ✓ | When parent section has cardLayoutPresetOverrides, getCardLayoutPreset merged into params (mediaPosition, contentAlign) | `src/engine/core/json-renderer.tsx` |

---

## Field → state binding

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `params.field.fieldKey` | — | ✓ | If string, value from stateSnapshot.values[fieldKey] or stateSnapshot[fieldKey] injected into params.field.value | `src/engine/core/json-renderer.tsx` |

---

## JournalHistory

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `params.track` | — | ✓ | String; entries = getState()?.journal?.[track]?.entry (array or single string) | `src/engine/core/json-renderer.tsx` |

---

## json-skin

| Field | Required | Optional | Notes | Enforced in |
|-------|----------|----------|--------|-------------|
| `type` | ✓ | — | "json-skin" | Rendered by JsonSkinEngine, not Registry | `src/engine/core/json-renderer.tsx` |

---

## Layout (section) resolution

- Section layout id: from `getDefaultSectionLayoutId(templateId)` in `src/layout/page/page-layout-resolver.ts` (templates.json: templateId.defaultLayout).
- Page layout definitions: `src/layout/page/page-layouts.json` (containerWidth, split, backgroundVariant).
- Component (moleculeLayout) definitions: `src/layout/component/component-layouts.json` (type, preset, params).
- Resolver: `resolveLayout(layout, context)` in `src/layout/resolver/layout-resolver.ts` merges page + component.

---

## Behavior object shape (listener expectations)

| type | params used | File |
|------|-------------|------|
| Navigation | to, screenId, target; verb (go, close, etc.) | `src/engine/core/behavior-listener.ts`, `src/compounds/ui/12-molecules/button.compound.tsx` |
| Action | name (state:currentView, state.update, journal.add, navigate, tap, go, back, open, close, route, crop, filter, frame, layout, motion, overlay, visual-proof), target, valueFrom, value, fieldKey, key, track | `src/engine/core/behavior-listener.ts` |
| Interaction | detail passed to interaction listener | `src/engine/core/behavior-listener.ts` |

---

## Node types in Registry (runtime truth)

See REGISTRY_MAP.generated.md. Lookup: `(Registry as any)[resolvedNode.type]`; fallback to `definitions[type]` / `definitions[typeKey]` for variant/size; component from Registry only. Missing type → red div "Missing registry entry: &lt;type&gt;".
