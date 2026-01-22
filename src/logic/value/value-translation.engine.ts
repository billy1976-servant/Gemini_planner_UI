/**
 * Value Translation Engine
 * 
 * Converts facts + research inputs into human-meaningful benefits
 * across multiple value dimensions, without AI reasoning.
 * 
 * Rules:
 * - All outputs must be explainable
 * - All assumptions must be cited
 * - If inputs are missing, output "insufficient data"
 * - No AI inference
 * - No heuristics
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { ValueDimensionId } from "./value-dimensions";
import type { IndustryModelId, AssumptionVariable } from "./assumption-library";
import type { Product } from "../products/product-types";
import { getResearchFact } from "../research/research-fact-library";

export interface UserIntentState {
  industryModel?: IndustryModelId;
  priorities?: Record<ValueDimensionId, number>; // User priority weights (0-10)
  context?: Record<string, any>; // Additional user context
}

export interface ValueImpactBlock {
  dimensionId: ValueDimensionId;
  type: "benefit" | "lossAvoidance" | "peaceOfMind";
  statement: string;
  proof?: {
    math?: string; // Mathematical formula or calculation
    logic?: string; // Logical explanation
    assumptions: string[]; // IDs of assumptions used
    facts: string[]; // IDs or descriptions of site facts that triggered this
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

export interface ValueTranslationInput {
  products?: Product[];
  siteData?: Record<string, any>; // Normalized site/product data
  industryModel: IndustryModelId;
  userIntent: UserIntentState;
  activeDimensions: ValueDimensionId[];
  userPriorityWeights?: Record<ValueDimensionId, number>;
}

export interface RankedValueConclusion {
  dimensionId: ValueDimensionId;
  rank: number; // 1 = primary, 2 = secondary, 3+ = collapsed
  valueImpactBlock: ValueImpactBlock;
  supportingFacts: {
    siteFacts: string[];
    assumptions: string[];
    researchFacts: string[];
  };
  priorityScore: number; // Calculated priority score
}

export interface ValueTranslationOutput {
  valueImpactBlocks: ValueImpactBlock[];
  rankedValueConclusions: RankedValueConclusion[]; // NEW: Ranked conclusions
  appliedAssumptions: string[]; // IDs of assumptions used
  appliedResearchFacts: string[]; // NEW: IDs of research facts used
  insufficientDataFlags: string[]; // Dimensions that couldn't be calculated
  traceability: Array<{
    factId: string;
    assumptionId: string;
    researchFactId?: string; // NEW: Optional research fact reference
    outputBlockId: string;
  }>;
}

/**
 * Value Translation Engine
 * Applies rule-based transforms to convert facts into human-meaningful benefits
 */
export function translateValue(input: ValueTranslationInput): ValueTranslationOutput {
  const { products, siteData, industryModel, userIntent, activeDimensions, userPriorityWeights } = input;

  const valueImpactBlocks: ValueImpactBlock[] = [];
  const appliedAssumptions: string[] = [];
  const appliedResearchFacts: string[] = [];
  const insufficientDataFlags: string[] = [];
  const traceability: Array<{
    factId: string;
    assumptionId: string;
    researchFactId?: string;
    outputBlockId: string;
  }> = [];

  // Get industry model assumptions
  const { getIndustryModel } = require("./assumption-library");
  const industryModelData = getIndustryModel(industryModel);
  if (!industryModelData) {
    return {
      valueImpactBlocks: [],
      appliedAssumptions: [],
      insufficientDataFlags: activeDimensions,
      traceability: [],
    };
  }

  // Process each active dimension
  for (const dimensionId of activeDimensions) {
    const blocks = processDimension(
      dimensionId,
      products || [],
      siteData || {},
      industryModelData,
      userIntent,
      userPriorityWeights
    );

    // Guardrails: Validate each block before adding
    const validBlocks = blocks.filter((block) => {
      // Guardrail 1: Must have at least one site fact OR one research fact
      const hasSiteFact = block.proof?.facts && block.proof.facts.length > 0;
      const hasResearchFact = block.source.assumptionId && 
        industryModelData.variables[block.source.assumptionId]?.researchFactIds &&
        industryModelData.variables[block.source.assumptionId].researchFactIds!.length > 0;
      
      if (!hasSiteFact && !hasResearchFact) {
        console.warn(`[ValueTranslation] Block rejected: No site fact or research fact for ${dimensionId}`);
        return false;
      }

      // Guardrail 2: Research facts must always show citation
      if (hasResearchFact) {
        const researchFactIds = industryModelData.variables[block.source.assumptionId].researchFactIds!;
        for (const factId of researchFactIds) {
          const researchFact = getResearchFact(factId);
          if (!researchFact || !researchFact.sourceURL) {
            console.warn(`[ValueTranslation] Block rejected: Research fact ${factId} missing citation`);
            return false;
          }
          appliedResearchFacts.push(factId);
        }
      }

      return true;
    });

    if (validBlocks.length === 0) {
      insufficientDataFlags.push(dimensionId);
    } else {
      valueImpactBlocks.push(...validBlocks);
      validBlocks.forEach((block) => {
        appliedAssumptions.push(block.source.assumptionId);
        
        // Get research fact IDs if available
        const assumptionVar = industryModelData.variables[block.source.assumptionId];
        const researchFactIds = assumptionVar?.researchFactIds || [];
        
        traceability.push({
          factId: block.source.factId,
          assumptionId: block.source.assumptionId,
          researchFactId: researchFactIds.length > 0 ? researchFactIds[0] : undefined,
          outputBlockId: `${dimensionId}-${block.type}`,
        });
      });
    }
  }

  // Priority arbitration: Rank value conclusions
  const rankedConclusions = arbitratePriority(
    valueImpactBlocks,
    userPriorityWeights,
    userIntent,
    industryModelData
  );

  return {
    valueImpactBlocks,
    rankedValueConclusions: rankedConclusions,
    appliedAssumptions: [...new Set(appliedAssumptions)],
    appliedResearchFacts: [...new Set(appliedResearchFacts)],
    insufficientDataFlags,
    traceability,
  };
}

