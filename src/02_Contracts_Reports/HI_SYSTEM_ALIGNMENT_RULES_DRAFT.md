# HI System Alignment Rules (Draft)

**Status:** Draft — no enforcement yet. Foundation for future stabilization.

**Related:** SYSTEM_ALIGNMENT_AUDIT_ARTIFACT.md, 07_SYSTEM_MAP.md, 03_ENGINE_SYSTEM.md, 05_LAYOUT_SYSTEM.md, JSON_DRIVEN_VIOLATIONS.generated.md.

---

## 1. Globally controlled

- **Palette:** state-store (paletteName) → palette-store fallback → palette-resolver + palette-bridge; no second palette source.
- **Layout:** layout-store + template + overrides → getSectionLayoutId → LayoutMoleculeRenderer; no inline layout IDs in JSON (stripped by applyProfileToNode).
- **Behavior:** behavior-listener → interpretRuntimeVerb → action-registry / dispatchState; JSON intents only.
- **Screen load:** loadScreen + /api/screens; path is the only input.
- **Component registry:** Registry in registry.tsx for JSON node types only.

---

## 2. What TSX is allowed to own

- **Tool engines (A):** custom layout and local styling; may use palette tokens optionally.
- **App screens (B):** may own layout when not section-based; should use palette when in same chrome as JSON.
- **Shell/wrapper (C):** only visual structure; no behavior beyond what layout.tsx wires.

---

## 3. What must always align to JSON

- Any node type rendered by JsonRenderer must exist in Registry.
- Section/card layout must come from layout resolver (override → node → template → default).
- Visibility (experience + depth) from getExperienceVisibility; conditional visibility from node.when + shouldRenderNode.

---

## 4. Where wrappers are allowed

- **layout.tsx:** MobileShell, PipelineDiagnosticsRail, OSBCaptureModal, DevHome.
- **Inside app-content:** OSBBar, TopTextNav (layout.tsx children).
- No additional global wrappers outside layout.tsx without designating them in this document.

---

## 5. Where overlays are allowed

- **Global:** only from layout.tsx (diagnostics rail, modal, mobile shell).
- **Local:** inside TSX screens (modals, toolbars) without escaping the stage.

---

## 6. Where engines are injected

- **JSON trunk:** JsonSkinEngine only (for type === "json-skin"); action-registry for behaviors.
- **Flow/TSX path:** engine-registry + flow-loader + FlowRenderer / engine-viewer via dynamic load; documented as secondary path.

---

## 7. TSX alignment checklist (proposed)

When adding or changing TSX screens:

1. Renders inside layout shell (stage-center / json-stage or phone frame).
2. Uses palette tokens if in themed app list.
3. Does not mount global overlays.
4. Documents if it is a tool engine (category A).

---

## 8. References

- **System map:** system-architecture/07_SYSTEM_MAP.md
- **Engine system:** system-architecture/03_ENGINE_SYSTEM.md
- **Layout system:** system-architecture/05_LAYOUT_SYSTEM.md
- **JSON violations:** docs/SYSTEM_INTELLIGENCE_AUTOGEN/JSON_DRIVEN_VIOLATIONS.generated.md
- **Audit artifact:** system-architecture/SYSTEM_ALIGNMENT_AUDIT_ARTIFACT.md
