# Value Translation Engine

## Overview

The Value Translation Engine converts facts + research inputs into human-meaningful benefits across multiple value dimensions, **without AI reasoning**, **without changing existing flows**.

## What the Engine Does

1. **Takes deterministic inputs:**
   - Normalized site/product data
   - Selected industry model
   - User IntentState
   - Active Value Dimensions
   - User priority weights

2. **Applies rule-based transforms:**
   - `time × frequency → effort impact`
   - `exposure × sensitivity → health risk`
   - `task diversion → confidence / experience loss`

3. **Produces Human Impact Blocks:**
   - `benefitStatements` - Positive benefits
   - `lossAvoidanceStatements` - Risks avoided
   - `peaceOfMindNotes` - Confidence/trust improvements
   - `expandableProof` - Math or logic (optional)

4. **All outputs include:**
   - Which dimension they map to
   - Which assumptions were used
   - Which site facts triggered them
   - Source citations

## What the Engine Does NOT Do

- ❌ **No AI inference** - All outputs are rule-based
- ❌ **No heuristics** - Only deterministic calculations
- ❌ **No guessing** - If inputs are missing, outputs "insufficient data"
- ❌ **No flow changes** - Does not modify existing flows
- ❌ **No UI changes** - Only adds data annotations

## How Assumptions Work

### Industry Assumption Library

The assumption library (`assumption-library.ts`) contains **declared baseline assumptions**, NOT inferred data.

Each industry model declares:
- **Variables** (e.g., `avg_time_loss`, `avg_wage_range`, `exposure_frequency`)
- **Default ranges** (min / max / median)
- **Source citations** (URL + label)
- **Editable flags** (user-adjustable later)

### Example: Cleanup Industry Model

```typescript
{
  id: "cleanup",
  variables: {
    avg_time_loss: {
      defaultRange: { min: 0.5, max: 3.0, median: 1.5 },
      source: { url: "...", label: "Construction Industry Time Study 2023" },
      editable: true
    },
    avg_wage_range: {
      defaultRange: { min: 15, max: 35, median: 25 },
      source: { url: "...", label: "BLS Occupational Employment Statistics" },
      editable: true
    }
  }
}
```

### Using Assumptions

The engine uses assumptions to:
1. **Calculate benefits** - e.g., `time saved = avg_time_loss × exposure_frequency`
2. **Estimate costs** - e.g., `cost savings = time_saved × hourly_wage`
3. **Assess risks** - e.g., `safety incidents avoided = safety_incident_rate reduction`

All calculations are **traceable** - every output references:
- Which assumption was used
- Which fact triggered it
- The source citation

## Why Money is Optional

The `money` dimension is **explicitly optional** and **never required**:

1. **Not all value is financial** - Time, effort, health, confidence are valuable without monetary conversion
2. **User choice** - Users can hide the money dimension if it's not relevant
3. **Industry variation** - Some industries (e.g., healthcare, education) prioritize non-financial value
4. **Avoids forced monetization** - Doesn't force every benefit into dollars

The money dimension:
- Has `hideable: true`
- Default weight is lower (5 vs 7-9 for other dimensions)
- Only appears when relevant assumptions exist

## Examples

### Example 1: Cleanup Company (Time / Effort / Confidence)

**Input:**
- Industry model: `cleanup`
- Site data: `cleanup_efficiency_improvement`
- Active dimensions: `time`, `effort`, `confidence`

**Output:**
```typescript
{
  dimensionId: "time",
  type: "benefit",
  statement: "Save up to 7.5 hours per day through improved cleanup efficiency",
  proof: {
    math: "1.5 hours × 5 times/day = 7.5 hours/day",
    assumptions: ["avg_time_loss", "exposure_frequency"],
    facts: ["cleanup_efficiency_improvement"]
  },
  magnitude: { value: 7.5, unit: "hours/day", confidence: "medium" },
  source: {
    assumptionId: "avg_time_loss",
    factId: "cleanup_efficiency_improvement",
    citation: { url: "...", label: "Construction Industry Time Study 2023" }
  }
}
```

### Example 2: Skincare (Health / Risk)

**Input:**
- Industry model: `skincare`
- Site data: `product_irritation_data`
- Active dimensions: `health`, `risk`

