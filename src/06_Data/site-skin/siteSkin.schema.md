## SiteSkin JSON Contract (Deterministic, molecule-driven)

### Goals
- **TSX is thin**: screens load JSON + data, then render `SiteSkin`.
- **JSON controls UI**: region composition + molecule tree are defined in JSON.
- **Engines feed data**: engines produce data/decisions; bridge resolves slots/bindings into molecule nodes.
- **Global palette + layout dropdowns remain authoritative** via existing `palette-store` and `layout-store`.

---

### `SiteSkinDocument`

- **meta**
  - `domain`: site domain identifier (e.g. `gibson-com`)
  - `pageId`: page identifier (e.g. `home`)
  - `version`: integer schema version
  - `generatedAt`: optional timestamp (for audits)
- **regions**: ordered list of region objects
- **dataSlots**: optional declarations for tooling/debug

---

### `SiteSkinRegion`

- `id`: stable region ID (for drag/drop + diffing)
- `role`: canonical region role (finite set)
- `layout`: optional region layout wrapper for children (uses layout molecules)
- `nodes`: molecule nodes (or slot nodes) for that region

---

### Node types

#### Molecule nodes
Nodes are compatible with `JsonRenderer` conventions:
- `type`: registry key (e.g. `Section`, `Card`, `Chip`, `Toolbar`)
- `params`, `content`, `behavior`, `children` as usual

#### Slot nodes (placeholders)
Slot nodes are **not renderable** and must be replaced before rendering:
- `type: "slot"`
- `slotKey`: reference into a data bag (e.g. `products.featured`)
- `renderAs`: suggested molecule type for mapping (e.g. `Card`)

---

### Example (minimal page)

```json
{
  "meta": { "domain": "gibson-com", "pageId": "home", "version": 1 },
  "regions": [
    {
      "id": "r_header",
      "role": "header",
      "layout": { "type": "row", "params": { "gap": "1rem", "justify": "space-between" } },
      "nodes": [
        { "id": "logo", "type": "Avatar", "content": { "label": "G" } },
        { "id": "nav", "type": "List", "params": { "variant": "inline" } }
      ]
    },
    {
      "id": "r_hero",
      "role": "hero",
      "layout": { "type": "column", "params": { "gap": "1.25rem", "align": "center" } },
      "nodes": [
        {
          "id": "hero_section",
          "type": "Section",
          "content": { "title": "Find your sound" },
          "children": [
            { "id": "cta", "type": "Button", "content": { "label": "Shop guitars" } }
          ]
        }
      ]
    },
    {
      "id": "r_products",
      "role": "products",
      "layout": { "type": "grid", "params": { "columns": 3, "gap": "1rem" } },
      "nodes": [
        { "id": "featured_products", "type": "slot", "slotKey": "products.featured", "renderAs": "Card" }
      ]
    },
    { "id": "r_footer", "role": "footer", "nodes": [{ "id": "f", "type": "Footer" }] }
  ],
  "dataSlots": {
    "products.featured": { "description": "Engine-selected featured products" }
  }
}
```

