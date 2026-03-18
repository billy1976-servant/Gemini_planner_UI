# Organisms Architecture Plan — 8 TSX Organisms (System-Pure)

## Overview

Eight organism compositions use only: TSX organs, TSX molecules/atoms, state-store (`subscribeState`/`getState`), action-registry verbs, and `dispatchOrganAction`. No JsonRenderer, no JSON screen files, no new UI primitives, no engine logic inside organs.

---

## 1. ListOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, FilterBarOrgan, ListContentOrgan, PaginationBarOrgan, SelectionBarOrgan, ModalOrgan (e.g. confirm delete).

**Slot content (molecules/atoms):**

- Toolbar: button (Add, View), text (breadcrumb), chip or button (view toggles).
- Sidebar: list.compound or text (nav).
- FilterBar: field.compound, chip.compound (filters).
- ListContent: listContent.header = text; listContent.items = list of items (each: text + button Up/Down/Delete); listContent.emptyState = text.
- PaginationBar: text (Page N), button (Prev/Next).
- SelectionBar: text (N selected), button (Clear, actions).
- Modal: modal.title, modal.content = text + button Confirm/Cancel (when confirmDeleteId set).

**State keys read:** `values.structure.items`, `values.structure.itemOrder`, `values.listConfirmDeleteId` (optional, for modal).

**Verbs dispatched:** `structure:reorderItems` (fromIndex, toIndex), `structure:deleteItem` (id), `structure:addItem` (payload), `state.update` (e.g. listConfirmDeleteId).

**Modal usage:** When user clicks Delete, set confirm id in state and show ModalOrgan with Confirm/Cancel; Confirm dispatches structure:deleteItem and clears confirm id.

---

## 2. BoardOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, FilterBarOrgan, ColumnStripOrgan, BoardColumnOrgan, SelectionBarOrgan, ModalOrgan (optional confirm).

**Slot content:**

- Toolbar: button, text (breadcrumb), view toggles.
- Sidebar: nav list.
- FilterBar: filter controls (field/chip).
- ColumnStrip: columnStrip.title = text; children = BoardColumnOrgan per column.
- BoardColumn: boardColumn.header = column name; boardColumn.cards = card.compound per item (with Move to column buttons); boardColumn.footer = button Add card.
- SelectionBar: text, button.

**State keys read:** `values.structure.tree`, `values.structure.items`, `values.structure.itemOrder`.

**Verbs dispatched:** `structure:moveItem` (id, toContainerId), `structure:reorderItems`, `structure:deleteItem`, `structure:addItem`, `structure:addTreeNode` (for new column).

**Modal:** Optional: confirm delete or confirm move.

---

## 3. DashboardOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, GridLayoutOrgan, WidgetCellOrgan, ModalOrgan (e.g. widget config).

**Slot content:**

- Toolbar: button (Add widget), text (breadcrumb), view toggles.
- Sidebar: nav.
- GridLayoutOrgan: gridLayout.title = text; children = WidgetCellOrgan per widget (from state.dashboardLayout[screenKey].widgets).
- WidgetCellOrgan: widgetCell.content = card or text + button Remove.
- Modal: optional widget config (field.compound, button).

**State keys read:** `dashboardLayout[screenKey].widgets` (array of { id, x, y, w, h }).

**Verbs dispatched:** `dashboard:setLayout` (screenKey, widgets), `dashboard:addWidget` (screenKey, widgetId, rect), `dashboard:removeWidget` (screenKey, widgetId).

**Grid/WidgetCell:** Dashboard MUST use GridLayoutOrgan as container and WidgetCellOrgan per widget; layout from state; add/remove/setLayout via verbs only.

---

## 4. EditorOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, EditorContentOrgan, SplitPaneOrgan (e.g. preview), ModalOrgan (optional).

**Slot content:**

- Toolbar: button (Save, etc.), text (breadcrumb).
- Sidebar: nav / outline.
- EditorContent: editorContent.toolbar = button (format); editorContent.body = field/textarea bound to draft.
- SplitPane: splitPane.primary = EditorContent area; splitPane.secondary = preview (text/section).
- Modal: optional (e.g. settings).

**State keys read:** `values.editorDraft` (and optional preview key).

**Verbs dispatched:** `state.update` (key: editorDraft, value).

**SplitPane usage:** Primary = editor, secondary = preview panel.

---

## 5. TimelineOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, FilterBarOrgan, TimelineRulerOrgan, TimelineLaneStripOrgan, TimelineLaneOrgan, SelectionBarOrgan.

**Slot content:**

- Toolbar: button, text (breadcrumb).
- Sidebar: nav.
- FilterBar: filter controls.
- TimelineRuler: timelineRuler.label = text (e.g. date range).
- TimelineLaneStrip: timelineLaneStrip.title = text; children = TimelineLaneOrgan per date/lane.
- TimelineLane: timelineLane.label = date/key; timelineLane.events = list of blocks (card or text + reorder/move buttons).
- SelectionBar: text, button.

**State keys read:** `values.structure.blocksByDate`, `values.structure.items`, `values.structure.itemOrder`.

