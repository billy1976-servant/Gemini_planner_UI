# Components Consolidation Plan

**Goal:** Single tree under `src/components` with atoms, molecules, organs; one `atoms.json`, one `molecules.json`; 9 atoms (no select in registry), 12–14 molecules; remove blocks layer and old paths. No revert—execute from current state.

**Ground truth:** `public/manifests/components513.txt`, `public/manifests/compounds513.txt`.

---

## Target structure (final)

```
src/components/
  atoms/
    atoms.json          # single merged atom definitions (9 atoms)
    collection.tsx
    condition.tsx
    field.tsx
    media.tsx
    sequence.tsx
    shell.tsx
    surface.tsx
    text.tsx
    trigger.tsx
    index.ts             # re-exports primitives
  molecules/
    molecules.json       # single molecule definitions (from blocks/molecule-definitions.json)
    avatar.compound.tsx
    button.compound.tsx
    card.compound.tsx
    chip.compound.tsx
    field.compound.tsx
    footer.compound.tsx
    list.compound.tsx
    modal.compound.tsx
    navigation.compound.tsx
    pricing-table.compound.tsx
    section.compound.tsx
    stepper.compound.tsx
    toast.compound.tsx
    toolbar.compound.tsx
    index.ts             # re-exports getCompoundComponent or registry map
  organs/                # moved from src/organs
    (existing organs content)
  site/
  siteRenderer/
  system/
```

**Removed after consolidation:** `src/blocks/`, `src/components/9-atoms/`, `src/compounds/`.  
**Updated:** All engine and app imports to use `@/components/atoms`, `@/components/molecules`, `@/components/organs` and the two JSON files.

---

## Phase 1: Create new folders and single definition files

1. **Create directories**
   - `src/components/atoms/`
   - `src/components/molecules/`
   - `src/components/organs/` (will be filled in Phase 3)

2. **Create `src/components/atoms/atoms.json`**
   - Merge from `src/blocks/atoms.manifest.json` (field `atoms`) + any needed keys from `src/blocks/atom-definitions/*.json`.
   - Include only the 9 atoms: `collection`, `condition`, `field`, `media`, `sequence`, `shell`, `surface`, `text`, `trigger`. Do **not** include `select`.

3. **Create `src/components/molecules/molecules.json`**
   - Copy content from `src/blocks/molecule-definitions.json` (already one file). Place at `src/components/molecules/molecules.json`.

---

## Phase 2: Move atom and molecule implementations

4. **Move atom primitives (9 files)**
   - From `src/components/9-atoms/primitives/` move into `src/components/atoms/`:
     - `collection.tsx`, `condition.tsx`, `field.tsx`, `media.tsx`, `sequence.tsx`, `shell.tsx`, `surface.tsx`, `text.tsx`, `trigger.tsx`.
   - Do **not** move `select.tsx` (to be dropped from registry; file can remain under 9-atoms until cleanup or be deleted later).

5. **Create `src/components/atoms/index.ts`**
   - Re-export the 9 atom components (named exports, e.g. `TextAtom`, `SurfaceAtom`, …).

6. **Move molecule compounds (14 files)**
   - From `src/compounds/ui/12-molecules/` move into `src/components/molecules/`:
     - `avatar.compound.tsx`, `button.compound.tsx`, `card.compound.tsx`, `chip.compound.tsx`, `field.compound.tsx`, `footer.compound.tsx`, `list.compound.tsx`, `modal.compound.tsx`, `navigation.compound.tsx`, `pricing-table.compound.tsx`, `section.compound.tsx`, `stepper.compound.tsx`, `toast.compound.tsx`, `toolbar.compound.tsx`.

7. **Create `src/components/molecules/index.ts`**
   - Export a `getCompoundComponent(id: string)` (or a registry map) that imports the 14 compound components and returns the correct one by id (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar, navigation, pricing-table). Same behavior as current `blocks/compound-runtime-adapter.ts` but from local files.

---

## Phase 3: Move organs and update organ imports

8. **Move `src/organs/*` to `src/components/organs/`**
   - Move every file and directory under `src/organs/` into `src/components/organs/` (preserve internal structure: content-section, cta, faq, header, hero, etc., plus OrganPanel.tsx, index.ts, resolve-organs.ts, organ-registry.ts, tests, etc.).

9. **Update all imports of `@/organs` to `@/components/organs`**
   - `src/components/molecules/section.compound.tsx` (after move): `loadOrganVariant` from `@/components/organs`.
   - `src/app/page.tsx`: `@/components/organs` and `OrganPanel` from `@/components/organs/OrganPanel`.
   - `src/lib/site-skin/SiteSkin.tsx`: `@/components/organs`.
   - `src/layout/page/section-helpers.ts`: `getOrganLabel` from `@/components/organs`.
   - `src/organs/OrganPanel.tsx` (now `src/components/organs/OrganPanel.tsx`): if it imports from `@/organs`, change to `@/components/organs` or relative.
   - `src/organs/index.ts` (now `src/components/organs/index.ts`): update comment to say `@/components/organs`; keep relative internal imports as-is.

---

## Phase 4: Point engine at new locations (no blocks)

