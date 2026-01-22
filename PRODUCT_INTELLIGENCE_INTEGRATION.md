# Product Intelligence Layer - System Integration

**Date:** 2024  
**Status:** ✅ Fully Integrated

---

## Integration with Existing System

The Product Intelligence Layer has been fully integrated with the existing deterministic engine system while maintaining all system contracts and guarantees.

---

## System Contract Compliance

### ✅ Deterministic Only
- All product extraction is deterministic (JSON-LD → HTML parsing)
- No AI guessing of facts
- All calculations are pure functions
- Same inputs → same outputs

### ✅ No Runtime AI
- Product extraction uses structured data (JSON-LD, meta tags, spec tables)
- No AI inference at runtime
- All facts extracted from source pages

### ✅ All Facts Must Have Sources
- Every product attribute has a `source: SourceRef`
- Every price has a source
- Every image has a source URL
- Calculator assumptions include sources
- Comparison results include aggregated sources

### ✅ User Controls Priority
- User selects products via `ProductCard`
- User adjusts calculator sliders
- User chooses comparison mode (strict/loose)
- All user inputs respected deterministically

### ✅ Engines Compete But Do Not Invent
- Product calculator uses actual product prices (from sources)
- Comparison engine uses actual attribute values (from sources)
- No invented data, only extracted and calculated

### ✅ Contracts Are Append Only
- Product types extend existing contracts
- No breaking changes to existing engine contracts
- New contracts added without modifying existing ones

---

## Engine Integration Points

### 1. EngineState.calcOutputs

**Contract Extension:**
```typescript
calcOutputs: {
  // Existing calculators
  "25x": { totalLoss, hours, wage, scoring },
  "cleanup_monthly_cost": { value, metadata },
  
  // NEW: Product calculator
  "product-cost": {
    totalCost: number;
    monthlySavings: number;
    roi: number;
    assumptions: { ... };
    breakdown: { ... };
    selectedProducts: Array<{ ... }>;
  }
}
```

**Usage:**
- `ProductCalculatorCard` writes results to `calcOutputs["product-cost"]`
- `engine-selector.ts` checks for `calcOutputs` to select calculator engine
- `decision.engine.ts` processes `calcOutputs` for decision state
- `export-resolver.ts` includes calculator results in exports

### 2. EngineState.exportSlices

**Contract Extension:**
```typescript
exportSlices: Array<{
  // Existing fields...
  productIds?: string[]; // NEW: Link steps to products
  productAttributes?: Record<string, {
    value: any;
    source: SourceRef;
  }>; // NEW: Product-specific signals
}>
```

**Usage:**
- `export-resolver.ts` generates product-aware checklists
- `decision.engine.ts` includes product context in decision state
- `summary.engine.ts` groups product-related steps

### 3. DecisionState.context

**Contract Extension:**
```typescript
context: {
  // Existing context...
  products?: { // NEW: Product context
    selected: Product[];
    comparison: ComparisonMatrix;
    sources: SourceRef[];
  };
}
```

**Usage:**
- `decision-engine.ts` includes product context in recommendations
- `export-resolver.ts` enhances exports with product data
- `business-profiles.ts` can customize product labels per business

### 4. DocumentBlock (Export)

**Contract Extension:**
```typescript
type DocumentBlock = {
  // Existing types...
  type: "checklist" | "summary" | "action-plan" | 
        "product-comparison" | "product-report"; // NEW types
  items: string[] | ProductComparisonRow[]; // Extended
  metadata?: {
    // Existing metadata...
    productIds?: string[]; // NEW
    sources?: SourceRef[]; // NEW
  };
}
```

**Usage:**
- `export-pdf.ts` generates product comparison sections
- `export-resolver.ts` creates product-aware export artifacts

---

## Component Integration

### ProductCard
- **Location:** `src/screens/tsx-screens/onboarding/cards/ProductCard.tsx`
- **Integration:** Can be used alongside `EducationCard` in orchestrator
- **State:** Manages product selection, writes to `EngineState` via `onSelect` callback

### ComparisonCard
- **Location:** `src/screens/tsx-screens/onboarding/cards/ComparisonCard.tsx`
- **Integration:** Consumes `ComparisonMatrix` from `compare.ts`
- **State:** Displays comparison results, sources expandable

