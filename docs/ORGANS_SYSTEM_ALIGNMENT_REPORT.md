# Organs System Alignment Report

System-alignment pass for all organs under `src/04_Presentation/components/organs`: inventory, validation against layout, molecule contracts, palette, behavior, and state rules, and fixes applied.

---

## 1. Organs audited

| Organ | organId | Layout ID |
|-------|---------|-----------|
| ToolbarOrgan | toolbar | organ-toolbar |
| SidebarOrgan | sidebar | organ-sidebar |
| FilterBarOrgan | filterBar | organ-filterbar |
| PaginationBarOrgan | paginationBar | organ-paginationbar |
| SelectionBarOrgan | selectionBar | organ-selectionbar |
| ModalOrgan | modal | organ-modal |
| SplitPaneOrgan | splitPane | organ-splitpane |
| ListContentOrgan | listContent | organ-listcontent |
| ColumnStripOrgan | columnStrip | organ-columnstrip |
| BoardColumnOrgan | boardColumn | organ-boardcolumn |
| GridLayoutOrgan | gridLayout | organ-gridlayout |
| WidgetCellOrgan | widgetCell | organ-widgetcell |
| EditorContentOrgan | editorContent | organ-editorcontent |
| TimelineRulerOrgan | timelineRuler | organ-timelineruler |
| TimelineLaneStripOrgan | timelineLaneStrip | organ-timelinelanestrip |
| TimelineLaneOrgan | timelineLane | organ-timelinelane |
| DetailContentOrgan | detailContent | organ-detailcontent |
| WizardStepStripOrgan | wizardStepStrip | organ-wizardstepstrip |
| WizardStepContentOrgan | wizardStepContent | organ-wizardstepcontent |
| GalleryGridOrgan | galleryGrid | organ-gallerygrid |
| LightboxOrgan | lightbox | organ-lightbox |
| OrganPanel | (dev panel) | organ-panel |

All 21 TSX organs plus OrganPanel. Each TSX organ uses a single layout id from `layout-definitions.json`; OrganPanel is a dev-only layout control panel.

---

## 2. Violations found (before)

- **Palette (FilterBarOrgan):** `STANDALONE_PLACEHOLDER_STYLE` used fallback values `#64748b`, `0.875rem`, `8px` in `var(..., fallback)` — not valid palette-only usage.
- **Palette (GalleryGridOrgan):** Same pattern: `#64748b`, `0.875rem`, `12px` in placeholder style; placeholder was rendered with a raw `<div>` instead of a minimal span.
- **Organ layout profiles:** The 21 TSX organs were not in `organ-layout-profiles.json`, so `getOrganLayoutProfile(organId)` and `getInternalLayoutIds(organId)` returned null/[] for them.

---

## 3. Fixes applied (per organ)

- **FilterBarOrgan:** Placeholder style updated to palette-only tokens: `var(--color-text-secondary)`, `var(--font-size-sm)`, `var(--spacing-2) 0` with no comma fallbacks. Placeholder still rendered when `filterBar.controls` slot is empty; minimal `<span>` retained for standalone “no content” state per contract.
- **GalleryGridOrgan:** Placeholder style updated to palette-only: `var(--color-text-secondary)`, `var(--font-size-sm)`, `var(--spacing-3)` with no fallbacks. Raw `<div>` replaced with `<span>` for the standalone placeholder to avoid non-molecule div usage.
- **organ-layout-profiles.json:** Added 21 TSX organ entries, each with `internalLayoutIds: ["organ-<id>"]` and `defaultInternalLayoutId: "organ-<id>"` (e.g. toolbar → organ-toolbar, filterBar → organ-filterbar). No change to organ-registry VARIANTS; these organs remain single-variant.

---

## 4. Remaining system-level gaps (if any)

- **Extra `children` prop:** ColumnStripOrgan, GridLayoutOrgan, and TimelineLaneStripOrgan extend `OrganProps` with `children?: React.ReactNode`. Slots remain the primary API; children are kept for backward compatibility. Ensure blueprint/organism content is delivered via slots where possible; children should not bypass slot-based content.

---

## 5. Confirmation

- **No hardcoded styles:** Placeholder styles in FilterBarOrgan and GalleryGridOrgan use only `var(--*)` palette tokens; no hex, rem, or px fallbacks.
- **No illegal molecules:** All organs use only the Section compound; Section params used are `internalLayoutId` (and layout id for resolution), which are allowed.
- **All layout ids valid:** Every organ layout id (organ-toolbar through organ-lightbox, organ-panel) exists in `layout-definitions.json` under both `pageLayouts` and `componentLayouts`.
- **All behaviors registry-based:** No organ implements inline business logic or custom window listeners; OrganPanel uses `window.dispatchEvent("action", ...)` with Action params; TSX organs expose `onAction` only.
- **Organs registered where variant/profile support applies:** The 21 TSX organs are now in `organ-layout-profiles.json` with a single internal layout id each; they do not use the variant system in organ-registry VARIANTS (single implementation each).