10. **Registry (`src/engine/core/registry.tsx`)**
    - Replace atom imports from `@/components/9-atoms/primitives/*` with imports from `@/components/atoms` (use the new index or named imports: TextAtom, MediaAtom, SurfaceAtom, SequenceAtom, TriggerAtom, CollectionAtom, ConditionAtom, ShellAtom, FieldAtom).
    - Remove `SelectAtom` and the `select` / `Select` registry entries.
    - Replace `getCompoundComponent` from `@/blocks/compound-runtime-adapter` with the new `getCompoundComponent` (or registry) from `@/components/molecules`.

11. **Json-renderer (`src/engine/core/json-renderer.tsx`)**
    - Change `import definitions from "@/blocks/molecule-definitions.json"` to `import definitions from "@/components/molecules/molecules.json"`.

12. **Styler (`src/engine/core/styler.tsx`)**
    - Remove dependency on `@/blocks/blocks-runtime-config` and `@/blocks/atom-defs-adapter`.
    - Build atom definitions from `@/components/atoms/atoms.json` only (single source). Optionally keep merging with `@/registry/atoms.json` for backward compatibility, or migrate styler to use only `components/atoms/atoms.json` and then deprecate `registry/atoms.json` for definition content.
    - Keep using `@/registry/molecules.json` for now or replace with `@/components/molecules/molecules.json` so one source for molecule styling.

13. **LayoutMoleculeRenderer (`src/layout/renderer/LayoutMoleculeRenderer.tsx`)**
    - Change atom imports from `@/components/9-atoms/primitives/*` to `@/components/atoms` (surface, text, sequence, collection).

14. **Molecule compound files (all 14 in `src/components/molecules/`)**
    - Update every atom import from `@/components/9-atoms/primitives/*` to `@/components/atoms` (e.g. `import TextAtom from "@/components/atoms"` or named from index).

15. **Contract test (`src/contracts/param-key-mapping.test.ts`)**
    - Change `import definitions from "@/blocks/molecule-definitions.json"` to `import definitions from "@/components/molecules/molecules.json"`.

---

## Phase 5: Remove blocks and obsolete paths

16. **Delete or repurpose `src/blocks/`**
    - Remove (or leave unused): `atom-definitions/`, `atoms.manifest.json`, `molecule-definitions.json`, `compounds.manifest.json`, `atom-defs-adapter.ts`, `blocks-registry.ts`, `compound-defs-adapter.ts`, `compound-runtime-adapter.ts`, `blocks-runtime-config.ts`.
    - Ensure no remaining imports reference `@/blocks/` (search project for `@/blocks` and fix any stragglers).

17. **Remove select from codebase**
    - Already removed from registry in step 10. Optionally delete `src/components/9-atoms/primitives/select.tsx` when deleting 9-atoms, or leave file and only remove from registry.

18. **Delete obsolete folders**
    - After all imports are updated: delete `src/components/9-atoms/` (entire tree).
    - Delete `src/compounds/` (entire tree) after molecules and any shared UI (e.g. BaseCompound, ContentCompound if still needed) are moved or inlined. If anything still imports from `@/compounds`, move that dependency first (e.g. compounds/ui/index.ts and definitions/registry.ts were re-exporting molecule definitions—consumers now use `@/components/molecules/molecules.json`).

19. **Optional: align registry JSON with new structure**
    - `src/registry/atoms.json`: update `defs` paths to point to `@/components/atoms/atoms.json` or remove if styler uses only components/atoms/atoms.json.
    - `src/registry/molecules.json`: update or replace with reference to `@/components/molecules/molecules.json` if desired.

---

## Phase 6: Verification

20. **Search for remaining old paths**
    - Grep for `@/blocks`, `@/components/9-atoms`, `@/compounds`, `@/organs` (except under `src/components/organs` where internal relative imports are fine). Fix any remaining references.

21. **Build and test**
    - Run project build (e.g. `npm run build` or `pnpm build`).
    - Run tests (e.g. `npm test` or `pnpm test`).
    - Quick smoke: load app and render a screen that uses atoms, molecules, and organs.

---

## File change summary

| Action | Files / paths |
|--------|----------------|
| Create | `src/components/atoms/atoms.json`, `src/components/atoms/index.ts`, `src/components/molecules/molecules.json`, `src/components/molecules/index.ts` |
| Move | 9 atom TSX → `components/atoms/`; 14 molecule TSX → `components/molecules/`; `src/organs/*` → `src/components/organs/` |
| Edit imports | `registry.tsx`, `json-renderer.tsx`, `styler.tsx`, `LayoutMoleculeRenderer.tsx`, 14 molecule files, `section.compound.tsx` (organs), `app/page.tsx`, `SiteSkin.tsx`, `section-helpers.ts`, `param-key-mapping.test.ts` |
| Remove registry entries | `select`, `Select` from registry |
| Delete (after imports updated) | `src/blocks/*`, `src/components/9-atoms/`, `src/compounds/` |

---

## Execution order (recommended)

1. Phase 1 (folders + atoms.json + molecules.json)  
2. Phase 2 (move atoms + molecules + create index files)  
3. Phase 4 (engine and molecule imports) so that new paths are used before deleting old ones  
4. Phase 3 (move organs + update @/organs → @/components/organs)  
5. Phase 5 (remove blocks, select, 9-atoms, compounds)  
6. Phase 6 (grep + build + test)

This keeps the app runnable after Phase 4 by still having old files in place until Phase 5, and minimizes duplicate edits.
