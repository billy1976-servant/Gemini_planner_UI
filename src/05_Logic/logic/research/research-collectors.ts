/**
 * Research Collectors
 * 
 * Deterministic collection functions for fetching from known sources.
 * NO AI REASONING. NO SYNTHESIS.
 * 
 * Rules:
 * - If data is ambiguous → discard
 * - If no citation → discard
 * - If numeric meaning unclear → store as qualitative only
 * - Parse only explicit claims and numbers
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { ResearchFact, ResearchDomain, ConfidenceLevel, ApplicableIndustry } from "./research-fact-library";

export interface ResearchCollectionResult {
  facts: ResearchFact[];
  sources: string[];
  errors: string[];
}

/**
 * Collect research facts from NIH/PubMed summaries
 * 
 * @param query - Search query (e.g., "skin barrier disruption surfactants")
 * @param domain - Research domain filter
 * @param industries - Applicable industries filter
 * @returns Collection result with facts and sources
 */
export async function collectFromPubMed(
  query: string,
  domain: ResearchDomain,
  industries: ApplicableIndustry[]
): Promise<ResearchCollectionResult> {
  const facts: ResearchFact[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  // Placeholder: In production, this would fetch from PubMed API
  // For now, return empty result (facts should be manually curated)
  console.log(`[ResearchCollector] PubMed query: ${query} (domain: ${domain}, industries: ${industries.join(", ")})`);

  return {
    facts,
    sources,
    errors: ["PubMed collection not yet implemented - use manual curation"],
  };
}

/**
 * Collect research facts from dermatology organizations
 * 
 * @param topic - Topic (e.g., "pH balance", "skin barrier")
 * @param industries - Applicable industries
 * @returns Collection result
 */
export async function collectFromDermatologyOrgs(
  topic: string,
  industries: ApplicableIndustry[]
): Promise<ResearchCollectionResult> {
  const facts: ResearchFact[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  // Placeholder: In production, this would fetch from dermatology org websites
  console.log(`[ResearchCollector] Dermatology org query: ${topic} (industries: ${industries.join(", ")})`);

  return {
    facts,
    sources,
    errors: ["Dermatology org collection not yet implemented - use manual curation"],
  };
}

/**
 * Collect research facts from manufacturer whitepapers
 * 
 * @param manufacturer - Manufacturer name
 * @param productType - Product type
 * @returns Collection result
 */
export async function collectFromManufacturerWhitepapers(
  manufacturer: string,
  productType: string
): Promise<ResearchCollectionResult> {
  const facts: ResearchFact[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  // Placeholder: In production, this would fetch from manufacturer sites
  console.log(`[ResearchCollector] Manufacturer whitepaper: ${manufacturer} - ${productType}`);

  return {
    facts,
    sources,
    errors: ["Manufacturer whitepaper collection not yet implemented - use manual curation"],
  };
}

/**
 * Collect research facts from materials science sources
 * 
 * @param material - Material type (e.g., "wood", "finish", "hardware")
 * @param industries - Applicable industries
 * @returns Collection result
 */
export async function collectFromMaterialsScience(
  material: string,
  industries: ApplicableIndustry[]
): Promise<ResearchCollectionResult> {
  const facts: ResearchFact[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  // Placeholder: In production, this would fetch from materials science databases
  console.log(`[ResearchCollector] Materials science query: ${material} (industries: ${industries.join(", ")})`);

  return {
    facts,
    sources,
    errors: ["Materials science collection not yet implemented - use manual curation"],
  };
}

/**
 * Validate a research fact before storing
 * 
 * Rules:
 * - Must have statement
 * - Must have sourceURL
 * - Must have sourceLabel
 * - If numericValues present, must have unit
 * 
 * @param fact - Research fact to validate
 * @returns true if valid, false otherwise
 */
export function validateResearchFact(fact: Partial<ResearchFact>): boolean {
  if (!fact.statement || fact.statement.trim().length === 0) {
    return false;
  }

  if (!fact.sourceURL || fact.sourceURL.trim().length === 0) {
    return false;
  }

  if (!fact.sourceLabel || fact.sourceLabel.trim().length === 0) {
    return false;
  }

  if (fact.numericValues && !fact.numericValues.unit) {
    return false;
  }

  return true;
}

/**
 * Parse numeric value from text
 * 
 * @param text - Text containing numeric value
 * @returns Parsed numeric value or null if ambiguous
 */
export function parseNumericValue(text: string): { value: number; unit?: string } | null {
  // Simple regex to extract numbers and units
  const match = text.match(/(\d+\.?\d*)\s*([a-zA-Z%]+)?/);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value)) {
    return null;
  }

  const unit = match[2] || undefined;

  return { value, unit };
}

/**
 * Check if data is ambiguous
 * 
 * @param text - Text to check
 * @returns true if ambiguous, false otherwise
 */
export function isAmbiguous(text: string): boolean {
  const ambiguousPatterns = [
    /may\s+be/i,
    /could\s+be/i,
    /might\s+be/i,
    /possibly/i,
    /perhaps/i,
    /unclear/i,
    /unknown/i,
    /\?/,
  ];

  return ambiguousPatterns.some((pattern) => pattern.test(text));
}
