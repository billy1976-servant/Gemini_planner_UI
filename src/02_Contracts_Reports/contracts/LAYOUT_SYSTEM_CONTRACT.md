# Layout System Contract

**Authority:** This contract is the single source of truth for TSX wrapper structure types and template attachment. At any point in time, structure types are exactly what this contract lists. New structure types are allowed only by explicitly updating this contract (never by inference).

**Canonical location:** `src/02_Contracts_Reports/contracts/`. Implementation reference: `src/lib/tsx-structure/` (resolver, contracts, engines).

---

## 1. Structure types (closed set)

The following **8 structure types** are the complete, closed set. No other structure type may be used unless this contract is updated to add it.

| # | Structure type | Description (reference) |
|---|----------------|-------------------------|
| 1 | `list` | List/vertical collection with density, sort, filter, pagination, selection |
| 2 | `board` | Board/kanban with columns, cards, drag, swimlanes |
| 3 | `dashboard` | Dashboard grid with widgets, resizable/draggable layout |
| 4 | `editor` | Editor with toolbar, sidebars, dirty state, content area |
| 5 | `timeline` | Timeline/scheduler with slots, view modes, axis |
| 6 | `detail` | Master-detail split (master list + detail pane) |
| 7 | `wizard` | Wizard/stepper with steps, navigation, optional branching |
| 8 | `gallery` | Gallery with grid/masonry, lightbox, density |

**Canonical list (ordered):**  
`list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`.

---

## 2. Template attachment rules

- Each structure type has a set of **template ids**. A template is a configuration object that defines layout/behavior options for that structure type (e.g. density, columns, placement).
- **Attachment:** Templates are attached to exactly one structure type. A template id is unique within a structure type (e.g. `list:default`, `list:compact`). The full identifier is `structureType:templateId`.
- **Selection:** For a given app/screen, exactly one structure type and one template id (for that type) must be **declared** in configuration or metadata—never inferred or guessed by code. The resolver must receive an explicit structure type and template id (or a contract-defined default that is documented here).
- **Source of template definitions:** Template definitions live in the codebase (e.g. `src/lib/tsx-structure/resolver/builtinTemplates.ts`). This contract documents the *authoritative list* of structure types and the rule that every template belongs to one of them.

---

## 3. Current templates per structure type

The following template ids are available per structure type (as of this contract). New template ids may be added under an existing structure type without changing this contract; new structure types require a contract update.

| Structure type | Template ids |
|----------------|--------------|
| `list` | `default`, `compact`, `dense`, `minimal` |
| `board` | `default`, `minimal`, `pipeline`, `swimlanes` |
| `dashboard` | `default`, `compact`, `single-column`, `wide` |
| `editor` | `default`, `minimal`, `sidebar-left`, `fullscreen` |
| `timeline` | `default`, `compact`, `day-only`, `week-month` |
| `detail` | `default`, `minimal`, `detail-right`, `detail-bottom` |
| `wizard` | `default`, `minimal`, `linear`, `branched` |
| `gallery` | `default`, `minimal`, `masonry`, `uniform` |

---

## 4. Declaration requirement (no guessing)

- **Structure type selection:** Must be declared in app/screen metadata or config (e.g. `structure.type` or equivalent). The build process and resolver must not infer structure type from content, route, or component tree.
- **Template selection:** Must be declared for the chosen structure type (e.g. `structure.templateId` or equivalent). If not specified, a contract-defined default for that structure type may be used, provided the default is documented in this contract or in the resolver contract.
- **Build Report:** Must list “all available structure types” and “all available templates” (per type or aggregated), then “selected structure type” and “selected template” with rationale. Use of an undeclared or unknown structure type/template is a contract violation.

---

## 5. Data-driven layout (no TSX invention)

- Layout structure is **data-driven**: structure type and template come from config/JSON. TSX wrappers consume the resolved structure config and do not hardcode layout structure or invent new structure types.
- **No inference:** TSX must not branch on “if no structure type, assume list” or “if route contains X, use dashboard.” Resolution must be explicit from configuration or from a contract-defined default that is documented.

---

## 6. Future expansion

- **New template ids:** Allowed under an existing structure type by adding them in the resolver/builtin templates. No change to this contract required.
- **New structure types:** Allowed only by (1) updating this contract to add the new type and (2) implementing the corresponding resolver, engine, and contract slice (e.g. new file under `src/lib/tsx-structure/contracts/`). No new structure type may be used until it is listed in this contract.

---

## 7. Build Report

Every Build Report must include:

- **All available structure types:** The full list from Section 1 (currently 8).
- **Selected structure type + why:** Which one was chosen and from where it was declared.
- **All available templates:** Per structure type or as a flat list with `structureType:templateId`.
- **Selected template + why:** Which template was chosen for the selected structure type and from where it was declared.

Any use of a structure type or template not in the contract surface must be reported in the Violations section.
