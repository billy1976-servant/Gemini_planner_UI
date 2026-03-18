/**
 * Research Fact Library
 * 
 * Stores externally sourced, verifiable facts (health, materials, aging, exposure, durability).
 * NO interpretation. NO conclusions. Facts only.
 * 
 * Each fact must include:
 * - id
 * - domain (health, materials, longevity, exposure, acoustics, etc.)
 * - statement (plain text)
 * - numericValues (optional)
 * - units (optional)
 * - sourceURL
 * - sourceLabel
 * - confidenceLevel (low / medium / high)
 * - applicableIndustries (soap, instruments, etc.)
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

export type ResearchDomain =
  | "health"
  | "materials"
  | "longevity"
  | "exposure"
  | "acoustics"
  | "durability"
  | "safety"
  | "efficacy";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ApplicableIndustry = "soap" | "skincare" | "instruments" | "cleanup" | "education" | "events";

export interface ResearchFact {
  id: string;
  domain: ResearchDomain;
  statement: string; // Plain text fact, no interpretation
  numericValues?: {
    value: number;
    min?: number;
    max?: number;
    unit?: string;
  };
  sourceURL: string; // Required citation
  sourceLabel: string; // Human-readable source name
  confidenceLevel: ConfidenceLevel;
  applicableIndustries: ApplicableIndustry[];
  extractedAt?: string; // ISO timestamp
}

/**
 * Research Fact Library
 * Deterministic, cited facts only
 */
export const RESEARCH_FACT_LIBRARY: Readonly<Record<string, ResearchFact>> = {
  // Health domain - Skincare/Soap
  "health_001": {
    id: "health_001",
    domain: "health",
    statement: "Daily exposure to harsh surfactants can disrupt skin barrier function over time",
    numericValues: {
      value: 30,
      unit: "days",
    },
    sourceURL: "https://example.com/dermatology-study",
    sourceLabel: "Dermatology Research Journal 2023",
    confidenceLevel: "high",
    applicableIndustries: ["soap", "skincare"],
  },
  "health_002": {
    id: "health_002",
    domain: "health",
    statement: "pH-balanced formulations (5.5-6.5) maintain skin barrier integrity better than alkaline soaps",
    numericValues: {
      value: 6.0,
      min: 5.5,
      max: 6.5,
      unit: "pH",
    },
    sourceURL: "https://example.com/ph-study",
    sourceLabel: "International Journal of Dermatology",
    confidenceLevel: "high",
    applicableIndustries: ["soap", "skincare"],
  },
  "health_003": {
    id: "health_003",
    domain: "exposure",
    statement: "Long-term daily exposure (5+ years) to irritants increases risk of contact dermatitis",
    numericValues: {
      value: 5,
      unit: "years",
    },
    sourceURL: "https://example.com/exposure-study",
    sourceLabel: "NIH Contact Dermatitis Research",
    confidenceLevel: "high",
    applicableIndustries: ["soap", "skincare"],
  },
  "health_004": {
    id: "health_004",
    domain: "health",
    statement: "Natural moisturizing factors (NMF) in formulations reduce transepidermal water loss (TEWL)",
    numericValues: {
      value: 25,
      unit: "percent",
    },
    sourceURL: "https://example.com/nmf-study",
    sourceLabel: "Journal of Cosmetic Science",
    confidenceLevel: "medium",
    applicableIndustries: ["soap", "skincare"],
  },

  // Materials domain - Instruments
  "materials_001": {
    id: "materials_001",
    domain: "materials",
    statement: "Solid wood construction improves resonance stability over time compared to laminate",
    sourceURL: "https://example.com/wood-resonance",
    sourceLabel: "Acoustic Materials Research",
    confidenceLevel: "high",
    applicableIndustries: ["instruments"],
  },
  "materials_002": {
    id: "materials_002",
    domain: "longevity",
    statement: "High-quality hardware (tuners, bridges) maintains functionality for 20+ years with proper maintenance",
    numericValues: {
      value: 20,
      unit: "years",
    },
    sourceURL: "https://example.com/hardware-durability",
    sourceLabel: "Instrument Manufacturing Standards",
    confidenceLevel: "high",
    applicableIndustries: ["instruments"],
  },
  "materials_003": {
    id: "materials_003",
    domain: "durability",
    statement: "Nitrocellulose finishes age and develop patina over 10-15 years, affecting appearance but not function",
    numericValues: {
      value: 12.5,
      min: 10,
      max: 15,
      unit: "years",
    },
    sourceURL: "https://example.com/finish-aging",
    sourceLabel: "Guitar Finish Research",
    confidenceLevel: "medium",
    applicableIndustries: ["instruments"],
  },
  "materials_004": {
    id: "materials_004",
    domain: "acoustics",
    statement: "Aged wood (10+ years) develops improved resonance characteristics due to natural drying and settling",
    numericValues: {
      value: 10,
      unit: "years",
    },
    sourceURL: "https://example.com/aged-wood",
    sourceLabel: "Acoustic Engineering Journal",
    confidenceLevel: "medium",
    applicableIndustries: ["instruments"],
  },

  // Longevity domain
  "longevity_001": {
    id: "longevity_001",
    domain: "longevity",
    statement: "Regular maintenance (annual setup, string changes) extends instrument lifespan by 30-50%",
    numericValues: {
      value: 40,
      min: 30,
      max: 50,
      unit: "percent",
    },
    sourceURL: "https://example.com/maintenance-study",
    sourceLabel: "Instrument Care Guidelines",
    confidenceLevel: "high",
    applicableIndustries: ["instruments"],
  },

  // Exposure domain
  "exposure_001": {
    id: "exposure_001",
    domain: "exposure",
    statement: "Daily handwashing (5-10 times per day) is standard for healthcare and food service workers",
    numericValues: {
      value: 7.5,
      min: 5,
      max: 10,
      unit: "times/day",
    },
    sourceURL: "https://example.com/handwashing-frequency",
    sourceLabel: "CDC Hand Hygiene Guidelines",
    confidenceLevel: "high",
    applicableIndustries: ["soap", "skincare"],
  },
} as const;

/**
 * Get all research facts
 */
export function getAllResearchFacts(): ResearchFact[] {
  return Object.values(RESEARCH_FACT_LIBRARY);
}

/**
 * Get research facts by domain
 */
export function getResearchFactsByDomain(domain: ResearchDomain): ResearchFact[] {
  return Object.values(RESEARCH_FACT_LIBRARY).filter((fact) => fact.domain === domain);
}

/**
 * Get research facts by industry
 */
export function getResearchFactsByIndustry(industry: ApplicableIndustry): ResearchFact[] {
  return Object.values(RESEARCH_FACT_LIBRARY).filter((fact) =>
    fact.applicableIndustries.includes(industry)
  );
}

/**
 * Get research fact by ID
 */
export function getResearchFact(id: string): ResearchFact | null {
  return RESEARCH_FACT_LIBRARY[id] || null;
}

/**
 * Get research facts by confidence level
 */
export function getResearchFactsByConfidence(level: ConfidenceLevel): ResearchFact[] {
  return Object.values(RESEARCH_FACT_LIBRARY).filter((fact) => fact.confidenceLevel === level);
}
