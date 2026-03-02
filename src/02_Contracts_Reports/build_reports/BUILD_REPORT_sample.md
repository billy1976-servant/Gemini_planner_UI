# Build Report V2 (Contract-Governed)

Generated: 2025-03-01T12:00:00.000Z
Authority: `src/02_Contracts_Reports/contracts/` and APP_BUILD_PROTOCOL_V2.

---

## A. All available structure types

list, board, dashboard, editor, timeline, detail, wizard, gallery

---

## B. Selected structure type + why

(No structure type declared in scanned app.json metadata.)

---

## C. All available templates

- **list**: default, compact, dense, minimal
- **board**: default, minimal, pipeline, swimlanes
- **dashboard**: default, compact, single-column, wide
- **editor**: default, minimal, sidebar-left, fullscreen
- **timeline**: default, compact, day-only, week-month
- **detail**: default, minimal, detail-right, detail-bottom
- **wizard**: default, minimal, linear, branched
- **gallery**: default, minimal, masonry, uniform

---

## D. Selected template + why

(No template declared in scanned app.json metadata.)

---

## E. All available molecules (the fixed 12)

section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar

---

## F. Molecules used / selected

- **src/01_App/(dead) Json/apps/my-interface**: section, card, field, button, stepper, userinputviewer
- **src/01_App/(dead) Json/apps/templates/test-module**: (example)
- **src/01_App/(dead) Json/apps/templates/doctor**: (example)
- **src/01_App/(dead) Json/apps/hiclarify**: (example)
- **src/01_App/(dead) Json/apps/journal_track**: (example)

---

## G. All available engines

(Engines discovered at runtime from registry.)

---

## H. Engines used / selected

(None declared in scanned apps.)

---

## I. All available palettes

apple, crazy, dark, default, elderly, french, hiclarify, kids, playful, premium, spanish, ui-atom-token

---

## J. Palette used / selected

(No palette declared in scanned app.json metadata.)

---

## K. Blueprint node types used (and which molecules appear)

- **src/01_App/(dead) Json/apps/my-interface**: node types: screen, stepper, section, card, field, button, userinputviewer; molecules: section, card, field, button, stepper, userinputviewer

---

## L. Contract violations

- **HARD** [src/01_App/(dead) Json/apps/my-interface] MOLECULE_NOT_IN_SET: Molecule type "userinputviewer" is not in the fixed 12. Allowed: section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar.

---

## Five questions

- **What did I see?** Full authority surface above (structure types, templates, molecules, engines, palettes).
- **What did I choose?** Selections per app in sections B, D, F, H, J.
- **What did I invent?** Anything used that is not in the contract must appear in Violations (L).
- **What did I violate?** See section L (molecule set, structure type, template, TSX/palette rules).
- **What universal system did I extract?** Cross-app engines/behaviors must be registered and contract-aligned.
