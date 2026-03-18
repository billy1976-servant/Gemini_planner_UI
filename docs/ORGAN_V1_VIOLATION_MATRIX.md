# Organ V1 Violation Matrix

**Authority:** BUILD_PROTOCOL (ORGAN)_V1.md. This matrix classifies every organ and organism against the protocol criteria. No code changes.

---

## 1. Matrix

| Organ/Organism name | Uses only 12 molecules? | No inline styles? | No layout hardcoding? | No engine logic? | No raw HTML primitives? | Deterministic? | Classification |
|---------------------|-------------------------|-------------------|------------------------|-----------------|-------------------------|----------------|----------------|
| BoardColumnOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| ColumnStripOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| DetailContentOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| EditorContentOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| FilterBarOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| GalleryGridOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| GridLayoutOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| LightboxOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| ListContentOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| ModalOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| PaginationBarOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| SelectionBarOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| SidebarOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| SplitPaneOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| TimelineLaneOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| TimelineLaneStripOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| TimelineRulerOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| ToolbarOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| WidgetCellOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| WizardStepContentOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| WizardStepStripOrgan | N | N | N | Y | N | Y | NON-COMPLIANT |
| OrganPanel | N | N | N | N | N | N | NON-COMPLIANT |
| NodeRegistry | N | N | N | Y | N | Y | NON-COMPLIANT |
| NodeRenderer | Y | Y | Y | Y | Y | Y | FULLY COMPLIANT |
| DevNodePanel | N | N | N | N | N | N | NON-COMPLIANT |
| WebsiteTemplate | N | N | N | Y | N | Y | NON-COMPLIANT |
| BoardOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| DashboardOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| DetailOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| EditorOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| GalleryOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| ListOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| TimelineOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |
| WizardOrganism | N | N | N | Y | N | Y | NON-COMPLIANT |

**Notes:**

- **Uses only 12 molecules?** N = component uses raw `<div>`, `<span>`, `<button>`, `<header>`, `<ul>`, `<li>`, etc., or does not compose the 12 contract molecules. NodeRenderer only delegates to other components and does not render structure itself → Y.
- **No engine logic?** N for OrganPanel (useState, .push) and DevNodePanel (useState). Organisms use useSyncExternalStore + createOnAction (registry delegation) — no engine logic in TSX → Y.
- **Deterministic?** N for OrganPanel and DevNodePanel (local state). NodeRenderer is pure delegation → Y. All other organs/organisms are deterministic given props/context (state read is external).

---

## 2. Summary

| Classification | Count |
|----------------|-------|
| FULLY COMPLIANT | 1 |
| PARTIALLY COMPLIANT | 0 |
| NON-COMPLIANT | 33 |

**Total:** 34 components (26 organs + 8 organisms).

- **FULLY COMPLIANT:** NodeRenderer.tsx only (delegation wrapper; no structure, no styles, no primitives).
- **NON-COMPLIANT:** All 21 canonical tsx-organs, OrganPanel, NodeRegistry, DevNodePanel, WebsiteTemplate, and all 8 tsx-organisms.

---

*End of matrix. Next: Phase 3 — FULL_ORGAN_V1_REFACTOR_PLAN.md.*