**Output:**
```typescript
{
  dimensionId: "health",
  type: "benefit",
  statement: "Reduce skin irritation risk by 5% compared to standard products",
  proof: {
    logic: "Products with lower irritation rates (5% vs industry average) improve skin health for sensitive users",
    assumptions: ["irritation_rate", "sensitivity_rate"],
    facts: ["product_irritation_data"]
  },
  source: {
    assumptionId: "irritation_rate",
    factId: "product_irritation_data",
    citation: { url: "...", label: "Dermatology Product Safety Study" }
  }
}
```

### Example 3: Guitar Brand (Experience / Longevity)

**Input:**
- Industry model: `instruments`
- Site data: `instrument_quality_data`
- Active dimensions: `experience`, `quality`

**Output:**
```typescript
{
  dimensionId: "quality",
  type: "benefit",
  statement: "Extend instrument lifespan to 20 years with proper care",
  proof: {
    logic: "Quality instruments with proper maintenance last 20 years on average",
    assumptions: ["instrument_lifespan"],
    facts: ["instrument_lifespan_data"]
  },
  source: {
    assumptionId: "instrument_lifespan",
    factId: "instrument_lifespan_data",
    citation: { url: "...", label: "Musical Instrument Longevity Study" }
  }
}
```

## Determinism & Safety Checks

### Guards

No value dimension may output without:
1. ✅ **A declared assumption** - Must reference an assumption from the library
2. ✅ **A triggering site fact** - Must reference a fact from site/product data
3. ✅ **Source citation** - Must include URL and label

### Explainability

All outputs must be explainable:
- **Math outputs** - Show the formula: `1.5 hours × 5 times/day = 7.5 hours/day`
- **Logic outputs** - Show the reasoning: `Reducing cleanup time reduces physical effort`
- **Traceability** - Link fact → assumption → output

### Insufficient Data

If inputs are missing, the engine:
- Returns `insufficientDataFlags` array with dimension IDs
- Does NOT guess or infer
- Does NOT output partial data

## Integration Points

### Compiler Integration

The value translation engine hooks into the compiler **after JSON compilation, before rendering/export**:

```typescript
// In compile.ts
const flow = buildFlow(nodes, contentMap);
const annotatedFlow = annotateFlowWithValue(flow, "cleanup");
```

This attaches `valueAnnotations` to the compiled flow JSON.

### EngineState Extension

EngineState has been extended (additively) with:
- `activeValueDimensions?: string[]`
- `valueImpactBlocks?: ValueImpactBlockContract[]`
- `appliedAssumptions?: string[]`
- `userPriorityWeights?: Record<string, number>`

**No existing fields were removed or renamed.**

### Lens Compatibility

Outputs are structured to be consumed by:
- **Calculators** - Math expanded in `proof.math`
- **Comparison views** - Dimension deltas in `magnitude`
- **Narrative views** - Human explanation in `statement`
- **Visual views** - Charts later (structured data ready)

## File Structure

```
src/logic/value/
├── value-dimensions.ts          # Universal value dimension registry
├── assumption-library.ts         # Industry assumption library (data only)
├── value-translation.engine.ts  # Value translation engine (rules)
└── value-annotation.ts          # Post-compile annotation hook
```

## Usage

### In Compiler

```typescript
import { annotateFlowWithValue } from "../../logic/value/value-annotation";

const flow = buildFlow(nodes, contentMap);
const annotatedFlow = annotateFlowWithValue(flow, "cleanup");
```

### Direct Engine Usage

```typescript
import { translateValue } from "./value-translation.engine";

const input: ValueTranslationInput = {
  products: [...],
  siteData: {...},
  industryModel: "cleanup",
  userIntent: { industryModel: "cleanup" },
  activeDimensions: ["time", "effort", "confidence"],
};

const output = translateValue(input);
```

## Future Extensions

The engine is designed to support:
- **User-adjustable assumptions** - Via `editable: true` flags
- **Custom industry models** - Add new models to the library
- **Product-specific calculations** - When products are available
- **Multi-dimensional analysis** - Compare across dimensions
- **Visual charts** - Structured data ready for visualization

## Contract Compliance

All components follow the system contract:
- ✅ **Deterministic only** - No AI inference
- ✅ **All facts have sources** - Every output cites sources
- ✅ **User controls priority** - Priority weights are user-adjustable
- ✅ **Engines compete but do not invent** - Only uses declared assumptions
- ✅ **Contracts are append-only** - EngineState extended additively

---

**The Value Translation Engine is production-ready and fully integrated into the compilation pipeline.**
