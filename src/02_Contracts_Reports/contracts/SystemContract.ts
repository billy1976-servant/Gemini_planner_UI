/**
 * System Contract - Type definitions only
 * 
 * This file defines the canonical contracts for system components.
 * NO logic, NO defaults, NO helpers - types only.
 * 
 * Any changes to these contracts require:
 * 1. Version bump
 * 2. Explicit migration logic
 * 3. Human confirmation
 */

/**
 * EngineStateContract - Contract for EngineState
 */
export interface EngineStateContract {
  orderedStepIds: string[];
  currentStepIndex: number;
  totalSteps: number;
  completedStepIds: string[];
  accumulatedSignals: string[];
  accumulatedBlockers: string[];
  accumulatedOpportunities: string[];
  severityDensity: number;
  weightSum: number;
  calcOutputs: Record<string, any>;
  engineId: string;
  exportSlices: ExportSliceContract[];
  // Value Translation fields (additive only)
  activeValueDimensions?: string[];
  valueImpactBlocks?: ValueImpactBlockContract[];
  appliedAssumptions?: string[];
  userPriorityWeights?: Record<string, number>;
}

/**
 * ValueImpactBlockContract - Contract for value impact blocks
 */
export interface ValueImpactBlockContract {
  dimensionId: string;
  type: "benefit" | "lossAvoidance" | "peaceOfMind";
  statement: string;
  proof?: {
    math?: string;
    logic?: string;
    assumptions: string[];
    facts: string[];
  };
  magnitude?: {
    value: number;
    unit: string;
    confidence: "low" | "medium" | "high";
  };
  source: {
    assumptionId: string;
    factId: string;
    citation: {
      url: string;
      label: string;
    };
  };
}

/**
 * ExportSliceContract - Contract for export slices
 */
export interface ExportSliceContract {
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
}

/**
 * ExecutionEngineContract - Contract for execution engines
 */
export interface ExecutionEngineContract {
  engineId: "learning" | "calculator" | "abc";
  transformFlow: (flow: any) => any; // Flow transformation function
  getPresentation: (flow: any) => PresentationModelContract;
}

/**
 * PresentationModelContract - Contract for presentation models
 */
export interface PresentationModelContract {
  engineId: string;
  title: string;
  stepOrder: string[];
  groups?: PresentationGroupContract[];
  badges?: Record<string, string[]>;
  notes?: string[];
}

/**
 * PresentationGroupContract - Contract for presentation groups
 */
export interface PresentationGroupContract {
  id: string;
  title: string;
  stepIds: string[];
}

/**
 * ProductContract - Contract for Product
 */
export interface ProductContract {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  price: ProductPriceContract;
  images: ProductImageContract[];
  attributes: Record<string, ProductAttributeValueContract>;
  descriptionBlocks: ProductDescriptionBlockContract[];
  specs: ProductSpecContract[];
  sources: ProductSourceContract[];
}

/**
 * ProductPriceContract - Contract for product price
 */
export interface ProductPriceContract {
  amount: number;
  currency: string;
  min?: number;
  max?: number;
  source: ProductSourceContract;
}

/**
 * ProductImageContract - Contract for product image
 */
export interface ProductImageContract {
  url: string;
  alt?: string;
  sourceUrl: string;
}

/**
 * ProductAttributeValueContract - Contract for product attribute value
 */
export interface ProductAttributeValueContract {
  value: string | number | boolean | string[];
  unit?: string;
  rawText?: string;
  importanceClass: "core" | "secondary" | "cosmetic";
  source: ProductSourceContract;
}

/**
 * ProductDescriptionBlockContract - Contract for product description block
 */
export interface ProductDescriptionBlockContract {
  heading?: string;
  text: string;
  sourceUrl: string;
}

/**
 * ProductSpecContract - Contract for product spec
 */
export interface ProductSpecContract {
  key: string;
  value: string;
  sourceUrl: string;
}

/**
 * ProductSourceContract - Contract for product source
 */
export interface ProductSourceContract {
  label: string;
  url: string;
  snippet: string;
  kind: "spec" | "description" | "support" | "image" | "price";
}

/**
 * ExportDocumentContract - Contract for export documents
 */
export interface ExportDocumentContract {
  type: "checklist" | "summary" | "action-plan" | "product-comparison" | "product-report" | "steps" | "actions" | "appendix";
  title: string;
  content?: Record<string, any>;
  items?: any[];
  metadata?: Record<string, any>;
}
