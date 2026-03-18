# SITE COMPILER DIAGNOSTIC REPORT

**Generated:** 2026-01-27  
**Scope:** Container Creations pipeline (raw → normalized → schema → GeneratedSiteViewer)  
**Constraint:** Analysis only; no code was modified.

---

## 1. Pipeline Map

| Stage | Input | Output | File paths | Size | Required for render? |
|-------|--------|--------|------------|------|----------------------|
| **Scraped/source** | Live site or prior run | Raw snapshot + product graph | `src/content/sites/{domain}/raw/site.snapshot.json`, `raw/product.graph.json` | **Huge** (~935K+ chars snapshot) | No; downstream stages use it. |
| **Normalized** | Raw | NormalizedSite (pages, products, nav, media, derivedPages) | Produced in memory by `normalizeSiteData(domain)`; persisted to `compiled/normalized.json` by `build-site` | **Medium** (~2.5K lines compiled/normalized.json) | Yes: viewer uses `derivedPages` and schema. |
| **Enriched / research** | Normalized + logic | report.final, value.model, research.bundle | `normalized/report.final.json`, `normalized/value.model.json`, `normalized/research.bundle.json` (from `npm run compile`) | **Huge** (report.final alone ~958K+ chars) | **No** for page/section render. |
| **Compiled schema** | Normalized (from raw) | SiteSchema (domain, pages[], meta) | Produced by `compileSiteToSchema(domain)`; persisted to `compiled/schema.json` by `build-site` | **Large** (~3.8K lines, 9 pages) | **Yes**: viewer reads this for layout and sections. |
| **Final render input** | Schema + normalized | What GeneratedSiteViewer consumes | Fetched at runtime: `GET /api/sites/{domain}/schema` → `compiled/schema.json`, `GET /api/sites/{domain}/normalized` → `compiled/normalized.json` | Same as above | **Yes**. |

**Data flow (actual):**

- **`npm run compile`** produces `normalized/report.final.json` (and related artifacts). It is a separate pipeline and does **not** feed the viewer’s schema or normalized data.
- **`npm run website`** (build-site):
  - Requires `normalized/report.final.json` to exist (else exits).
  - Does **not** read report.final for schema/normalized. It calls `normalizeSiteData(siteKey)` and `compileSiteToSchema(siteKey)`, which read **only** from `raw/site.snapshot.json` and `raw/product.graph.json`.
  - Writes `compiled/schema.json` and `compiled/normalized.json`. The viewer and `/api/sites/[domain]/schema|normalized` use these.

