/* =========================================================
   SYSTEM CONTRACT — LOCKED
   Version: 1.0.0
   Status: IMMUTABLE
   Philosophy:
   - Deterministic
   - User-driven
   - No AI inference at runtime
   - All outputs traceable to inputs or sources
========================================================= */


export const SYSTEM_CONTRACT_VERSION = "1.0.0";


/* -------------------------------
   CORE GUARANTEES
-------------------------------- */
export const SYSTEM_RULES = {
  deterministicOnly: true,
  noRuntimeAI: true,
  allFactsMustHaveSources: true,
  userControlsPriority: true,
  enginesCompeteButDoNotInvent: true,
  contractsAreAppendOnly: true, // changes require version bump
};


/* -------------------------------
   ENGINE CONTRACT
-------------------------------- */
export type EngineId =
  | "learning"
  | "calculator"
  | "abc"
  | "comparison"
  | "decision"
  | "summary";


export interface EngineInput {
  engineId: EngineId;
  signals: Record<string, number | boolean | string>;
  priorities?: Record<string, number>; // user-adjustable weights
  products?: Product[];
}


export interface EngineOutput {
  engineId: EngineId;
  outputs: Record<string, any>;
  reasons: string[]; // explainability
  sources?: SourceRef[];
}


/* -------------------------------
   PRODUCT CONTRACT
-------------------------------- */
export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  price?: Price;
  images?: ProductImage[];
  attributes: Record<string, AttributeValue>;
  sources: SourceRef[];
}


export interface AttributeValue {
  value: string | number | boolean | string[];
  unit?: string;
  importanceClass: "core" | "secondary" | "cosmetic";
  source: SourceRef;
}


export interface Price {
  amount: number;
  currency: string;
  source: SourceRef;
}


export interface ProductImage {
  url: string;
  alt?: string;
  source: SourceRef;
}


/* -------------------------------
   SOURCE CONTRACT (MANDATORY)
-------------------------------- */
export interface SourceRef {
  url: string;
  snippet: string;
  kind: "spec" | "description" | "support" | "image" | "external";
}


/* -------------------------------
   CALCULATOR CONTRACT
-------------------------------- */
export interface CalculatorInput {
  assumptions: Record<string, number | string>;
  userPriorities?: Record<string, number>;
}


export interface CalculatorOutput {
  metrics: Record<string, number>;
  deltas?: Record<string, number>;
  explanation: string[];
}


/* -------------------------------
   COMPARISON CONTRACT
-------------------------------- */
export interface ComparisonMatrix {
  products: string[]; // product IDs
  similarities: ComparedAttribute[];
  differences: ComparedAttribute[];
}


export interface ComparedAttribute {
  attributeKey: string;
  values: Record<string, AttributeValue>; // productId → value
}


/* -------------------------------
   EXPORT / PDF CONTRACT
-------------------------------- */
export interface ExportLedger {
  userId?: string;
  selectedProducts?: string[];
  priorities?: Record<string, number>;
  engineOutputs: EngineOutput[];
  comparisons?: ComparisonMatrix;
  calculator?: CalculatorOutput;
  sources: SourceRef[];
}


/* -------------------------------
   PRODUCT INTELLIGENCE CONTRACT
-------------------------------- */
export interface ProductIntelligenceInput {
  categoryUrl?: string;
  productUrls?: string[];
  selectedProductIds: string[];
  comparisonMode?: "strict" | "loose";
  calculatorInputs?: {
    yearsOwned: number;
    usageFrequency: number;
    budgetRange: "low" | "medium" | "high";
    scenarioType: "conservative" | "moderate" | "aggressive";
  };
}

export interface ProductIntelligenceOutput {
  products: Product[];
  comparison?: ComparisonMatrix;
  calculatorResults?: {
    totalCost: number;
    monthlySavings: number;
    roi: number;
    assumptions: {
      yearsOwned: number;
      usageFrequency: number;
      budgetRange: string;
      scenarioType: string;
      sources: SourceRef[];
    };
    breakdown: {
      initialCost: number;
      monthlyCost: number;
      annualCost: number;
      totalCost: number;
      baselineCost: number;
      savings: number;
    };
  };
  exportLedger?: ExportLedger;
}


/* -------------------------------
   EXTERNAL REFERENCE CONTRACT
-------------------------------- */
export interface ExternalReference {
  id: string;
  url: string;
  quotedSnippet: string; // Exact quoted text (no AI rewrite)
  publicationName?: string;
  publicationDate?: string;
  domain: string;
  verified: boolean; // Whether domain is whitelisted
}

export interface WhitelistConfig {
  enabled: boolean; // Must be explicitly enabled
  allowedDomains: string[]; // Whitelisted domains
  requireVerification: boolean;
}


/* -------------------------------
   IMMUTABILITY NOTICE
-------------------------------- */
// Any change to this file requires:
// 1. Version bump
// 2. Explicit migration logic
// 3. Human confirmation


