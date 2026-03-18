# System Component Audit — TSX Organs and Reusable Components

## 1. Full List of TSX Organs

All 21 canonical TSX organs (from `src/04_Presentation/components/organs/tsx-organs/`):

| # | Organ | File | Slot keys (canonical) |
|---|-------|------|------------------------|
| 1 | ToolbarOrgan | ToolbarOrgan.tsx | toolbar.actions, toolbar.breadcrumb, toolbar.viewToggles |
| 2 | SidebarOrgan | SidebarOrgan.tsx | sidebar.content |
| 3 | FilterBarOrgan | FilterBarOrgan.tsx | filterBar.controls |
| 4 | PaginationBarOrgan | PaginationBarOrgan.tsx | paginationBar.label, paginationBar.extra |
| 5 | ModalOrgan | ModalOrgan.tsx | modal.title, modal.content |
| 6 | SelectionBarOrgan | SelectionBarOrgan.tsx | selectionBar.label, selectionBar.actions |
| 7 | SplitPaneOrgan | SplitPaneOrgan.tsx | splitPane.primary, splitPane.secondary |
| 8 | ListContentOrgan | ListContentOrgan.tsx | listContent.header, listContent.items, listContent.emptyState |
| 9 | ColumnStripOrgan | ColumnStripOrgan.tsx | columnStrip.title, columnStrip.children (children prop) |
| 10 | BoardColumnOrgan | BoardColumnOrgan.tsx | boardColumn.header, boardColumn.cards, boardColumn.footer |
| 11 | GridLayoutOrgan | GridLayoutOrgan.tsx | gridLayout.title, gridLayout.cells (children) |
| 12 | WidgetCellOrgan | WidgetCellOrgan.tsx | widgetCell.content |
| 13 | EditorContentOrgan | EditorContentOrgan.tsx | editorContent.toolbar, editorContent.body |
| 14 | TimelineRulerOrgan | TimelineRulerOrgan.tsx | timelineRuler.label |
| 15 | TimelineLaneStripOrgan | TimelineLaneStripOrgan.tsx | timelineLaneStrip.title, children (lanes) |
| 16 | TimelineLaneOrgan | TimelineLaneOrgan.tsx | timelineLane.label, timelineLane.events |
| 17 | DetailContentOrgan | DetailContentOrgan.tsx | detailContent.body, detailContent.emptyState |
| 18 | WizardStepStripOrgan | WizardStepStripOrgan.tsx | wizardStepStrip.steps, wizardStepStrip.nav |
| 19 | WizardStepContentOrgan | WizardStepContentOrgan.tsx | wizardStepContent.body |
| 20 | GalleryGridOrgan | GalleryGridOrgan.tsx | galleryGrid.header, galleryGrid.items, galleryGrid.emptyState |
| 21 | LightboxOrgan | LightboxOrgan.tsx | lightbox.item, lightbox.caption |

**Other organs (not part of 8-structure contract):**

- `OrganPanel.tsx` — layout/organ override panel (dev)
- `src/04_Presentation/components/organs/tsx/website/`: DevNodePanel, WebsiteTemplate, NodeRegistry, NodeRenderer

---

## 2. Full List of TSX Reusable Components

### Molecules (`src/04_Presentation/components/molecules/`)

| # | Component | File |
|---|-----------|------|
| 1 | toolbar.compound | toolbar.compound.tsx |
| 2 | toast.compound | toast.compound.tsx |
| 3 | footer.compound | footer.compound.tsx |
| 4 | list.compound | list.compound.tsx |
| 5 | chip.compound | chip.compound.tsx |
| 6 | field.compound | field.compound.tsx |
| 7 | button.compound | button.compound.tsx |
| 8 | card.compound | card.compound.tsx |
| 9 | section.compound | section.compound.tsx |
| 10 | modal.compound | modal.compound.tsx |
| 11 | stepper.compound | stepper.compound.tsx |
| 12 | BeforeAfterSlider | BeforeAfterSlider.tsx |
| 13 | avatar.compound | avatar.compound.tsx |