### ProductCalculatorCard
- **Location:** `src/screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx`
- **Integration:** Writes to `EngineState.calcOutputs["product-cost"]`
- **State:** Real-time calculation, updates `EngineState` on slider change

### ExportButton
- **Location:** `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`
- **Integration:** Reads from `EngineState`, generates PDF
- **State:** Always available, generates Decision Ledger from current state

### ExternalReferenceCard
- **Location:** `src/screens/tsx-screens/onboarding/cards/ExternalReferenceCard.tsx`
- **Integration:** Only renders if external references enabled
- **State:** Displays whitelisted external references with disclaimers

---

## Data Flow

### Product Extraction Flow
```
Category URL → extractCategory() → Product URLs
Product URL → extractProduct() → RawExtraction
RawExtraction → normalizeProduct() → Product
Product → ProductRepository.saveProductGraph() → Stored
```

### Calculator Flow
```
User Inputs (sliders) → ProductCalculatorCard
  → calculateProductCosts()
  → writeEngineState({ calcOutputs: { "product-cost": result } })
  → EngineState.calcOutputs["product-cost"]
  → decision.engine.ts processes
  → export-resolver.ts includes in exports
```

### Comparison Flow
```
Selected Products → buildComparisonMatrix()
  → ComparisonMatrix (similarities + differences)
  → ComparisonCard displays
  → Sources aggregated and displayed
```

### Export Flow
```
EngineState + Products + Comparison + Calculator
  → buildDecisionLedger()
  → generatePdfHtml()
  → downloadPdf() (browser print-to-PDF)
```

---

## Contract Guarantees Maintained

### ✅ No Breaking Changes
- All existing engine contracts unchanged
- All existing component contracts unchanged
- New contracts are additive only

### ✅ Backward Compatibility
- Existing calculators still work
- Existing export system still works
- Existing decision/summary processors still work

### ✅ Deterministic Behavior
- Product extraction: deterministic parsing
- Product normalization: deterministic mapping
- Product comparison: deterministic algorithms
- Product calculator: deterministic calculations

### ✅ Source Tracking
- All product facts have sources
- All calculator assumptions have sources
- All comparison results have sources
- All exports include sources

---

## Extension Points

### Add New Product Categories
1. Extend `AttributeDictionary` in `product-normalizer.ts`
2. Add category-specific slider configs in `ProductCalculatorCard`
3. Add category-specific extractors if needed

### Add New Calculators
1. Register in `calc-registry.ts`
2. Write calculation function
3. Add UI component (optional, can use existing `ProductCalculatorCard`)

### Add New Export Formats
1. Extend `DocumentBlock` type
2. Add generator function in `export-pdf.ts`
3. Update `buildDecisionLedger()` to include new format

### Enable External References
1. Edit `external-reference-config.ts`
2. Set `enabled: true`
3. Add trusted domains to `allowedDomains`

---

## Testing Checklist

- ✅ Product extraction works (category → products)
- ✅ Product normalization works (raw → Product)
- ✅ Product comparison works (strict + loose)
- ✅ Product calculator works (sliders → results)
- ✅ PDF export works (complete data)
- ✅ External references work (when enabled)
- ✅ Integration with engines works (calcOutputs, exportSlices)
- ✅ No breaking changes to existing system

---

## Files Modified (Integration)

### New Files (No Breaking Changes)
- `src/logic/products/**` - All product intelligence files
- `src/screens/tsx-screens/onboarding/cards/ProductCard.tsx`
- `src/screens/tsx-screens/onboarding/cards/ComparisonCard.tsx`
- `src/screens/tsx-screens/onboarding/cards/ProductCalculatorCard.tsx`
- `src/screens/tsx-screens/onboarding/cards/ExportButton.tsx`
- `src/screens/tsx-screens/onboarding/cards/ExternalReferenceCard.tsx`

### Modified Files (Additive Only)
- `src/logic/calcs/calc-registry.ts` - Added `product-cost` calculator
- `src/contracts/SYSTEM_CONTRACT.lockeed.ts` - Added Product Intelligence contracts
- `src/logic/products/index.ts` - Barrel exports
- `src/screens/tsx-screens/onboarding/cards/index.ts` - Barrel exports

### No Changes
- Existing engine contracts
- Existing component contracts
- Existing state management
- Existing export system (extended, not replaced)

---

**Status:** ✅ **FULLY INTEGRATED** - Product Intelligence Layer is production-ready and maintains all system contracts.