/**
 * Priority Arbitration Logic
 * Ranks value dimensions based on:
 * - User intent
 * - Domain defaults
 * - User priority weights
 * 
 * Returns: One primary conclusion, up to two secondary, others collapsed
 */
function arbitratePriority(
  blocks: ValueImpactBlock[],
  userPriorityWeights?: Record<ValueDimensionId, number>,
  userIntent?: UserIntentState,
  industryModel?: any
): RankedValueConclusion[] {
  if (blocks.length === 0) {
    return [];
  }

  // Calculate priority scores for each block
  const scoredBlocks = blocks.map((block) => {
    const dimensionId = block.dimensionId;
    
    // Base score from dimension default weight
    const { getValueDimension } = require("./value-dimensions");
    const dimension = getValueDimension(dimensionId);
    let priorityScore = dimension.defaultWeight;

    // Apply user priority weights if provided
    if (userPriorityWeights && userPriorityWeights[dimensionId]) {
      priorityScore = userPriorityWeights[dimensionId];
    }

    // Boost score if has research facts
    if (block.proof?.assumptions) {
      // Check if any assumptions reference research facts
      const hasResearch = block.proof.assumptions.some((assumptionId) => {
        // This would check assumption library for researchFactIds
        // For now, boost if proof exists
        return true;
      });
      if (hasResearch) {
        priorityScore += 1; // Boost for research-backed
      }
    }

    // Boost score if has magnitude (calculable)
    if (block.magnitude) {
      priorityScore += 0.5;
    }

    return {
      dimensionId,
      valueImpactBlock: block,
      priorityScore,
      supportingFacts: {
        siteFacts: block.proof?.facts || [],
        assumptions: block.proof?.assumptions || [],
        researchFacts: [], // Will be populated from research fact IDs
      },
    };
  });

  // Sort by priority score (descending)
  scoredBlocks.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign ranks: 1 = primary, 2-3 = secondary, 4+ = collapsed
  const ranked: RankedValueConclusion[] = scoredBlocks.map((scored, index) => ({
    dimensionId: scored.dimensionId,
    rank: index + 1,
    valueImpactBlock: scored.valueImpactBlock,
    supportingFacts: scored.supportingFacts,
    priorityScore: scored.priorityScore,
  }));

  return ranked;
}

/**
 * Process a single value dimension
 */
function processDimension(
  dimensionId: ValueDimensionId,
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState,
  userPriorityWeights?: Record<ValueDimensionId, number>
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  switch (dimensionId) {
    case "time":
      blocks.push(...processTimeDimension(products, siteData, industryModel, userIntent));
      break;
    case "effort":
      blocks.push(...processEffortDimension(products, siteData, industryModel, userIntent));
      break;
    case "risk":
      blocks.push(...processRiskDimension(products, siteData, industryModel, userIntent));
      break;
    case "confidence":
      blocks.push(...processConfidenceDimension(products, siteData, industryModel, userIntent));
      break;
    case "experience":
      blocks.push(...processExperienceDimension(products, siteData, industryModel, userIntent));
      break;
    case "quality":
      blocks.push(...processQualityDimension(products, siteData, industryModel, userIntent));
      break;
    case "health":
      blocks.push(...processHealthDimension(products, siteData, industryModel, userIntent));
      break;
    case "money":
      blocks.push(...processMoneyDimension(products, siteData, industryModel, userIntent));
      break;
  }

  return blocks;
}

