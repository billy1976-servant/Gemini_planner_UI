# REGISTRY_MAP.generated.md

From `src/engine/core/registry.tsx`. JSON `type` → React component. Actual registry source only.

---

## Table: JSON node type → React component → file path

| JSON node type | React component | File path (component) |
|----------------|-----------------|------------------------|
| screen | ({ children }) => &lt;&gt;{children}&lt;/&gt; | inline in registry.tsx |
| Screen | ({ children }) => &lt;&gt;{children}&lt;/&gt; | inline in registry.tsx |
| text | TextAtom | src/components/9-atoms/primitives/text |
| Text | TextAtom | src/components/9-atoms/primitives/text |
| media | MediaAtom | src/components/9-atoms/primitives/media |
| Media | MediaAtom | src/components/9-atoms/primitives/media |
| surface | SurfaceAtom | src/components/9-atoms/primitives/surface |
| Surface | SurfaceAtom | src/components/9-atoms/primitives/surface |
| sequence | SequenceAtom | src/components/9-atoms/primitives/sequence |
| Sequence | SequenceAtom | src/components/9-atoms/primitives/sequence |
| trigger | TriggerAtom | src/components/9-atoms/primitives/trigger |
| Trigger | TriggerAtom | src/components/9-atoms/primitives/trigger |
| collection | CollectionAtom | src/components/9-atoms/primitives/collection |
| Collection | CollectionAtom | src/components/9-atoms/primitives/collection |
| condition | ConditionAtom | src/components/9-atoms/primitives/condition |
| Condition | ConditionAtom | src/components/9-atoms/primitives/condition |
| shell | ShellAtom | src/components/9-atoms/primitives/shell |
| Shell | ShellAtom | src/components/9-atoms/primitives/shell |
| fieldatom | FieldAtom | src/components/9-atoms/primitives/field |
| FieldAtom | FieldAtom | src/components/9-atoms/primitives/field |
| textarea | FieldAtom | src/components/9-atoms/primitives/field |
| Textarea | FieldAtom | src/components/9-atoms/primitives/field |
| section | Section | src/compounds/ui/12-molecules/section.compound |
| Section | Section | src/compounds/ui/12-molecules/section.compound |
| button | Button | src/compounds/ui/12-molecules/button.compound |
| Button | Button | src/compounds/ui/12-molecules/button.compound |
| card | Card | src/compounds/ui/12-molecules/card.compound |
| Card | Card | src/compounds/ui/12-molecules/card.compound |
| avatar | Avatar | src/compounds/ui/12-molecules/avatar.compound |
| Avatar | Avatar | src/compounds/ui/12-molecules/avatar.compound |
| chip | Chip | src/compounds/ui/12-molecules/chip.compound |
| Chip | Chip | src/compounds/ui/12-molecules/chip.compound |
| field | Field | src/compounds/ui/12-molecules/field.compound |
| Field | Field | src/compounds/ui/12-molecules/field.compound |
| footer | Footer | src/compounds/ui/12-molecules/footer.compound |
| Footer | Footer | src/compounds/ui/12-molecules/footer.compound |
| list | List | src/compounds/ui/12-molecules/list.compound |
| List | List | src/compounds/ui/12-molecules/list.compound |
| modal | Modal | src/compounds/ui/12-molecules/modal.compound |
| Modal | Modal | src/compounds/ui/12-molecules/modal.compound |
| stepper | Stepper | src/compounds/ui/12-molecules/stepper.compound |
| Stepper | Stepper | src/compounds/ui/12-molecules/stepper.compound |
| toast | Toast | src/compounds/ui/12-molecules/toast.compound |
| Toast | Toast | src/compounds/ui/12-molecules/toast.compound |
| toolbar | Toolbar | src/compounds/ui/12-molecules/toolbar.compound |
| Toolbar | Toolbar | src/compounds/ui/12-molecules/toolbar.compound |
| UserInputViewer | userInputViewer | src/ui/user-input-viewer |
| userInputViewer | userInputViewer | src/ui/user-input-viewer |
| userinputviewer | userInputViewer | src/ui/user-input-viewer |
| JournalHistory | JournalHistory | src/ui/molecules/JournalHistory |
| journalHistory | JournalHistory | src/ui/molecules/JournalHistory |
| journalViewer | JournalHistory | src/ui/molecules/JournalHistory |
| journalhistory | JournalHistory | src/ui/molecules/JournalHistory |
| row | RowLayout | src/lib/layout/molecules/row-layout |
| Row | RowLayout | src/lib/layout/molecules/row-layout |
| column | ColumnLayout | src/lib/layout/molecules/column-layout |
| Column | ColumnLayout | src/lib/layout/molecules/column-layout |
| grid | GridLayout | src/lib/layout/molecules/grid-layout |
| Grid | GridLayout | src/lib/layout/molecules/grid-layout |
| stack | StackLayout | src/lib/layout/molecules/stack-layout |
| Stack | StackLayout | src/lib/layout/molecules/stack-layout |
| page | PageLayout | src/lib/layout/molecules/page-layout |
| Page | PageLayout | src/lib/layout/molecules/page-layout |

---

## Lookup in renderer

- **File**: `src/engine/core/json-renderer.tsx`
- **Code**: `const Component = (Registry as any)[resolvedNode.type];`
- **Fallback**: If !Component, render red div "Missing registry entry: &lt;type&gt;".
- **Definitions**: Variant/size use `definitions[profiledNode.type] ?? definitions[typeKey]` from `@/compounds/ui/index` (definitions, not Registry).

---

## Note

`json-skin` is not in Registry; it is handled explicitly in renderNode and rendered by JsonSkinEngine.
