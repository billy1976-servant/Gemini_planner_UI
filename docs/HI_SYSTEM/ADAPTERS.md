# Adapters (compiled data → offline JSON screen)

**Classification:** REFERENCE — Adapter docs; primary architecture reference: docs/SYSTEM_MASTER/

**Purpose:** Document adapters that convert compiled or external data into the offline JSON screen format so it renders through the Molecule renderer without adding new UI types.

---

## Product-to-Screen Adapter

Converts compiled product data (`product.graph.json` or `NormalizedProduct[]`) into a single JSON document in the **exact** offline screen schema (root `type: "screen"`, `state`, `children` tree of only Registry types). Output can be loaded via `/api/screens` and rendered by `JsonRenderer`.

- **Module:** `src/lib/product-screen-adapter/`
  - `compileProductDataToScreen(input, options)` — main API
  - Types: `ScreenTree`, `ScreenTreeNode`, `ProductScreenInput`, `ProductScreenOptions`
- **Input:** Raw product graph `{ products: any[] }` or `NormalizedProduct[]` (from `normalizeSiteData` / `normalizeProducts`).
- **Output:** Screen root with Section → layout (Grid/Column/Row) → Card nodes. Uses only existing 12 molecules + layout molecules; no new UI types.
- **Reuse:** `normalizeProducts` from `src/lib/site-compiler/normalizeSiteData.ts`; `productsToCardNodes` from `src/lib/site-skin/mappers/productToMoleculeNodes.ts`.

### Integration options

1. **Build-time (script)**  
   Run `npm run product-screen -- <domain>` (e.g. `bendsoap-com`). Script reads `content/compiled/sites/<domain>/product.graph.json` or `src/content/sites/raw/<domain>/product.graph.json`, runs the adapter, validates with `warnBlueprintViolations`, and writes `src/apps-offline/apps/websites/<domain>/products.json`. Existing `/api/screens` and screen loader then serve it as a normal JSON screen.

2. **Runtime API (optional)**  
   Add a route (e.g. `GET /api/screens/websites/:site/products`) that reads the product graph from the same paths, calls `compileProductDataToScreen`, and returns the JSON. Same adapter; delivery only changes; renderer and Registry unchanged.

---

*Added per Product-to-Screen Compiler Adapter plan.*