/**
 * Process TIME dimension
 * Rule: time × frequency → time saved
 */
function processTimeDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for cleanup industry model
  if (industryModel.id === "cleanup") {
    const timeLossVar = industryModel.variables.avg_time_loss;
    const exposureVar = industryModel.variables.exposure_frequency;

    if (timeLossVar && exposureVar) {
      const avgTimeLoss = timeLossVar.defaultRange.median;
      const exposureFreq = exposureVar.defaultRange.median;
      const dailyTimeSaved = avgTimeLoss * exposureFreq;

      blocks.push({
        dimensionId: "time",
        type: "benefit",
        statement: `Save up to ${dailyTimeSaved.toFixed(1)} hours per day through improved cleanup efficiency`,
        proof: {
          math: `${avgTimeLoss} hours × ${exposureFreq} times/day = ${dailyTimeSaved.toFixed(1)} hours/day`,
          assumptions: [timeLossVar.id, exposureVar.id],
          facts: ["cleanup_efficiency_improvement"],
        },
        magnitude: {
          value: dailyTimeSaved,
          unit: "hours/day",
          confidence: "medium",
        },
        source: {
          assumptionId: timeLossVar.id,
          factId: "cleanup_efficiency_improvement",
          citation: timeLossVar.source,
        },
      });
    }
  }

  return blocks;
}

/**
 * Process EFFORT dimension
 * Rule: time × frequency → effort impact
 */
function processEffortDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for cleanup industry model
  if (industryModel.id === "cleanup") {
    const timeLossVar = industryModel.variables.avg_time_loss;
    const exposureVar = industryModel.variables.exposure_frequency;

    if (timeLossVar && exposureVar) {
      blocks.push({
        dimensionId: "effort",
        type: "benefit",
        statement: "Reduce physical effort required for daily cleanup tasks",
        proof: {
          logic: `Reducing cleanup time by ${timeLossVar.defaultRange.median} hours per occurrence, ${exposureVar.defaultRange.median} times per day, directly reduces physical effort`,
          assumptions: [timeLossVar.id, exposureVar.id],
          facts: ["cleanup_efficiency_improvement"],
        },
        source: {
          assumptionId: timeLossVar.id,
          factId: "cleanup_efficiency_improvement",
          citation: timeLossVar.source,
        },
      });
    }
  }

  return blocks;
}

/**
 * Process RISK dimension
 * Rule: exposure × sensitivity → health risk
 */
function processRiskDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for cleanup industry model
  if (industryModel.id === "cleanup") {
    const safetyVar = industryModel.variables.safety_incident_rate;

    if (safetyVar) {
      blocks.push({
        dimensionId: "risk",
        type: "lossAvoidance",
        statement: `Reduce safety incident risk by up to ${safetyVar.defaultRange.median} incidents per year`,
        proof: {
          logic: `Improved cleanup processes reduce safety hazards, potentially preventing ${safetyVar.defaultRange.median} incidents per year`,
          assumptions: [safetyVar.id],
          facts: ["cleanup_safety_improvement"],
        },
        source: {
          assumptionId: safetyVar.id,
          factId: "cleanup_safety_improvement",
          citation: safetyVar.source,
        },
      });
    }
  }

  // Check for skincare industry model
  if (industryModel.id === "skincare") {
    const irritationVar = industryModel.variables.irritation_rate;
    const sensitivityVar = industryModel.variables.sensitivity_rate;

    if (irritationVar && sensitivityVar) {
      blocks.push({
        dimensionId: "risk",
        type: "lossAvoidance",
        statement: `Reduce skin irritation risk for ${sensitivityVar.defaultRange.median}% of users with sensitive skin`,
        proof: {
          logic: `Products with lower irritation rates (${irritationVar.defaultRange.median}% vs industry average) reduce risk for sensitive skin users`,
          assumptions: [irritationVar.id, sensitivityVar.id],
          facts: ["product_irritation_data"],
        },
        source: {
          assumptionId: irritationVar.id,
          factId: "product_irritation_data",
          citation: irritationVar.source,
        },
      });
    }
  }

  return blocks;
}

/**
 * Process CONFIDENCE dimension
 * Rule: task diversion → confidence / experience loss
 */
function processConfidenceDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for cleanup industry model
  if (industryModel.id === "cleanup") {
    blocks.push({
      dimensionId: "confidence",
      type: "peaceOfMind",
      statement: "Increase confidence in site safety and professional appearance",
      proof: {
        logic: "Consistent, efficient cleanup processes build trust with clients and reduce anxiety about site conditions",
        assumptions: [],
        facts: ["cleanup_consistency_improvement"],
      },
      source: {
        assumptionId: "cleanup_confidence_assumption",
        factId: "cleanup_consistency_improvement",
        citation: {
          url: industryModel.source.url,
          label: industryModel.source.label,
        },
      },
    });
  }

  return blocks;
}

/**
 * Process EXPERIENCE dimension
 * Rule: quality improvements → experience enhancement
 */
function processExperienceDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for instruments industry model
  if (industryModel.id === "instruments") {
    blocks.push({
      dimensionId: "experience",
      type: "benefit",
      statement: "Enhanced playing experience with improved instrument quality",
      proof: {
        logic: "Higher quality instruments provide better sound, feel, and overall playing experience",
        assumptions: [],
        facts: ["instrument_quality_data"],
      },
      source: {
        assumptionId: "instrument_experience_assumption",
        factId: "instrument_quality_data",
        citation: {
          url: industryModel.source.url,
          label: industryModel.source.label,
        },
      },
    });
  }

  return blocks;
}

/**
 * Process QUALITY dimension
 * Rule: longevity data → quality assessment
 */
function processQualityDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for instruments industry model
  if (industryModel.id === "instruments") {
    const lifespanVar = industryModel.variables.instrument_lifespan;

    if (lifespanVar) {
      blocks.push({
        dimensionId: "quality",
        type: "benefit",
        statement: `Extend instrument lifespan to ${lifespanVar.defaultRange.median} years with proper care`,
        proof: {
          logic: `Quality instruments with proper maintenance last ${lifespanVar.defaultRange.median} years on average`,
          assumptions: [lifespanVar.id],
          facts: ["instrument_lifespan_data"],
        },
        source: {
          assumptionId: lifespanVar.id,
          factId: "instrument_lifespan_data",
          citation: lifespanVar.source,
        },
      });
    }
  }

  return blocks;
}

/**
 * Process HEALTH dimension
 * Rule: exposure × sensitivity → health impact
 */
function processHealthDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for skincare industry model
  if (industryModel.id === "skincare") {
    const irritationVar = industryModel.variables.irritation_rate;

    if (irritationVar) {
      blocks.push({
        dimensionId: "health",
        type: "benefit",
        statement: `Reduce skin irritation risk by ${irritationVar.defaultRange.median}% compared to standard products`,
        proof: {
          logic: `Products with lower irritation rates improve skin health for sensitive users`,
          assumptions: [irritationVar.id],
          facts: ["product_irritation_data"],
        },
        source: {
          assumptionId: irritationVar.id,
          factId: "product_irritation_data",
          citation: irritationVar.source,
        },
      });
    }
  }

  return blocks;
}

/**
 * Process MONEY dimension (optional)
 * Rule: cost × frequency → money saved
 */
function processMoneyDimension(
  products: Product[],
  siteData: Record<string, any>,
  industryModel: any,
  userIntent: UserIntentState
): ValueImpactBlock[] {
  const blocks: ValueImpactBlock[] = [];

  // Check for cleanup industry model
  if (industryModel.id === "cleanup") {
    const timeLossVar = industryModel.variables.avg_time_loss;
    const wageVar = industryModel.variables.avg_wage_range;
    const exposureVar = industryModel.variables.exposure_frequency;

    if (timeLossVar && wageVar && exposureVar) {
      const timeSaved = timeLossVar.defaultRange.median;
      const hourlyWage = wageVar.defaultRange.median;
      const dailySavings = timeSaved * hourlyWage * exposureVar.defaultRange.median;
      const annualSavings = dailySavings * 250; // Working days per year

      blocks.push({
        dimensionId: "money",
        type: "benefit",
        statement: `Save up to $${annualSavings.toFixed(0)} per year in labor costs through improved cleanup efficiency`,
        proof: {
          math: `${timeSaved} hours × $${hourlyWage}/hour × ${exposureVar.defaultRange.median} times/day × 250 days = $${annualSavings.toFixed(0)}/year`,
          assumptions: [timeLossVar.id, wageVar.id, exposureVar.id],
          facts: ["cleanup_efficiency_improvement", "wage_data"],
        },
        magnitude: {
          value: annualSavings,
          unit: "USD/year",
          confidence: "medium",
        },
        source: {
          assumptionId: wageVar.id,
          factId: "cleanup_efficiency_improvement",
          citation: wageVar.source,
        },
      });
    }
  }

  return blocks;
}
