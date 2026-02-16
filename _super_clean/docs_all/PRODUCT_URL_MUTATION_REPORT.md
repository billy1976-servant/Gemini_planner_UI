# Product URL mutation report

**Scope:** Where Shopify (or any) product URLs are **constructed** or **modified** in code — not fetch, parse, or HTML extraction.

---

## 1. URL construction (building `/products/` or `/product/` from parts)

| File | Function | Line | What happens |
|------|----------|------|--------------|
| `src/scripts/websites/adapters/scan-adapter.ts` | `extractShopifyPdpUrlsFromHtml` | **85** | **Constructs** product URL: `const canonical = \`${origin}/products/${handle}\``. `handle` is taken from `pathname.split("/")` at line 79–83 (verbatim, no slugify). |
| `src/scripts/websites/adapters/scan-adapter.ts` | `extractProductLinks` | **144** | Uses captured href: `new URL(match[1], origin).href.split("?")[0]` — **no** path rebuild; only resolves relative URL and strips query. |
| `src/lib/site-compiler/compileSiteToSchema.ts` | `convertProductToSchemaFormat` | **50** | **Replaces** original product URL: when `product.url.startsWith('https://')` sets `url: \`/product/${slugify(product.name)}\`` — URL is **rebuilt from product name** (slugify), not original URL. Used in **website build** (`npm run website`), not `npm run compile`. |
| `src/lib/siteCompiler/normalize.ts` | (inline in `normalizeSiteData` product loop) | **251** | **Constructs** path: `path: \`/products/${product.id}\``. Uses `product.id` (may be numeric or slug), not necessarily original handle. Used by `siteCompiler` (e.g. `compileSite.ts`). |

---

## 2. URL modification (same variable reassigned or string changed)

| File | Function | Line | What happens |
|------|----------|------|--------------|
| `src/scripts/websites/adapters/scan-adapter.ts` | `scanWebsite` | **193** | **Modifies** URL: `const normalizedUrl = url.split("?")[0]` — strips query string only; path unchanged. |
| `src/scripts/websites/adapters/normalize-adapter.ts` | `extractCategoryPath` | **31** | `pathname = urlObj.pathname.toLowerCase()` — lowercases pathname. Used only for **category** derivation; product `entry.url` is **not** set from this (product URL is pass-through at line 387: `url: entry.url`). |

---

## 3. Variable flow (product URL discovery → reassignment)

- **Discovery:** Product URLs are first obtained in `scan-adapter.ts`:  
  - Shopify: `discoverShopifyProductUrls` → `extractShopifyPdpUrlsFromHtml` (adds `${origin}/products/${handle}` per link).  
  - Generic: `extractProductLinks` (adds `new URL(match[1], origin).href.split("?")[0]`).
- **Loop:** In `scanWebsite`, each `url` is then reassigned once to `normalizedUrl = url.split("?")[0]` (line 193); that value is used for `fetchHtml`, `extractProduct`, and `products.push({ url: normalizedUrl, product })`.
- **Normalize (compile):** In `normalize-adapter.ts`, product URL is passed through as `url: entry.url` (line 387) — no other reassignment in compile pipeline.
- **Website build:** In `compileSiteToSchema.ts`, `convertProductToSchemaFormat` **replaces** `product.url` with `/product/${slugify(product.name)}` when URL is HTTPS (lines 48–51).

---

## 4. Slug / handle / normalize usage that can affect URLs

| File | Function | Line | Relevance to product URL |
|------|----------|------|---------------------------|
| `src/lib/site-compiler/compileSiteToSchema.ts` | `slugify` | 18–24 | Used to build **product path** from name: `.toLowerCase()`, `.replace(/[^\w\s-]/g,'')`, `.replace(/[\s_-]+/g,'-')`, `.replace(/^-+|-+$/g,'')`. |
| `src/lib/site-compiler/compileSiteToSchema.ts` | `convertProductToSchemaFormat` | 49–51 | **Product URL overwritten** with `/product/${slugify(product.name)}` when URL is HTTPS. |
| `src/scripts/websites/adapters/scan-adapter.ts` | `extractShopifyPdpUrlsFromHtml` | 79–85 | Handle is **not** slugified; taken as `parts[idx + 1]` from pathname. |

---

## 5. Summary

- **Compile pipeline (`npm run compile`):**  
  The only place that **builds** a product URL is **scan-adapter.ts** line **85**: `${origin}/products/${handle}`. The only **change** to the URL in that pipeline is stripping the query at line **193**. Handle is taken verbatim from the path; there is no slugify/normalize on it in the scan adapter.

- **Website build (`npm run website`):**  
  **compileSiteToSchema.ts** **replaces** the stored product URL with `/product/${slugify(product.name)}` (lines 48–51), so the **original URL is discarded** and the path is derived from the product **name**. That can produce a different path than the original Shopify handle (e.g. name “Shipping Container Roof Vent” → slug “shipping-container-roof-vent” vs handle “shipping-container-roof-vent-adapter”).

- **Legacy siteCompiler:**  
  **siteCompiler/normalize.ts** line **251** builds `path: \`/products/${product.id}\``; if `product.id` is not the same as the store’s handle, the URL will differ from the original.

To confirm where a **specific** bad URL (e.g. double hyphen or wrong slug) appears, run `npm run compile`, capture all `[URLTRACE]` lines, and find the first log where IN or OUT shows the mutated form: if it appears at **discovery_from_html** IN, the source is the HTML; if only at OUT or later, the mutation is in our construction or later replacement.
