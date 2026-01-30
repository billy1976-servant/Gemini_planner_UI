/**
 * Universal Value Dimension Registry
 * 
 * Defines the canonical value dimensions applicable to all businesses.
 * These dimensions represent human-meaningful benefits that can be derived
 * from facts and research inputs without AI reasoning.
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

export type ValueDimensionId =
  | "time"
  | "effort"
  | "risk"
  | "confidence"
  | "experience"
  | "quality"
  | "health"
  | "money";

export interface ValueDimension {
  id: ValueDimensionId;
  humanLabel: string;
  description: string;
  defaultWeight: number; // 0-10 scale, where 10 is highest priority
  hideable: boolean; // Can user hide this dimension?
  calculable: boolean; // Can this dimension be calculated from numeric inputs?
  expandableProof: boolean; // Can this dimension show mathematical proof?
}

/**
 * Universal Value Dimension Registry
 * Locked registry - all businesses use these dimensions
 */
export const VALUE_DIMENSION_REGISTRY: Readonly<Record<ValueDimensionId, ValueDimension>> = {
  time: {
    id: "time",
    humanLabel: "Time Saved",
    description: "Hours, minutes, or days saved through efficiency improvements",
    defaultWeight: 8,
    hideable: false,
    calculable: true,
    expandableProof: true,
  },
  effort: {
    id: "effort",
    humanLabel: "Effort Reduced",
    description: "Physical or mental effort reduction, ease of use improvements",
    defaultWeight: 7,
    hideable: false,
    calculable: true,
    expandableProof: true,
  },
  risk: {
    id: "risk",
    humanLabel: "Risk Mitigation",
    description: "Reduction in safety, financial, or operational risks",
    defaultWeight: 9,
    hideable: false,
    calculable: false,
    expandableProof: false,
  },
  confidence: {
    id: "confidence",
    humanLabel: "Confidence & Peace of Mind",
    description: "Increased certainty, reduced anxiety, trust in outcomes",
    defaultWeight: 7,
    hideable: true,
    calculable: false,
    expandableProof: false,
  },
  experience: {
    id: "experience",
    humanLabel: "Experience & Comfort",
    description: "Improved user experience, comfort, satisfaction",
    defaultWeight: 6,
    hideable: true,
    calculable: false,
    expandableProof: false,
  },
  quality: {
    id: "quality",
    humanLabel: "Quality & Longevity",
    description: "Improved product quality, durability, long-term value",
    defaultWeight: 7,
    hideable: true,
    calculable: false,
    expandableProof: false,
  },
  health: {
    id: "health",
    humanLabel: "Health & Wellbeing",
    description: "Physical or mental health improvements, safety benefits",
    defaultWeight: 9,
    hideable: false,
    calculable: false,
    expandableProof: false,
  },
  money: {
    id: "money",
    humanLabel: "Cost Savings",
    description: "Financial savings, cost reduction, ROI (explicitly optional)",
    defaultWeight: 5,
    hideable: true,
    calculable: true,
    expandableProof: true,
  },
} as const;

/**
 * Get all value dimensions
 */
export function getAllValueDimensions(): ValueDimension[] {
  return Object.values(VALUE_DIMENSION_REGISTRY);
}

/**
 * Get a value dimension by ID
 */
export function getValueDimension(id: ValueDimensionId): ValueDimension {
  return VALUE_DIMENSION_REGISTRY[id];
}

/**
 * Get active value dimensions (non-hidden by default)
 */
export function getDefaultActiveDimensions(): ValueDimensionId[] {
  return Object.values(VALUE_DIMENSION_REGISTRY)
    .filter((dim) => !dim.hideable)
    .map((dim) => dim.id);
}
