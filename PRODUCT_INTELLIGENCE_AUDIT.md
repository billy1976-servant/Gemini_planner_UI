# Product Intelligence Layer - Integration Points Audit

**Date:** 2024  
**Purpose:** Identify exact interfaces where products will be consumed by existing engines and UI

---

## STEP 1 — CURRENT INTEGRATION POINTS (READ-ONLY)

### 1. EngineState.calcOutputs

**Location:** `src/logic/runtime/engine-state.ts`

**Current Contract:**
```typescript
calcOutputs: Record<string, any>; // Calculator outputs keyed by calc ID
```

**Usage Points:**
- `src/logic/engines/engine-selector.ts` - Checks for `calcOutputs` to select calculator engine
- `src/logic/engines/decision.engine.ts` - Passes `calcOutputs` to `aggregateDecisionState()`
- `src/logic/engines/decision-engine.ts` - Processes `calculatorResults` (expects `totalLoss`, `scoring.score`)
- `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` - Reads `calculatorResult` from engine state
- `src/screens/tsx-screens/onboarding/engine-viewer.tsx` - Displays `calcOutputs` in debug panel

**Current Structure (from 25x.engine.ts):**
```typescript
{
  totalLoss: number,
  hours: number,
  wage: number,
  calculatorResult: {
    totalLoss: number,
    hours: number,
    wage: number
  },
  scoring: {
    score: number,
    totalLoss: number
  }
}
```

**Product Integration Needs:**
- **Key:** `products.selected` - Array of selected product IDs
- **Key:** `products.comparison` - Comparison matrix output
- **Key:** `products.calculator` - Product-specific calculator results (e.g., `totalCost`, `monthlySavings`, `roi`)

---

### 2. EngineState.exportSlices

**Location:** `src/logic/runtime/engine-state.ts`

**Current Contract:**
```typescript
exportSlices: ExportSlice[];

type ExportSlice = {
  stepId: string;
  stepTitle: string;
  stepPurpose: "input" | "explain" | "decide" | "summarize";
  stepWeight: number;
  exportRole: "primary" | "supporting";
  choiceId: string | null;
  choiceLabel: string | null;
  signals: string[];
  blockers: string[];
  opportunities: string[];
  severity: "low" | "medium" | "high" | null;
};
```

**Usage Points:**
- `src/logic/runtime/export-resolver.ts` - Generates checklists, summaries, action plans from `exportSlices`
- `src/logic/engines/decision.engine.ts` - Converts `exportSlices` to outcomes format
- `src/logic/engines/summary.engine.ts` - Processes `exportSlices` to build summary output

**Product Integration Needs:**
- **Extend ExportSlice:** Add optional `productIds?: string[]` to link steps to selected products
- **Extend ExportSlice:** Add optional `productAttributes?: Record<string, any>` to include product-specific signals

---

### 3. Decision/Summary Aftermath Processors

**Location:**
- `src/logic/engines/decision.engine.ts` - `processDecisionState(engineState, outcomes, context)`
- `src/logic/engines/summary.engine.ts` - `processSummaryState(engineState)`

**Current Contracts:**

**DecisionState** (`src/logic/engines/decision-types.ts`):
```typescript
type DecisionState = {
  signals: string[];
  blockers: string[];
  opportunities: string[];
  recommendedNextSteps: RecommendedStep[];
  context: Record<string, any>;
  outputs: {
    immediateView: UIBlock[];
    expandedView: ExpandedBlock[];
    exportView: DocumentBlock[];
    exportArtifacts: ExportArtifact[];
  };
};

type UIBlock = {
  type: "signal" | "blocker" | "opportunity";
  title: string;
  items: string[];
  severity?: "low" | "medium" | "high";
};

type DocumentBlock = {
  type: "checklist" | "summary" | "action-plan";
  title: string;
  items: string[];
  metadata?: Record<string, any>;
};

type ExportArtifact = {
  id: string;
  type: "checklist" | "summary" | "pdf" | "json";
  title: string;
  content: any;
  format: "json" | "pdf" | "html";
};
```

**SummaryOutput** (`src/logic/engines/summary.engine.ts`):
```typescript
type SummaryOutput = {
  keyPoints: SummaryPoint[];
  supportingDetails: SummaryPoint[];
  completionStats: {
    totalSteps: number;
    completedSteps: number;
    completionRatio: number;
    severityDensity: number;
    weightSum: number;
  };
  topSignals: string[];
  topBlockers: string[];
  topOpportunities: string[];
};

type SummaryPoint = {
  stepId: string;
  stepTitle: string;
  stepPurpose: "input" | "explain" | "decide" | "summarize";
  stepWeight: number;
  signals: string[];
  blockers: string[];
  opportunities: string[];
  severity: "low" | "medium" | "high" | null;
  exportRole: "primary" | "supporting";
};
```