So: **render path is raw → normalizeSiteData → compileSiteToSchema → compiled/*.json**.  
Report.final is used elsewhere (e.g. brand, onboarding) and is not the source of “how many pages” or “which sections” for the dropdown.

---

## 2. Data Bloat Sources

These inflate size or mix non-render data into the pipeline; they do **not** belong in a minimal “render-only” schema.

| Source | Where it appears | Why it’s bloat / wrong layer |
|--------|-------------------|------------------------------|
| **Raw HTML** | `raw/site.snapshot.json` → `rawData.v2.pages[].html` | Full per-page HTML is kept in the snapshot. Render uses structured sections only. |
| **report.final / research** | `normalized/report.final.json`, `research.bundle.json`, `value.model.json` | Research, value models, proof snippets. Used by logic/onboarding, not by the site viewer. |
| **Full product catalogs inside schema** | `compiled/schema.json` → `pages[].sections[]` where `type === "productGrid"` | Each productGrid block embeds full product objects (id, name, images[], url, etc.). Render only needs references (e.g. ids) plus a small payload for the current view. |
| **Duplicate content on blocks** | Schema blocks often have both `content: { … }` and top-level `body` / `heading` / etc. | Same text in two shapes increases size and inconsistency. |
| **meta.stats / meta.generatedAt / meta.rulesVersion** | `compiled/schema.json` → `meta` | Helpful for tooling/debug; not needed for rendering. |
| **Full `normalized` in API** | `compiled/normalized.json` served to the client | Viewer needs `derivedPages` and, for some blocks, product/media lookup. Entire `pages[]`, `products[]`, `media[]` could be trimmed or split (e.g. by page) for render. |

**Leakage summary:**  
The **render** path does not pull in report.final or research bundles. Bloat is mainly: (1) big raw snapshot, (2) schema containing full product arrays and duplicate block fields, (3) serving the full normalized site instead of a “view slice.”

---

## 3. Page Derivation Failure

**Where pages are derived**

- **Primary:** `derivePagesFromNav(navigation, sectionsForDerivation, { products, productCategories })` in `src/lib/site-normalizer/derivePagesFromNav.ts`, called from `normalizeSiteData` (both legacy and V2 paths).
- **Navigation input:** From `normalizeNavigation(snapshot)`. For V2, navigation is built from `snapshot.rawData.v2.pages`:
  - `navLabel` or `title` → label
  - `page.id` → path (e.g. `/`, `/pages/faq`, `/blogs/news`, `/products/...`).

**Why nav looks wrong: ripper, not compiler**

- In `raw/site.snapshot.json`, **every** `rawData.v2.pages[]` entry has `"title": "American Express"` (and no separate nav-specific field). So the **ripper/scraper** that produced the snapshot is storing payment-icon text as the page title.
- `normalizeNavigation` therefore produces a list like  
  `[{ label: "American Express", path: "/" }, { label: "American Express", path: "/pages/faq" }, …]`.
- `derivePagesFromNav` already has logic to **ignore payment-token labels** and use **slug/path** to infer page type and title (e.g. `/pages/faq` → “FAQ”, `/blogs/news` → “Blog”). So **derivedPages** in `compiled/normalized.json` end up with correct titles (Home, Faq, Installation, Blog, Contact, Products) and correct slugs.

**Why you can still see “only two” or “vents / 12" Whirleybird”**

- **“Two links”:** If the UI shows only two items, likely causes are: (1) viewer is hitting a different domain (e.g. default “gibson-com”) so it loads a different site’s compiled files; (2) an old or partial build where `compiled/normalized.json` or `compiled/schema.json` had fewer derivedPages or pages; (3) a bug in the dropdown logic (e.g. filtering out pages with no sections, or using a different source than `derivedPages`).
- **“Vents”, “12" Whirleybird”:** These come from **product/category** derivation. `derivePagesFromNav` also creates:
  - A **Products** page (`id: "products"`, slug `/products`).
  - **Category pages** for each product category, e.g. `category-shipping-container-skylight`, `category-conex-container-intake-vents`, `category-12-inch-whirlybird-turbine`, with titles like `"shipping-container-skylight"`, `"conex-container-intake-vents"`, `"12-inch-whirlybird-turbine"`.  
  So “12" Whirleybird” and “vents”-style labels are **category pages** derived from the product graph, not from the header nav. If the dropdown shows them as top-level choices, that’s because the pipeline treats nav pages and category pages the same in `derivedPages`, and the viewer shows all of them.

**Root cause summary**

- **Nav pages (Home, FAQ, Installation, Blog, Contact, Products):** Present in derivedPages and schema when built from current code; titles fixed by slug-based logic despite “American Express” in the snapshot.
- **Wrong titles in raw:** Caused by the **ripper** writing “American Express” into every v2 page title. Fix belongs in the scraper/ripper (e.g. detect header nav separately from payment icons, or output a dedicated `navLinks`/`headerNav` structure).
- **Product/category as top-level:** Caused by **derivation** merging nav-based pages and category-based pages into one list. The dropdown then shows both. If the goal is “only the 6 header links + Products,” category pages must be either excluded from the main dropdown or grouped under Products.

---

## 4. Section Mapping Failure

**How sections are assigned to pages**

- **Normalizer:** After `derivePagesFromNav`, all `derivedPages[].sectionIds` are cleared, then:
  - Home: `block-home-0` (hero), `block-home-1`, `block-home-2`, … from the homepage’s normalized sections.
  - Products: `block-products-0` (one productGrid block).
  - Other derived pages (FAQ, Installation, Blog, Contact): `block-{pageSlugSafe}-0..M` from the matching normalized page’s sections, when that normalized page exists (from `rawData.v2.pages`).
- **Compiler:** For each derived page, it finds a matching normalized page by slug, runs `compilePageLayout(normalizedPage, site)` (or `buildProductGridBlock(site)` for products), and emits schema sections with ids `block-{pageSlugSafe}-{index}`. So section ids in the schema are aligned with what the normalizer puts into `derivedPages[].sectionIds`.

**Why “all pages show the same images”**

- **Before fixes:** `derivePagesFromNav` was pushing many section ids into **home** (e.g. “default to home” for unmatched sections). The normalizer then **appended** its own block ids. So home’s `sectionIds` included blocks that actually belong to FAQ, Blog, Contact, etc. When the viewer filtered “current page sections” by `derivedPages[].sectionIds`, it could show the same set for every page if:
  - Every page was given the same sectionIds (e.g. home’s), or
  - Section id format in the schema didn’t match (e.g. `block-home-hero` vs `block-home-0`).
- **After clearing and id alignment:** Normalizer clears `sectionIds` and assigns only `block-{page}-*` per page; compiler uses the same ids. So in the **current** design, “same images” should be reduced if:
  - The viewer really uses `siteData.derivedPages` and `schema.pages` for the current domain, and
  - It selects sections by `currentPage.sectionIds` and those ids match `schemaPage.sections[].id`.

**Remaining section risks**

- **Category pages:** They have `sectionIds: []` in `compiled/normalized.json`. The compiler gives them no sections. So the viewer either shows “No sections mapped” or, if it falls back to “show all sections,” it can look like “same content” if that fallback is global.
- **Viewer fallback:** In `GeneratedSiteViewer.tsx`, when `visibleSectionIds.length === 0` it uses `allPageSections` (i.e. the active page’s sections from the schema). For a page with no sections, `allPageSections` is `[]` unless the “active page” is wrong. If the active page were ever resolved to home when it should be FAQ, that would show home’s images.
- **Domain / build:** If the requested domain doesn’t match the built site (e.g. `gibson-com` vs `containercreations.com`), schema and normalized come from another site’s files, so section counts and ids will be unrelated to the intended pages.

---

## 5. Minimal Correct Schema Definition

**Minimal schema shape** sufficient for the current renderer:

```json
{
  "domain": "string",
  "pages": [
    {
      "id": "string",
      "path": "string",
      "title": "string",
      "sections": [
        {
          "id": "string",
          "type": "string",
          "content": { … }
        }
      ]
    }
  ]
}
```

**Required for render**

- `domain`
- `pages[]` with `id`, `path`, `title`, `sections[]`
- Each section: `id`, `type`, and enough `content` for the corresponding block component (e.g. hero, text, productGrid).

**Should NOT be in the render schema**

- Research facts, value models, proof snippets.
- Raw HTML or full product catalogs; productGrid can reference product ids and resolve from a separate, minimal product API or a scoped slice of normalized.
- Brand/onboarding/flow configuration (those belong in separate endpoints or exports).
- `meta.stats`, `meta.generatedAt`, `meta.rulesVersion` (optional; can live in a different artifact or admin-only response).
- Duplicate representations of the same text (e.g. both `content.body` and top-level `body`).

**Current vs minimal**

- **Current:** Schema has 9 pages (home, pages-faq, pages-roof-vent-skylight-installation, blogs-news, pages-contact-us, three category pages, products), each with many blocks; productGrid blocks embed full product objects; meta and extra fields present.
- **Minimal:** Same page list (or a subset, e.g. “nav + products” only), each block with `id`, `type`, `content` only, and productGrid holding ids + minimal fields needed for the hero/list view.

---

## 6. Recommended Refactor Plan (NO CODE YET)

1. **Ripper / snapshot**
   - Add a dedicated “root pages” or “header nav” step that runs **before** any compilation.
   - Output a structured list of top-level links (e.g. `[{ label, path }]`) from the actual header/nav, and avoid using payment-icon or footer text as page titles.
   - Optionally store this in the snapshot (e.g. `rawData.v2.headerNav` or `rootPages`) so the compiler does not have to guess from “American Express” + slug.

2. **Page derivation**
   - Treat “root pages” (from nav) as the primary source for the **main** dropdown.
   - Merge with product-driven pages in a clear order, e.g.  
     `finalPages = dedupe([...navigationPages, productsPage, ...categoryPages])`,  
     and optionally mark each page with `source: "navigation" | "products" | "category"` so the viewer can filter (e.g. “nav + products” only, or “all”).
   - Ensure navigation pages are not overwritten by product/category when they share a path.

3. **Schema size and scope**
   - Reduce schema to a render-only contract: `domain` + `pages[].{ id, path, title, sections[] }`.
   - For productGrid, store product **ids** (and maybe names/thumbnails) in the schema; resolve full product details from normalized or a small product API when rendering.
   - Strip meta/stats/version from the client-facing schema or serve them on a separate debug/admin endpoint.

4. **Viewer / API**
   - Keep using `derivedPages` from normalized for dropdown labels and order; use schema only for sections and block content.
   - If “only 6 header + Products” is desired, either:
     - Filter `derivedPages` by `source === "navigation"` plus Products, or
     - Add a dedicated `navPageIds` (or similar) and have the dropdown only show those.
   - When a page has no sections, show an explicit “No sections mapped” (or a placeholder) instead of falling back to another page’s sections.

5. **Pipeline clarity**
   - Make it explicit which artifacts the **viewer** needs (e.g. `compiled/schema.json` + `compiled/normalized.json` or a slimmer “view” slice).
   - Optionally split “compile” so that:
     - One job produces report.final / research / value models (for logic/onboarding).
     - Another job produces schema + normalized (or view slice) from raw, so the site render path does not depend on report.final.

6. **Debugging**
   - Add a small diagnostic endpoint or build-time log that prints:
     - Domain used,
     - Number of nav vs product vs category pages,
     - Section count per page,
     - Sample of derivedPages (id, title, sectionIds.length).
   - This will make it obvious when “two links” or “wrong titles” come from domain, build, or derivation.

---

**End of report.** No code changes were made. Await further instruction before implementing.