### Atoms (`src/04_Presentation/components/atoms/`)

| # | Atom | File |
|---|------|------|
| 1 | condition | condition.tsx |
| 2 | sequence | sequence.tsx |
| 3 | shell | shell.tsx |
| 4 | media | media.tsx |
| 5 | surface | surface.tsx |
| 6 | field | field.tsx |
| 7 | focus-ring | focus-ring.tsx |
| 8 | trigger | trigger.tsx |
| 9 | collection | collection.tsx |
| 10 | skeleton | skeleton.tsx |
| 11 | spinner | spinner.tsx |
| 12 | text | text.tsx |

**Note:** Organs do not import molecules/atoms internally; they are layout-only and accept `slots` / `children`. Usage = organisms (or slot content) pass these components into organ slots.

---

## 3. Organ → Component Usage Map

Logical slot content (molecules/atoms) per organ:

| Organ | Suggested slot content (molecules/atoms) |
|-------|------------------------------------------|
| ToolbarOrgan | button.compound, chip.compound, toolbar.compound (nested) |
| SidebarOrgan | list.compound, section.compound, trigger, text |
| FilterBarOrgan | field.compound, chip.compound, button.compound |
| PaginationBarOrgan | button.compound, text |
| ModalOrgan | modal.compound (or title/text + content), button.compound |
| SelectionBarOrgan | button.compound, text |
| SplitPaneOrgan | Any (primary/secondary hold arbitrary content; list + detail, editor + preview) |
| ListContentOrgan | list.compound, text, card.compound (per item), button.compound |
| ColumnStripOrgan | text (title), BoardColumnOrgan children |
| BoardColumnOrgan | card.compound (cards slot), button.compound (footer), text |
| GridLayoutOrgan | WidgetCellOrgan (children), text (title) |
| WidgetCellOrgan | card.compound, text, skeleton, spinner |
| EditorContentOrgan | field.compound / field (body), button.compound (toolbar), text |
| TimelineRulerOrgan | text |
| TimelineLaneStripOrgan | text (title), TimelineLaneOrgan children |
| TimelineLaneOrgan | card.compound, text, trigger |
| DetailContentOrgan | section.compound, text, button.compound, card.compound |
| WizardStepStripOrgan | stepper.compound, button.compound (nav), text |
| WizardStepContentOrgan | section.compound, field.compound, button.compound, text |
| GalleryGridOrgan | card.compound, media, avatar.compound (items), text |
| LightboxOrgan | media, text (caption) |

---

## 4. Unused Components (Pre-Organism Implementation)

Before the 8 organisms are fully built with exhaustive usage:

- **Molecules:** toast.compound, footer.compound — typically used at app/screen level; can be used in a dedicated slot (e.g. Sidebar footer, or a toast slot in Toolbar) if desired.
- **Molecules:** BeforeAfterSlider — can be used in DetailOrganism or EditorOrganism (e.g. compare view).
- **Atoms:** condition, sequence, shell — compositional; can wrap slot content in organisms where conditional/sequential rendering is needed.
- **Atoms:** focus-ring, collection — can be used in list/grid slot content for a11y or list semantics.

After Phase 4 (exhaustive enforcement), every molecule and atom should appear in at least one organism’s slot content or be explicitly documented as optional/screen-level.

---

## 5. Exhaustive Usage Enforcement (Phase 4)

### Organ coverage

Every TSX organ (21) is used in at least one of the 8 organisms:

| Organ | Used in |
|-------|---------|
| ToolbarOrgan | All 8 |
| SidebarOrgan | All 8 |
| FilterBarOrgan | List, Board, Timeline, Gallery |
| PaginationBarOrgan | List |
| ModalOrgan | List (confirm delete), Gallery (lightbox) |
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

### Missing handlers

- Unhandled actions are logged by the global behavior-listener (`console.warn("[action] Unhandled action:", actionName)`).
- In development, `createOnAction()` in `tsx-organisms/shared.ts` logs every dispatch as `[tsx-organisms] dispatchOrganAction <name> <payload>` for traceability.