**Product Integration Needs:**
- **Extend DecisionState.context:** Add `products: { selected: Product[], comparison: ComparisonMatrix }`
- **Extend DocumentBlock:** Add product-specific sections (e.g., `type: "product-comparison"`)
- **Extend ExportArtifact:** Add `type: "product-report"` with product data + sources

---

### 4. UI Cards Rendering

**Location:** `src/screens/tsx-screens/onboarding/cards/`

**Current Cards:**
- `EducationCard.tsx` - Renders steps, choices, images (from flow JSON)
- `CalculatorCard.tsx` - Renders calculator inputs/outputs
- `SummaryCard.tsx` - Displays aggregated results

**Current Image Support:**
- `EducationCard.tsx` - Renders `step.image` (URL string) with gradient fallback
- Images are loaded from Unsplash URLs in flow JSON

**Current Link Support:**
- No explicit link rendering found
- Navigation handled via `onAdvance`/`onComplete` callbacks

**Product Integration Needs:**
- **New Card:** `ProductCard.tsx` - Render product grid/list
  - Props: `products: Product[]`, `onSelect: (productId: string) => void`
  - Render: image, name, price, key attributes, "View product" link, "Show source" expander
- **New Card:** `ComparisonCard.tsx` - Render comparison matrix
  - Props: `products: Product[]`, `comparison: ComparisonMatrix`
  - Render: side-by-side comparison table with expandable sources
- **Extend EducationCard:** Add optional product selection step type

---

## SUMMARY: EXACT INTERFACES TO FEED

### 1. EngineState.calcOutputs (Product Calculator Results)

**Keys to Add:**
```typescript
calcOutputs: {
  // Existing calculator outputs
  "25x": { totalLoss, hours, wage, scoring },
  
  // NEW: Product calculator outputs
  "product-cost": {
    selectedProductIds: string[],
    totalCost: number,
    monthlySavings: number,
    roi: number,
    assumptions: {
      yearsOwned: number,
      usageFrequency: number,
      budgetRange: string,
      scenarioType: string
    }
  },
  "product-comparison": {
    comparisonMatrix: ComparisonMatrix,
    topSimilarities: AttributeComparison[],
    topDifferences: AttributeComparison[]
  }
}
```

### 2. EngineState.exportSlices (Product-Linked Steps)

**Extension:**
```typescript
type ExportSlice = {
  // ... existing fields ...
  productIds?: string[]; // Link step to selected products
  productAttributes?: Record<string, {
    value: any,
    source: { url: string, snippet: string }
  }>; // Product-specific signals
};
```

### 3. DecisionState.context (Product Context)

**Extension:**
```typescript
context: {
  // ... existing context ...
  products: {
    selected: Product[],
    comparison: ComparisonMatrix,
    sources: Source[] // Aggregated sources from all products
  }
};
```

### 4. DocumentBlock (Product Export Sections)

**New Types:**
```typescript
type DocumentBlock = {
  // ... existing types ...
  type: "checklist" | "summary" | "action-plan" | "product-comparison" | "product-report";
  items: string[] | ProductComparisonRow[];
  metadata?: {
    // ... existing metadata ...
    productIds?: string[];
    sources?: Source[];
  };
};
```

### 5. UI Card Props (Product Rendering)

**New Card Props:**
```typescript
// ProductCard.tsx
type ProductCardProps = {
  products: Product[];
  onSelect: (productId: string) => void;
  selectedProductIds?: string[];
  showSources?: boolean;
};

// ComparisonCard.tsx
type ComparisonCardProps = {
  products: Product[];
  comparison: ComparisonMatrix;
  mode: "strict" | "loose";
  onToggleSource: (attributeKey: string) => void;
};
```

---

## NEXT STEPS

1. **STEP 2:** Define Product Graph Schema (`src/logic/products/product-types.ts`)
2. **STEP 3:** Build deterministic scraper/extractor
3. **STEP 4:** Implement normalization layer
4. **STEP 5:** Build product repository + caching
5. **STEP 6:** Implement cross-comparison engine
6. **STEP 7:** Create UI cards for products
7. **STEP 8:** Extend calculator engine with product calculator
8. **STEP 9:** Implement always-on PDF export
9. **STEP 10:** Optional external references (whitelisted)

---

## NOTES

- **No existing product consumption found** - This is a new feature
- **Calculator engine is ready** - Already structured to accept arbitrary outputs via `calcOutputs`
- **Export system is extensible** - `exportSlices` and `DocumentBlock` can be extended without breaking changes
- **UI is component-based** - New cards can be added alongside existing ones
- **Images are already supported** - `EducationCard` renders images from URLs, same pattern can be used for products
- **Sources are not yet tracked** - Need to add source tracking to all product facts
