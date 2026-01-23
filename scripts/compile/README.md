# Website Compiler

Deterministic website compiler that persists reusable report artifacts.

## Usage

```bash
npm run compile
```

The compiler will prompt you interactively for a website URL.

## Examples

```bash
# Run the compiler
npm run compile

# When prompted, enter:
# https://bendsoapcompany.com

# Or:
# https://www.gibson.com
```

## Output Location

All outputs are written to:
```
content/compiled/sites/{siteKey}/
```

Where `siteKey` is generated deterministically from the URL:
- Strip protocol
- Strip trailing slashes
- Lowercase
- Replace non-alphanumerics with `-`

Example: `https://bendsoapcompany.com/` → `bendsoapcompany-com`

## Output Files

Each compilation produces:
- `site.snapshot.json` - Raw site scan data
- `product.graph.json` - Normalized product graph
- `research.bundle.json` - Attached research facts
- `value.model.json` - Value translation results
- `report.final.json` - **Canonical artifact** (contains all above)

## Loading Compiled Reports

Use the compiled report loader:

```typescript
import { loadCompiledReport, listCompiledSites } from "@/logic/content/compiled-report-loader";

// Load a specific report
const report = loadCompiledReport("bendsoapcompany-com");

// List all compiled sites
const sites = listCompiledSites();
```

## Phases

The compiler runs these phases in order:

1. **Scan Website** - Fetches and extracts raw data
2. **Normalize to Product Graph** - Converts raw data to canonical schema
3. **Attach Research** - Binds research facts to assumptions
4. **Run Value Translation** - Generates ranked value conclusions

All phases reuse existing logic - no duplication.