**Verbs dispatched:** `structure:setBlocksForDate`, `structure:reorderItems`, `structure:moveItem`, `calendar:setDay` / `calendar:setWeek` / `calendar:setMonth` (if used).

---

## 6. DetailOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, DetailContentOrgan, SplitPaneOrgan (list + detail), ModalOrgan (optional), SelectionBarOrgan.

**Slot content:**

- Toolbar: button, text (breadcrumb).
- Sidebar: nav.
- SplitPane: splitPane.primary = list (list items, click sets detailSelectedId); splitPane.secondary = DetailContentOrgan.
- DetailContent: detailContent.body = section + text + button (Delete) for selected item; detailContent.emptyState = text when no selection.
- SelectionBar: text (selection count), button.
- Modal: optional confirm delete.

**State keys read:** `values.structure.items`, `values.detailSelectedId`.

**Verbs dispatched:** `state.update` (key: detailSelectedId), `structure:deleteItem` (id).

**SplitPane usage:** List in primary, detail in secondary.

---

## 7. WizardOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, WizardStepStripOrgan, WizardStepContentOrgan, ModalOrgan (optional).

**Slot content:**

- Toolbar: text (breadcrumb).
- Sidebar: nav (optional step links).
- WizardStepStrip: wizardStepStrip.steps = stepper.compound or text (Step N of M); wizardStepStrip.nav = button (Prev, Next, Go to 1).
- WizardStepContent: wizardStepContent.body = section + field + button (step content).
- Modal: optional (e.g. help).

**State keys read:** `values.wizardStepIndex_<flowId>`, `values.wizardStepCount_<flowId>`. No engine-bridge in organism.

**Verbs dispatched:** `wizard:next` (flowId), `wizard:prev` (flowId), `wizard:goTo` (flowId, stepIndex), `state.update` (to seed step count on mount if needed).

**No engine-bridge:** Wizard uses only state.values and registered wizard verbs; step count seeded via state.update or default state.

---

## 8. GalleryOrganism

**Composed organs:** ToolbarOrgan, SidebarOrgan, FilterBarOrgan, GalleryGridOrgan, LightboxOrgan, ModalOrgan, SelectionBarOrgan.

**Slot content:**

- Toolbar: button, text (breadcrumb).
- Sidebar: nav.
- FilterBar: filter controls.
- GalleryGrid: galleryGrid.header = text; galleryGrid.items = grid of cards/thumbnails (each clickable to set galleryLightboxId); galleryGrid.emptyState = text.
- ModalOrgan: when galleryLightboxId is set, render ModalOrgan with LightboxOrgan inside (lightbox.item = selected item content, lightbox.caption = text). Close button dispatches state.update to clear galleryLightboxId.
- SelectionBar: text, button.

**State keys read:** `values.structure.items`, `values.structure.itemOrder`, `values.galleryLightboxId`.

**Verbs dispatched:** `structure:reorderItems`, `structure:deleteItem`, `state.update` (key: galleryLightboxId for open/close).

**Lightbox + Modal:** LightboxOrgan is rendered inside ModalOrgan when galleryLightboxId is set; closing uses state.update only (no JSON, no new primitives).

---

## Cross-Cutting Rules

- **State:** Subscribe via `subscribeState` / `getState` only.
- **Actions:** All mutations via `dispatchOrganAction` → behavior-listener → action-registry or state.update path.
- **Reorder:** `structure:reorderItems` (fromIndex, toIndex).
- **Move (e.g. card to column):** `structure:moveItem` (id, toContainerId).
- **Dashboard layout:** `dashboard:setLayout`, `dashboard:addWidget`, `dashboard:removeWidget`.
- **Drag:** Any drag that changes order/layout must dispatch the above verbs (no logic inside organs).
- **No logic inside organs:** Organs only receive slots and onAction; organisms compute slot content from state and pass handlers that call onAction.

---

## Organ Coverage (All 21 Used)

| Organ | Used in |
|-------|---------|
| ToolbarOrgan | All 8 |
| SidebarOrgan | All 8 |
| FilterBarOrgan | List, Board, Timeline, Gallery |
| PaginationBarOrgan | List |
| ModalOrgan | List, Board, Dashboard, Editor, Detail, Wizard, Gallery |
| SelectionBarOrgan | List, Board, Timeline, Detail, Gallery |
| SplitPaneOrgan | Editor, Detail |
| ListContentOrgan | List |
| ColumnStripOrgan | Board |
| BoardColumnOrgan | Board |
| GridLayoutOrgan | Dashboard |
| WidgetCellOrgan | Dashboard |
| EditorContentOrgan | Editor |
| TimelineRulerOrgan | Timeline |
| TimelineLaneStripOrgan | Timeline |
| TimelineLaneOrgan | Timeline |
| DetailContentOrgan | Detail |
| WizardStepStripOrgan | Wizard |
| WizardStepContentOrgan | Wizard |
| GalleryGridOrgan | Gallery |
| LightboxOrgan | Gallery (inside Modal) |
