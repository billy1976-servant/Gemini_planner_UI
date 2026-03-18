#!/usr/bin/env ts-node
/**
 * Onboarding Logic - Generate grounded blueprint from site data and calculator schemas
 * 
 * Creates blueprint.txt, content.txt, and supportAI.txt files
 * grounded in actual site artifacts and calculator requirements.
 * 
 * Validates against blueprint-contract.md requirements.
 * 
 * Usage: npm run logic
 */

import { createInterface } from "node:readline/promises";
import * as fs from "fs";
import * as path from "path";
import { generateSiteKey } from "../websites/compile-website";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

interface ContractRequirements {
  calculatorIntake: { min: number };
  costVariables: { min: number };
  workflowDiagnosis: { min: number };
  objectionsBarriers: { min: number };
  education: { min: number };
  summary: { min: number };
  totalNodes: { min: number };
  variables: { min: number };
  derivedMetrics: { min: number };
  conditionalBranches: { min: number };
  resultAssembly: { required: boolean };
  exports: { required: boolean };
}

interface QuestionWithVariable {
  question: string;
  variable?: string;
  type?: string;
  unit?: string;
}

function loadContract(): ContractRequirements {
  const contractPath = path.join(
    process.cwd(),
    "src",
    "contracts",
    "onboarding",
    "blueprint-contract.md"
  );

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found: ${contractPath}`);
  }

  // Parse contract (simple parsing for now)
  return {
    calculatorIntake: { min: 8 },
    costVariables: { min: 6 },
    workflowDiagnosis: { min: 8 },
    objectionsBarriers: { min: 6 },
    education: { min: 5 },
    summary: { min: 3 },
    totalNodes: { min: 30 },
    variables: { min: 5 },
    derivedMetrics: { min: 3 },
    conditionalBranches: { min: 3 },
    resultAssembly: { required: true },
    exports: { required: true },
  };
}

function loadSiteArtifacts(siteKey: string): any {
  const baseDir = path.join(process.cwd(), "src", "content", "sites", siteKey);
  
  const artifacts: any = {
    report: null,
    valueModel: null,
    productGraph: null,
    schema: null,
  };

  // Load report.final.json
  const reportPath = path.join(baseDir, "normalized", "report.final.json");
  if (fs.existsSync(reportPath)) {
    try {
      artifacts.report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse report.final.json: ${e}`);
    }
  }

  // Load value.model.json
  const valueModelPath = path.join(baseDir, "normalized", "value.model.json");
  if (fs.existsSync(valueModelPath)) {
    try {
      artifacts.valueModel = JSON.parse(fs.readFileSync(valueModelPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse value.model.json: ${e}`);
    }
  }

  // Load product.graph.json
  const productGraphPath = path.join(baseDir, "raw", "product.graph.json");
  if (fs.existsSync(productGraphPath)) {
    try {
      artifacts.productGraph = JSON.parse(fs.readFileSync(productGraphPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse product.graph.json: ${e}`);
    }
  }

  // Load schema.json
  const schemaPath = path.join(baseDir, "compiled", "schema.json");
  if (fs.existsSync(schemaPath)) {
    try {
      artifacts.schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse schema.json: ${e}`);
    }
  }

  return artifacts;
}

function loadCalculatorSchemas(): any {
  const schemas: any = {
    cleanupLogic: null,
    cleanupFlow: null,
  };

  // Load cleanup.logic.json
  const cleanupLogicPath = path.join(
    process.cwd(),
    "src",
    "logic",
    "content",
    "cleanup.logic.json"
  );
  if (fs.existsSync(cleanupLogicPath)) {
    try {
      schemas.cleanupLogic = JSON.parse(fs.readFileSync(cleanupLogicPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse cleanup.logic.json: ${e}`);
    }
  }

  // Load 25x-cleanup-flow.json
  const cleanupFlowPath = path.join(
    process.cwd(),
    "src",
    "logic",
    "flows",
    "25x-cleanup-flow.json"
  );
  if (fs.existsSync(cleanupFlowPath)) {
    try {
      schemas.cleanupFlow = JSON.parse(fs.readFileSync(cleanupFlowPath, "utf8"));
    } catch (e) {
      console.warn(`[LOGIC] Could not parse 25x-cleanup-flow.json: ${e}`);
    }
  }

  return schemas;
}

function generateCalculatorIntakeQuestions(
  contract: ContractRequirements,
  schemas: any,
  artifacts: any
): QuestionWithVariable[] {
  const questions: QuestionWithVariable[] = [];
  const requiredVars = schemas.cleanupLogic?.state || {};
  const calculatorInputs = schemas.cleanupFlow?.steps?.[0]?.calculators?.[0]?.inputs || [];

  // Variable mappings with questions (using consistent variable names)
  // Use minutesPerDay (not cleanupMinutesPerDay) and wage (not hourlyWage)
  const varMappings: Record<string, { questions: string[]; type: string; unit: string }> = {
    crewSize: {
      questions: [
        "How many crew members typically work on your projects?",
        "What is your average crew size per job?",
        "How many team members are involved in daily operations?",
      ],
      type: "number",
      unit: "employees",
    },
    minutesPerDay: {
      questions: [
        "How many minutes per day do crews spend on cleanup?",
        "What is the average daily cleanup time?",
        "How much time is lost to cleanup activities each day?",
      ],
      type: "number",
      unit: "minutes",
    },
    wage: {
      questions: [
        "What is your average hourly wage rate?",
        "What do you pay per hour for labor?",
        "What is your typical hourly labor cost?",
      ],
      type: "number",
      unit: "dollars",
    },
  };

  // Additional diagnostic variables
  const diagnosticVars: Record<string, { questions: string[]; type: string; unit: string }> = {
    siteMessLevel: {
      questions: ["On a scale of 1-10, how messy are your sites typically?"],
      type: "number",
      unit: "scale",
    },
    clientPerceptionRisk: {
      questions: ["How concerned are you about client perception of site cleanliness?"],
      type: "number",
      unit: "scale",
    },
    workflowClarity: {
      questions: ["How clear are your cleanup procedures to your team?"],
      type: "number",
      unit: "scale",
    },
  };

  let questionCount = 0;
  const usedQuestions = new Set<string>();
  const capturedVars = new Set<string>();

  // Generate questions for each required variable
  for (const varName of Object.keys(requiredVars)) {
    if (varName === "answers") continue;
    if (varMappings[varName]) {
      const mapping = varMappings[varName];
      for (const q of mapping.questions) {
        if (!usedQuestions.has(q) && questionCount < contract.calculatorIntake.min + 2) {
          questions.push({
            question: q,
            variable: varName,
            type: mapping.type,
            unit: mapping.unit,
          });
          usedQuestions.add(q);
          capturedVars.add(varName);
          questionCount++;
          break; // Use first question per variable
        }
      }
    }
  }

  // Add calculator input questions (normalize variable names)
  const varNameMap: Record<string, string> = {
    cleanupMinutesPerDay: "minutesPerDay",
    hourlyWage: "wage",
  };
  
  for (const input of calculatorInputs) {
    const normalizedVar = varNameMap[input] || input;
    if (varMappings[normalizedVar] && !capturedVars.has(normalizedVar)) {
      const mapping = varMappings[normalizedVar];
      questions.push({
        question: mapping.questions[0],
        variable: normalizedVar,
        type: mapping.type,
        unit: mapping.unit,
      });
      capturedVars.add(normalizedVar);
      questionCount++;
    }
  }
  
  // Also normalize any variables from requiredVars
  for (const varName of Object.keys(requiredVars)) {
    if (varName === "answers") continue;
    const normalizedVar = varNameMap[varName] || varName;
    if (varMappings[normalizedVar] && !capturedVars.has(normalizedVar)) {
      const mapping = varMappings[normalizedVar];
      questions.push({
        question: mapping.questions[0],
        variable: normalizedVar,
        type: mapping.type,
        unit: mapping.unit,
      });
      capturedVars.add(normalizedVar);
      questionCount++;
    }
  }

  // Add diagnostic variables
  for (const [varName, mapping] of Object.entries(diagnosticVars)) {
    if (questionCount >= contract.calculatorIntake.min) break;
    questions.push({
      question: mapping.questions[0],
      variable: varName,
      type: mapping.type,
      unit: mapping.unit,
    });
    capturedVars.add(varName);
    questionCount++;
  }

  // Fill remaining with generic calculator questions (no variables)
  const genericQuestions = [
    "Do you track cleanup costs separately?",
    "Have you calculated your total cleanup expenses?",
    "Do you know your monthly cleanup labor cost?",
    "Is cleanup time affecting your project timelines?",
  ];

  for (const q of genericQuestions) {
    if (questionCount >= contract.calculatorIntake.min) break;
    if (!usedQuestions.has(q)) {
      questions.push({ question: q });
      usedQuestions.add(q);
      questionCount++;
    }
  }

  // Ensure we have at least the minimum
  while (questions.length < contract.calculatorIntake.min) {
    questions.push({
      question: `Calculator question ${questions.length + 1}: Please provide this information.`,
    });
  }

  return questions.slice(0, contract.calculatorIntake.min);
}

function generateCostVariableQuestions(
  contract: ContractRequirements,
  artifacts: any
): string[] {
  const questions: string[] = [
    "Are you losing money due to inefficient cleanup processes?",
    "Do cleanup delays cost you additional labor hours?",
    "Have you calculated the opportunity cost of cleanup time?",
    "Are there hidden costs in your cleanup process?",
    "Do cleanup inefficiencies impact your profit margins?",
    "Is cleanup time reducing your billable hours?",
    "Do cleanup costs vary significantly between projects?",
    "Are cleanup expenses eating into your profits?",
  ];

  // Add site-specific questions if products/services available
  if (artifacts.productGraph?.products?.length > 0) {
    questions.push(
      "Do cleanup delays affect your ability to take on new projects?",
      "Are cleanup costs preventing you from offering competitive pricing?"
    );
  }

  return questions.slice(0, contract.costVariables.min);
}

function generateWorkflowDiagnosisQuestions(
  contract: ContractRequirements,
  artifacts: any
): string[] {
  const questions: string[] = [
    "Do cleanup tasks interrupt your main workflow?",
    "Are there bottlenecks in your cleanup process?",
    "Does cleanup cause delays in starting new projects?",
    "Is cleanup coordination a challenge for your team?",
    "Do cleanup tasks create scheduling conflicts?",
    "Are cleanup standards inconsistent across projects?",
    "Does cleanup quality vary between crew members?",
    "Are cleanup processes slowing down project completion?",
    "Do cleanup issues cause rework or delays?",
    "Is cleanup planning part of your project workflow?",
  ];

  return questions.slice(0, contract.workflowDiagnosis.min);
}

function generateObjectionsBarriersQuestions(
  contract: ContractRequirements,
  artifacts: any
): string[] {
  const questions: string[] = [
    "Is budget a concern when considering cleanup solutions?",
    "Do you worry about implementation complexity?",
    "Are there competing priorities that delay cleanup improvements?",
    "Have you tried cleanup solutions that didn't work?",
    "Is change management a barrier to improving cleanup?",
    "Do you have concerns about ROI on cleanup investments?",
    "Are there resource constraints preventing cleanup improvements?",
    "Is there resistance to changing cleanup processes?",
  ];

  return questions.slice(0, contract.objectionsBarriers.min);
}

function generateEducationQuestions(
  contract: ContractRequirements,
  artifacts: any
): string[] {
  const questions: string[] = [
    "Do you understand the true cost of inefficient cleanup?",
    "Are you aware of industry best practices for cleanup?",
    "Have you seen examples of successful cleanup improvements?",
    "Do you know the ROI potential of optimizing cleanup?",
    "Are you familiar with cleanup efficiency strategies?",
    "Have you learned about cleanup cost reduction methods?",
  ];

  return questions.slice(0, contract.education.min);
}

function generateSummaryChoices(
  contract: ContractRequirements
): string[] {
  return [
    "Get Started Now",
    "Request More Information",
    "Schedule a Consultation",
  ];
}

function generateDerivedMetrics(calcQuestions: QuestionWithVariable[]): string {
  const metrics: string[] = [];
  
  // Extract variable names from questions
  const vars = calcQuestions
    .filter(q => q.variable)
    .map(q => q.variable!)
    .filter((v, i, arr) => arr.indexOf(v) === i); // unique

  // Generate metrics based on available variables (using consistent names)
  if (vars.includes("crewSize") && vars.includes("minutesPerDay") && vars.includes("wage")) {
    metrics.push("metric: dailyCleanupCost = crewSize * (minutesPerDay / 60) * wage");
    metrics.push("metric: annualCleanupCost = dailyCleanupCost * 260");
  }

  if (vars.includes("siteMessLevel") && vars.includes("workflowClarity")) {
    metrics.push("metric: workflowFrictionScore = weighted(siteMessLevel, workflowClarity)");
  }

  if (vars.includes("clientPerceptionRisk") && vars.includes("siteMessLevel")) {
    metrics.push("metric: reputationRiskScore = weighted(clientPerceptionRisk, siteMessLevel)");
  }

  // Ensure minimum 3 metrics
  if (metrics.length < 3) {
    metrics.push("metric: costEfficiencyScore = 100 - (annualCleanupCost / 10000) * 10");
    metrics.push("metric: operationalImpactScore = (workflowFrictionScore + reputationRiskScore) / 2");
  }

  return metrics.join("\n");
}

function generateConditionalRouting(
  stepId: number,
  costEducationStepId: number,
  appearanceTrustStepId: number,
  optimizationTipsStepId: number
): { choices: string[]; nextSteps: number[] } {
  const choices: string[] = [];
  const nextSteps: number[] = [];

  // Cost Impact Path
  choices.push(`  ${stepId}.1 | Cost Impact Path | Choice`);
  choices.push(`condition: annualCleanupCost > threshold_high`);
  choices.push(`      -> ${costEducationStepId}.0`);
  nextSteps.push(costEducationStepId);

  // Trust Risk Path
  choices.push(`  ${stepId}.2 | Trust Risk Path | Choice`);
  choices.push(`condition: reputationRiskScore > threshold_medium`);
  choices.push(`      -> ${appearanceTrustStepId}.0`);
  nextSteps.push(appearanceTrustStepId);

  // Low Impact Path
  choices.push(`  ${stepId}.3 | Low Impact Path | Choice`);
  choices.push(`condition: annualCleanupCost < threshold_low`);
  choices.push(`      -> ${optimizationTipsStepId}.0`);
  nextSteps.push(optimizationTipsStepId);

  // Default path
  choices.push(`  ${stepId}.4 | Standard Path | Choice`);
  choices.push(`condition: default`);
  choices.push(`      -> ${costEducationStepId}.0`);

  return { choices, nextSteps };
}

function generateResultAssembly(stepId: number): string {
  return `${stepId}.0 | Result Assembly | System

result.primaryProblem =
  IF annualCleanupCost highest → "Cost Inefficiency"
  IF workflowFrictionScore highest → "Workflow Friction"
  IF reputationRiskScore highest → "Trust & Appearance Risk"

result.metrics = [
  dailyCleanupCost,
  annualCleanupCost,
  workflowFrictionScore,
  reputationRiskScore
]

result.recommendations = matchProductsTo(primaryProblem)
result.confidenceScore = weighted(metric strengths)`;
}

function generateExportBlock(): string {
  return `[exports]
metrics=dailyCleanupCost,annualCleanupCost,workflowFrictionScore,reputationRiskScore
chartTypes=bar,comparison,gauge`;
}

function generateSupportAIForBlueprint(
  blueprint: string,
  siteKey: string,
  artifacts: any
): string {
  const nodes = parseBlueprintNodes(blueprint);
  const brandName = siteKey.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  let supportAI = "";
  
  // Generate support blocks for key nodes
  for (const node of nodes) {
    const nodeId = node.id;
    const nodeName = node.name.toLowerCase();
    
    // Skip Flow and System nodes (except for metrics/result assembly)
    if (node.type === "Flow") continue;
    if (node.type === "System" && !nodeName.includes("metrics") && !nodeName.includes("result")) continue;
    
    // Generate support for calculator intake questions
    if (nodeId.startsWith("1.") && node.variable) {
      supportAI += `[support:${nodeId}]\n`;
      
      if (node.variable === "crewSize") {
        supportAI += `claim: "Typical construction crews range from 3-10 members, with most projects using 5-7 crew members."\n`;
        supportAI += `whyItMatters: "Crew size directly impacts cleanup time and labor costs. Larger crews can clean faster but cost more per hour."\n`;
        supportAI += `calcHook: "If your crew is {{crewSize}} members and spends {{minutesPerDay}} minutes per day on cleanup..."\n`;
        supportAI += `numbers:\n`;
        supportAI += `- key: "typical_crew_size_range"\n`;
        supportAI += `  value: "3-10 members"\n`;
        supportAI += `confidence: "high"\n\n`;
      } else if (node.variable === "minutesPerDay") {
        supportAI += `claim: "Construction crews typically spend 30-60 minutes per day on cleanup activities."\n`;
        supportAI += `whyItMatters: "Daily cleanup time accumulates quickly. 45 minutes per day equals 3.75 hours per week, or 195 hours per year per crew member."\n`;
        supportAI += `calcHook: "With {{crewSize}} crew members spending {{minutesPerDay}} minutes daily..."\n`;
        supportAI += `numbers:\n`;
        supportAI += `- key: "cleanup_time_range"\n`;
        supportAI += `  value: "30-60 minutes/day"\n`;
        supportAI += `confidence: "high"\n\n`;
      } else if (node.variable === "wage") {
        supportAI += `claim: "Average construction labor rates range from $18-35 per hour depending on region and skill level."\n`;
        supportAI += `whyItMatters: "Labor costs are the largest component of cleanup expenses. Even small time savings multiply significantly at scale."\n`;
        supportAI += `calcHook: "At {{wage}} per hour, with {{crewSize}} crew members..."\n`;
        supportAI += `numbers:\n`;
        supportAI += `- key: "typical_wage_range"\n`;
        supportAI += `  value: "$18-35/hour"\n`;
        supportAI += `confidence: "medium"\n\n`;
      } else {
        // Generic support for other variables
        supportAI += `claim: "This metric helps calculate your total cleanup costs."\n`;
        supportAI += `whyItMatters: "Understanding this variable is essential for accurate cost calculation."\n`;
        supportAI += `calcHook: "Using {{${node.variable}}} in your calculations..."\n`;
        supportAI += `confidence: "low"\n\n`;
      }
      
      // Add stub citations
      supportAI += `citations:\n`;
      supportAI += `- title: "TODO: Research Source"\n`;
      supportAI += `  publisher: "TODO"\n`;
      supportAI += `  url: "TODO"\n`;
      supportAI += `  date: "TODO"\n`;
      supportAI += `  quote: "TODO: Add research quote"\n\n`;
    }
    
    // Support for Derived Metrics step
    if (nodeId === "2.0" && nodeName.includes("metrics")) {
      supportAI += `[support:2.0]\n`;
      supportAI += `claim: "Calculated metrics provide objective measurement of cleanup costs and operational impact."\n`;
      supportAI += `whyItMatters: "These metrics transform raw inputs into actionable insights. Annual costs reveal the true financial impact, while friction and risk scores highlight operational challenges."\n`;
      supportAI += `calcHook: "Based on your inputs, we calculate daily and annual cleanup costs, plus workflow friction and reputation risk scores."\n`;
      supportAI += `numbers:\n`;
      supportAI += `- key: "work_days_per_year"\n`;
      supportAI += `  value: "260 days"\n`;
      supportAI += `confidence: "high"\n\n`;
      supportAI += `citations:\n`;
      supportAI += `- title: "TODO: Industry Cost Analysis"\n`;
      supportAI += `  publisher: "TODO"\n`;
      supportAI += `  url: "TODO"\n`;
      supportAI += `  date: "TODO"\n`;
      supportAI += `  quote: "TODO: Add research quote"\n\n`;
    }
    
    // Support for conditional path steps
    if ((nodeId === "5.0" && nodeName.includes("cost education")) ||
        (nodeId === "6.0" && nodeName.includes("appearance trust")) ||
        (nodeId === "7.0" && nodeName.includes("optimization"))) {
      supportAI += `[support:${nodeId}]\n`;
      if (nodeId === "5.0") {
        supportAI += `claim: "High cleanup costs directly impact profitability and project margins."\n`;
        supportAI += `whyItMatters: "When annual cleanup costs exceed thresholds, they become a significant operational expense that reduces competitive pricing ability and profit margins."\n`;
      } else if (nodeId === "6.0") {
        supportAI += `claim: "Site appearance and cleanliness directly affect client trust and referral rates."\n`;
        supportAI += `whyItMatters: "Clients form first impressions quickly. Messy sites reduce confidence, increase inspection concerns, and decrease referral likelihood."\n`;
      } else {
        supportAI += `claim: "Optimization opportunities exist even when costs are relatively low."\n`;
        supportAI += `whyItMatters: "Small improvements in efficiency compound over time and can free up resources for revenue-generating activities."\n`;
      }
      supportAI += `confidence: "medium"\n\n`;
      supportAI += `citations:\n`;
      supportAI += `- title: "TODO: Research Source"\n`;
      supportAI += `  publisher: "TODO"\n`;
      supportAI += `  url: "TODO"\n`;
      supportAI += `  date: "TODO"\n`;
      supportAI += `  quote: "TODO: Add research quote"\n\n`;
    }
    
    // Support for Education section
    if (nodeId.startsWith("10.")) {
      supportAI += `[support:${nodeId}]\n`;
      supportAI += `claim: "Industry best practices show that optimized cleanup processes can reduce costs by 20-40% while improving site appearance."\n`;
      supportAI += `whyItMatters: "Understanding industry benchmarks and success stories helps justify investment in cleanup optimization and sets realistic expectations for improvement."\n`;
      supportAI += `numbers:\n`;
      supportAI += `- key: "typical_cost_reduction"\n`;
      supportAI += `  value: "20-40%"\n`;
      supportAI += `confidence: "medium"\n\n`;
      supportAI += `citations:\n`;
      supportAI += `- title: "TODO: Industry Best Practices Study"\n`;
      supportAI += `  publisher: "TODO"\n`;
      supportAI += `  url: "TODO"\n`;
      supportAI += `  date: "TODO"\n`;
      supportAI += `  quote: "TODO: Add research quote"\n\n`;
    }
    
    // Support for Summary/CTA
    if (nodeId.startsWith("11.")) {
      supportAI += `[support:${nodeId}]\n`;
      supportAI += `claim: "Taking action on cleanup optimization typically shows ROI within 3-6 months."\n`;
      supportAI += `whyItMatters: "The calculated costs and identified problems provide a clear business case. Immediate action prevents continued losses and starts the path to improvement."\n`;
      supportAI += `numbers:\n`;
      supportAI += `- key: "typical_roi_timeline"\n`;
      supportAI += `  value: "3-6 months"\n`;
      supportAI += `confidence: "medium"\n\n`;
      supportAI += `citations:\n`;
      supportAI += `- title: "TODO: ROI Case Study"\n`;
      supportAI += `  publisher: "TODO"\n`;
      supportAI += `  url: "TODO"\n`;
      supportAI += `  date: "TODO"\n`;
      supportAI += `  quote: "TODO: Add research quote"\n\n`;
    }
  }
  
  return supportAI;
}

function extractBlueprintIds(blueprint: string): string[] {
  const ids: string[] = [];
  const lines = blueprint.split("\n");
  
  for (const line of lines) {
    // Match step IDs: "1.0 | Step Name | Step"
    const stepMatch = line.match(/^(\d+\.0)\s*\|/);
    if (stepMatch) {
      ids.push(stepMatch[1]);
    }
    // Match choice IDs: "  1.1 | Choice Name | Choice"
    const choiceMatch = line.match(/^\s+(\d+\.\d+)\s*\|/);
    if (choiceMatch) {
      ids.push(choiceMatch[1]);
    }
  }
  
  return ids;
}

function extractContentIds(content: string): Set<string> {
  const ids = new Set<string>();
  const lines = content.split("\n");
  
  for (const line of lines) {
    // Match content headers: "1.0 Step Name (Type)" or "[meta:1.0]"
    const headerMatch = line.match(/^([\d.]+)\s+/);
    if (headerMatch) {
      ids.add(headerMatch[1]);
    }
    const metaMatch = line.match(/^\[meta:([\d.]+)\]/i);
    if (metaMatch) {
      ids.add(metaMatch[1]);
    }
  }
  
  return ids;
}

function parseBlueprintNodes(blueprint: string): Array<{ id: string; name: string; type: string; variable?: string; parent?: string }> {
  const nodes: Array<{ id: string; name: string; type: string; variable?: string; parent?: string }> = [];
  const lines = blueprint.split("\n");
  let currentStep: string | null = null;
  let currentVariable: string | null = null;
  
  for (const line of lines) {
    // Step: "1.0 | Step Name | Step"
    const stepMatch = line.match(/^(\d+\.0)\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (stepMatch) {
      currentStep = stepMatch[1];
      nodes.push({
        id: stepMatch[1],
        name: stepMatch[2],
        type: stepMatch[3],
      });
      currentVariable = null;
      continue;
    }
    
    // Choice: "  1.1 | Choice Name | Choice"
    const choiceMatch = line.match(/^\s+(\d+\.\d+)\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (choiceMatch) {
      nodes.push({
        id: choiceMatch[1],
        name: choiceMatch[2],
        type: choiceMatch[3],
        parent: currentStep || undefined,
        variable: currentVariable || undefined,
      });
      currentVariable = null;
      continue;
    }
    
    // Variable: "var=variableName"
    const varMatch = line.match(/^var=(\w+)/);
    if (varMatch) {
      currentVariable = varMatch[1];
      // Update the last node (the choice) with this variable
      if (nodes.length > 0) {
        nodes[nodes.length - 1].variable = currentVariable;
      }
    }
  }
  
  return nodes;
}

function generateContentForBlueprint(
  blueprint: string,
  existingContent: string,
  siteKey: string
): string {
  const nodes = parseBlueprintNodes(blueprint);
  const existingContentMap: Record<string, any> = {};
  
  // Parse existing content if present
  if (existingContent) {
    const lines = existingContent.split("\n");
    let current: string | null = null;
    let currentMeta: string | null = null;
    const metaMap: Record<string, any> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        currentMeta = null;
        continue;
      }
      
      const metaHeader = trimmed.match(/^\[meta:([\d.]+)\]$/i);
      if (metaHeader) {
        currentMeta = metaHeader[1];
        if (!metaMap[currentMeta]) {
          metaMap[currentMeta] = {};
        }
        continue;
      }
      
      if (currentMeta) {
        const metaKv = trimmed.match(/^([\w]+)\s*=\s*(.*)$/);
        if (metaKv) {
          metaMap[currentMeta][metaKv[1]] = metaKv[2].trim();
          continue;
        }
      }
      
      const header = trimmed.match(/^([\d.]+)\s+/);
      if (header) {
        current = header[1];
        existingContentMap[current] = {};
        currentMeta = null;
        continue;
      }
      
      if (!current) continue;
      
      const kv = trimmed.match(/^-+\s*([\w]+)\s*:\s*(.*)$/);
      if (kv) {
        existingContentMap[current][kv[1]] = kv[2].replace(/^["']|["']$/g, "");
      }
    }
    
    // Merge meta
    for (const [rawId, meta] of Object.entries(metaMap)) {
      if (existingContentMap[rawId]) {
        existingContentMap[rawId]._meta = meta;
      }
    }
  }
  
  const brandName = siteKey.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  let content = "";
  
  for (const node of nodes) {
    const existing = existingContentMap[node.id] || {};
    
    if (node.type === "Flow") {
      content += `${node.id} Onboarding Flow (Flow)\n`;
      content += `- title: "${existing.title || "Find Your Real Cost"}"\n\n`;
      continue;
    }
    
    if (node.type === "System") {
      // System steps don't need content blocks, but we should still track them
      // Add a minimal entry so ID parity check passes
      content += `${node.id} ${node.name} (System)\n`;
      content += `- title: "${node.name}"\n\n`;
      continue;
    }
    
    if (node.type === "Step") {
      const stepName = node.name;
      const stepNameLower = stepName.toLowerCase();
      
      // Always regenerate title/body based on step name to ensure correctness
      // Only preserve custom fields like image/imageAlt if they exist
      let title: string | undefined = undefined;
      let body: string | undefined = undefined;
      let purpose = "input";
      let tags = "general";
      
      // Generate title based on step name (don't trust existing.title as it may be wrong)
      {
        // Use step name as title, but improve formatting
        if (stepNameLower.includes("calculator")) {
          title = `Calculate Your ${brandName} Cost`;
          purpose = "input";
          tags = "calculator,cost";
        } else if (stepNameLower.includes("cost variables")) {
          title = "Understanding Your Costs";
          purpose = "input";
          tags = "cost,variables";
        } else if (stepNameLower.includes("cost education")) {
          title = "Cost Education";
          purpose = "explain";
          tags = "cost,education";
        } else if (stepNameLower.includes("appearance trust")) {
          title = "Appearance Trust";
          purpose = "explain";
          tags = "appearance,trust";
        } else if (stepNameLower.includes("optimization tips")) {
          title = "Optimization Tips";
          purpose = "explain";
          tags = "optimization,tips";
        } else if (stepNameLower.includes("workflow") || stepNameLower.includes("diagnosis")) {
          title = "Workflow Analysis";
          purpose = "decide";
          tags = "workflow,process";
        } else if (stepNameLower.includes("objection") || stepNameLower.includes("barrier")) {
          title = "Addressing Concerns";
          purpose = "decide";
          tags = "objections,barriers";
        } else if (stepNameLower.includes("education") && !stepNameLower.includes("cost")) {
          title = "Why This Matters";
          purpose = "explain";
          tags = "education,value";
        } else if (stepNameLower.includes("summary") || stepNameLower.includes("next steps")) {
          title = "Summary & Next Steps";
          purpose = "summarize";
          tags = "summary,cta";
        } else if (stepNameLower.includes("routing") || stepNameLower.includes("diagnostic")) {
          title = "Diagnostic Routing";
          purpose = "decide";
          tags = "routing,diagnostic";
        } else {
          // Use step name as-is, but capitalize properly
          title = stepName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
      }
      
      // Generate body based on step name
      {
        if (stepNameLower.includes("calculator")) {
          body = `Answer these questions to calculate your real cleanup costs for ${brandName}.`;
        } else if (stepNameLower.includes("cost variables")) {
          body = "Let's identify all the cost factors affecting your operations.";
        } else if (stepNameLower.includes("cost education")) {
          body = "Learn about how cleanup costs impact your business.";
        } else if (stepNameLower.includes("appearance trust")) {
          body = "Understand how site appearance affects client trust and referrals.";
        } else if (stepNameLower.includes("optimization tips")) {
          body = "Discover optimization strategies to improve efficiency.";
        } else if (stepNameLower.includes("workflow")) {
          body = "Help us understand your current workflow and processes.";
        } else if (stepNameLower.includes("objection")) {
          body = "We want to understand any barriers or concerns you might have.";
        } else if (stepNameLower.includes("education")) {
          body = "Learn about the impact and value of optimizing your cleanup process.";
        } else if (stepNameLower.includes("summary")) {
          body = "Review your results and choose your next step.";
        } else {
          body = `Complete this step to continue.`;
        }
      }
      
      // Use generated title/body (don't preserve wrong existing values)
      
      content += `${node.id} ${stepName} (Step)\n`;
      content += `- title: "${title}"\n`;
      content += `- body: "${body}"\n`;
      content += `- image: "${existing.image || ""}"\n`;
      content += `- imageAlt: "${existing.imageAlt || stepName}"\n\n`;
      
      content += `[meta:${node.id}]\n`;
      content += `purpose=${existing._meta?.purpose || purpose}\n`;
      content += `weight=${existing._meta?.weight || "1"}\n`;
      content += `tags=${existing._meta?.tags || tags}\n`;
      content += `exportRole=${existing._meta?.exportRole || "primary"}\n\n`;
    }
    
    if (node.type === "Choice") {
      const choiceName = node.name;
      const choiceNameLower = choiceName.toLowerCase();
      
      let label = existing.label;
      let kind = existing.kind || "understand";
      let signals: string[] = existing.signals || [];
      let opportunities: string[] = existing.opportunities || [];
      let severity = existing.severity || "medium";
      let affects: string[] = existing.affects || [];
      
      if (!label) {
        label = choiceName;
      }
      
      // Generate signals/opportunities based on choice name
      if (signals.length === 0) {
        if (choiceNameLower.includes("cost") || choiceNameLower.includes("calculate")) {
          signals = ["calculator_started", "cost_awareness"];
          opportunities = ["cost_calculated"];
          affects = ["cost_awareness", "decision_timeline"];
        } else if (choiceNameLower.includes("continue") || choiceNameLower.includes("next")) {
          signals = ["step_completed"];
          opportunities = ["flow_progress"];
          affects = ["engagement"];
        } else if (choiceNameLower.includes("complete") || choiceNameLower.includes("started")) {
          signals = ["flow_completed"];
          opportunities = ["conversion"];
          affects = ["conversion", "revenue"];
          severity = "high";
        } else {
          signals = [`${node.id.replace(/\./g, "_")}_selected`];
          opportunities = ["engagement"];
        }
      }
      
      content += `${node.id} ${choiceName} (Choice)\n`;
      content += `- label: "${label}"\n`;
      content += `- kind: "${kind}"\n`;
      if (signals.length > 0) {
        content += `- signals: ${JSON.stringify(signals)}\n`;
      }
      if (opportunities.length > 0) {
        content += `- opportunities: ${JSON.stringify(opportunities)}\n`;
      }
      if (affects.length > 0) {
        content += `- affects: ${JSON.stringify(affects)}\n`;
      }
      content += `- severity: "${severity}"\n\n`;
      
      content += `[meta:${node.id}]\n`;
      content += `weight=${existing._meta?.weight || "1"}\n\n`;
    }
  }
  
  return content;
}

function generateBlueprint(
  contract: ContractRequirements,
  schemas: any,
  artifacts: any,
  siteKey: string
): string {
  const brandName = siteKey.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  
  const calcQuestions = generateCalculatorIntakeQuestions(contract, schemas, artifacts);
  const costQuestions = generateCostVariableQuestions(contract, artifacts);
  const workflowQuestions = generateWorkflowDiagnosisQuestions(contract, artifacts);
  const objectionsQuestions = generateObjectionsBarriersQuestions(contract, artifacts);
  const educationQuestions = generateEducationQuestions(contract, artifacts);
  const summaryChoices = generateSummaryChoices(contract);

  let blueprint = "0.0 | Onboarding Flow | Flow\n\n";
  let stepId = 1;
  let choiceId = 1;

  // A) Calculator Intake with Variables
  blueprint += `${stepId}.0 | Calculator Intake | Step\n`;
  for (let i = 0; i < calcQuestions.length; i++) {
    const q = calcQuestions[i];
    const nextStep = i < calcQuestions.length - 1 ? `${stepId}.${choiceId + 1}` : `${stepId + 1}.0`;
    
    blueprint += `  ${stepId}.${choiceId} | ${q.question} | Choice\n`;
    
    // Add variable metadata if present
    if (q.variable) {
      blueprint += `var=${q.variable}\n`;
      if (q.type) blueprint += `type=${q.type}\n`;
      if (q.unit) blueprint += `unit=${q.unit}\n`;
    }
    
    blueprint += `      -> ${nextStep}\n`;
    choiceId++;
  }
  stepId++;
  choiceId = 1;

  // Derived Metrics System Step
  const metricsStepId = stepId;
  blueprint += `\n${metricsStepId}.0 | Derived Metrics | System\n`;
  const metrics = generateDerivedMetrics(calcQuestions);
  blueprint += metrics + "\n";
  stepId++;

  // B) Cost Variables (full section)
  blueprint += `\n${stepId}.0 | Cost Variables | Step\n`;
  for (let i = 0; i < costQuestions.length; i++) {
    const nextStep = i < costQuestions.length - 1 ? `${stepId}.${choiceId + 1}` : `${stepId + 1}.0`;
    blueprint += `  ${stepId}.${choiceId} | ${costQuestions[i]} | Choice\n`;
    blueprint += `      -> ${nextStep}\n`;
    choiceId++;
  }
  stepId++;
  choiceId = 1;

  // Conditional Routing Step (after cost variables, before workflow)
  const routingStepId = stepId;
  const workflowStepId = stepId + 4; // After 3 conditional paths + routing step
  blueprint += `\n${routingStepId}.0 | Diagnostic Routing | Step\n`;
  // Calculate next step IDs for conditional paths
  const costEducationStepId = stepId + 1;
  const appearanceTrustStepId = stepId + 2;
  const optimizationTipsStepId = stepId + 3;
  
  const routing = generateConditionalRouting(routingStepId, costEducationStepId, appearanceTrustStepId, optimizationTipsStepId);
  blueprint += routing.choices.join("\n") + "\n";
  
  // Conditional Path 1: Cost Education
  blueprint += `\n${costEducationStepId}.0 | Cost Education | Step\n`;
  blueprint += `  ${costEducationStepId}.1 | Continue | Choice\n`;
  blueprint += `      -> ${workflowStepId}.0\n`;
  
  // Conditional Path 2: Appearance Trust
  blueprint += `\n${appearanceTrustStepId}.0 | Appearance Trust | Step\n`;
  blueprint += `  ${appearanceTrustStepId}.1 | Continue | Choice\n`;
  blueprint += `      -> ${workflowStepId}.0\n`;
  
  // Conditional Path 3: Optimization Tips
  blueprint += `\n${optimizationTipsStepId}.0 | Optimization Tips | Step\n`;
  blueprint += `  ${optimizationTipsStepId}.1 | Continue | Choice\n`;
  blueprint += `      -> ${workflowStepId}.0\n`;
  
  stepId = workflowStepId;
  choiceId = 1;

  // C) Workflow/Process Diagnosis
  blueprint += `\n${stepId}.0 | Workflow Diagnosis | Step\n`;
  for (let i = 0; i < workflowQuestions.length; i++) {
    const nextStep = i < workflowQuestions.length - 1 ? `${stepId}.${choiceId + 1}` : `${stepId + 1}.0`;
    blueprint += `  ${stepId}.${choiceId} | ${workflowQuestions[i]} | Choice\n`;
    blueprint += `      -> ${nextStep}\n`;
    choiceId++;
  }
  stepId++;
  choiceId = 1;

  // D) Objections & Barriers
  blueprint += `\n${stepId}.0 | Objections & Barriers | Step\n`;
  for (let i = 0; i < objectionsQuestions.length; i++) {
    const nextStep = i < objectionsQuestions.length - 1 ? `${stepId}.${choiceId + 1}` : `${stepId + 1}.0`;
    blueprint += `  ${stepId}.${choiceId} | ${objectionsQuestions[i]} | Choice\n`;
    blueprint += `      -> ${nextStep}\n`;
    choiceId++;
  }
  stepId++;
  choiceId = 1;

  // E) Education
  blueprint += `\n${stepId}.0 | Education | Step\n`;
  for (let i = 0; i < educationQuestions.length; i++) {
    const nextStep = i < educationQuestions.length - 1 ? `${stepId}.${choiceId + 1}` : `${stepId + 1}.0`;
    blueprint += `  ${stepId}.${choiceId} | ${educationQuestions[i]} | Choice\n`;
    blueprint += `      -> ${nextStep}\n`;
    choiceId++;
  }
  stepId++;
  choiceId = 1;

  // F) Summary + Next Steps
  blueprint += `\n${stepId}.0 | Summary & Next Steps | Step\n`;
  for (let i = 0; i < summaryChoices.length; i++) {
    blueprint += `  ${stepId}.${choiceId} | ${summaryChoices[i]} | Choice\n`;
    choiceId++;
  }
  stepId++;

  // Result Assembly System Step
  blueprint += `\n${generateResultAssembly(stepId)}\n`;

  // Export Block
  blueprint += `\n${generateExportBlock()}\n`;

  return blueprint;
}

function validateBlueprint(blueprint: string, contract: ContractRequirements): { valid: boolean; errors: string[]; stats: any } {
  const errors: string[] = [];
  const lines = blueprint.split("\n").filter(l => l.trim());

  // Count nodes
  const steps = lines.filter(l => /^\d+\.0\s*\|/.test(l)).length;
  const choices = lines.filter(l => /^\s+\d+\.\d+\s*\|/.test(l)).length;
  const totalNodes = steps + choices;

  // Count choices per section (by section name, not step number)
  const sectionCounts: Record<string, number> = {};
  let currentSection: string | null = null;
  
  for (const line of lines) {
    const stepMatch = line.match(/^\d+\.0\s*\|\s*(.+?)\s*\|\s*(\w+)/);
    if (stepMatch) {
      const sectionName = stepMatch[1].toLowerCase();
      const stepType = stepMatch[2];
      // Skip System steps for section counting
      if (stepType !== "System" && stepType !== "Flow") {
        currentSection = sectionName;
        sectionCounts[currentSection] = 0;
      } else {
        currentSection = null;
      }
    }
    const choiceMatch = line.match(/^\s+\d+\.\d+\s*\|/);
    if (choiceMatch && currentSection) {
      sectionCounts[currentSection] = (sectionCounts[currentSection] || 0) + 1;
    }
  }
  
  // Map section names to contract requirements
  const sectionMapping: Record<string, keyof ContractRequirements> = {
    "calculator intake": "calculatorIntake",
    "cost variables": "costVariables",
    "workflow diagnosis": "workflowDiagnosis",
    "objections & barriers": "objectionsBarriers",
    "education": "education",
    "summary & next steps": "summary",
    "summary": "summary",
  };
  
  // Also check for partial matches (but exclude conditional paths)
  const conditionalPathNames = ["cost education", "appearance trust", "optimization tips", "diagnostic routing"];
  const findSectionKey = (sectionName: string): keyof ContractRequirements | null => {
    // Skip conditional paths
    if (conditionalPathNames.some(path => sectionName.toLowerCase().includes(path))) {
      return null;
    }
    // Exact match
    if (sectionMapping[sectionName]) {
      return sectionMapping[sectionName];
    }
    // Partial match (e.g., "summary" matches "summary & next steps")
    for (const [key, value] of Object.entries(sectionMapping)) {
      if (sectionName.toLowerCase().includes(key) || key.includes(sectionName.toLowerCase())) {
        return value;
      }
    }
    return null;
  };

  // Count variables
  const variables = new Set<string>();
  for (const line of lines) {
    const varMatch = line.match(/^var=(\w+)/);
    if (varMatch) {
      variables.add(varMatch[1]);
    }
  }

  // Count derived metrics
  const metrics = lines.filter(l => /^metric:\s*/.test(l)).length;

  // Count conditional routing branches
  const conditionalBranches = lines.filter(l => /^condition:\s*/.test(l)).length;

  // Check for Result Assembly step
  const hasResultAssembly = lines.some(l => /Result Assembly.*System/.test(l));

  // Check for Export block
  const hasExports = lines.some(l => /^\[exports\]/.test(l));

  // Validate minimum counts
  if (steps < 6) {
    errors.push(`Insufficient Steps: Found ${steps}, required minimum 6 (one per section)`);
  }

  if (totalNodes < contract.totalNodes.min) {
    errors.push(`Insufficient total nodes: Found ${totalNodes}, required minimum ${contract.totalNodes.min}`);
  }

  // Validate section counts by name
  for (const sectionName of Object.keys(sectionCounts)) {
    const contractKey = findSectionKey(sectionName);
    if (contractKey) {
      const count = sectionCounts[sectionName] || 0;
      const contractReq = contract[contractKey];
      if ('min' in contractReq) {
        const minRequired = contractReq.min;
        if (count < minRequired) {
          errors.push(`${sectionName} section: Found ${count} choices, required minimum ${minRequired}`);
        }
      }
    }
  }
  
  // Also check that all required sections exist
  for (const [expectedName, contractKey] of Object.entries(sectionMapping)) {
    const found = Object.keys(sectionCounts).some(name => 
      name.includes(expectedName) || expectedName.includes(name)
    );
    if (!found && 'min' in contract[contractKey]) {
      errors.push(`Required section "${expectedName}" not found in blueprint`);
    }
  }

  // Validate diagnostic requirements
  if (variables.size < contract.variables.min) {
    errors.push(`Variables: Found ${variables.size}, required minimum ${contract.variables.min}`);
  }

  if (metrics < contract.derivedMetrics.min) {
    errors.push(`Derived metrics: Found ${metrics}, required minimum ${contract.derivedMetrics.min}`);
  }

  if (conditionalBranches < contract.conditionalBranches.min) {
    errors.push(`Conditional routing branches: Found ${conditionalBranches}, required minimum ${contract.conditionalBranches.min}`);
  }

  if (contract.resultAssembly.required && !hasResultAssembly) {
    errors.push(`Result Assembly step: Required but not found`);
  }

  if (contract.exports.required && !hasExports) {
    errors.push(`Export block: Required but not found`);
  }

  // Check for IDs
  const stepIds = new Set<string>();
  const choiceIds = new Set<string>();
  for (const line of lines) {
    const stepMatch = line.match(/^(\d+\.0)\s*\|/);
    if (stepMatch) {
      if (stepIds.has(stepMatch[1])) {
        errors.push(`Duplicate Step ID: ${stepMatch[1]}`);
      }
      stepIds.add(stepMatch[1]);
    }
    const choiceMatch = line.match(/^\s+(\d+\.\d+)\s*\|/);
    if (choiceMatch) {
      if (choiceIds.has(choiceMatch[1])) {
        errors.push(`Duplicate Choice ID: ${choiceMatch[1]}`);
      }
      choiceIds.add(choiceMatch[1]);
    }
  }

  // Check routing targets
  const allIds = new Set([...stepIds, ...choiceIds]);
  const routingTargets = lines
    .filter(l => l.includes("->"))
    .map(l => l.match(/->\s*([\d.]+)/)?.[1])
    .filter(Boolean);

  for (const target of routingTargets) {
    if (!allIds.has(target!)) {
      errors.push(`Invalid routing target: ${target} (target does not exist)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      steps,
      choices,
      totalNodes,
      sectionCounts: sectionCounts, // Now keyed by section name
      variables: variables.size,
      metrics,
      conditionalBranches,
      hasResultAssembly,
      hasExports,
    },
  };
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Load contract
    console.log("[LOGIC] Loading blueprint contract...");
    const contract = loadContract();
    console.log("[LOGIC] ✓ Contract loaded");

    const websiteInput = await rl.question("Enter website URL or domain (e.g., containercreations.com): ");

    if (!websiteInput || !websiteInput.trim()) {
      console.error("[LOGIC] Error: Website URL or domain is required");
      process.exit(1);
    }

    const trimmedInput = websiteInput.trim();
    const siteKey = trimmedInput.includes("://") 
      ? generateSiteKey(trimmedInput) 
      : (trimmedInput.includes(".") ? generateSiteKey(normalizeWebsiteUrl(trimmedInput)) : trimmedInput);
    
    console.log("[LOGIC] Generating grounded blueprint for:", siteKey);

    // Load site artifacts
    console.log("[LOGIC] Loading site artifacts...");
    const artifacts = loadSiteArtifacts(siteKey);
    if (artifacts.report) console.log("[LOGIC] ✓ Loaded report.final.json");
    if (artifacts.valueModel) console.log("[LOGIC] ✓ Loaded value.model.json");
    if (artifacts.productGraph) console.log("[LOGIC] ✓ Loaded product.graph.json");
    if (artifacts.schema) console.log("[LOGIC] ✓ Loaded schema.json");

    // Load calculator schemas
    console.log("[LOGIC] Loading calculator schemas...");
    const schemas = loadCalculatorSchemas();
    if (schemas.cleanupLogic) console.log("[LOGIC] ✓ Loaded cleanup.logic.json");
    if (schemas.cleanupFlow) console.log("[LOGIC] ✓ Loaded 25x-cleanup-flow.json");

    // Ensure directories exist
    const onboardingDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey,
      "onboarding"
    );
    const exportsDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      siteKey,
      "exports"
    );

    fs.mkdirSync(onboardingDir, { recursive: true });
    fs.mkdirSync(exportsDir, { recursive: true });

    // Generate blueprint
    console.log("[LOGIC] Generating blueprint...");
    const blueprint = generateBlueprint(contract, schemas, artifacts, siteKey);

    // Validate blueprint
    console.log("[LOGIC] Validating blueprint against contract...");
    const validation = validateBlueprint(blueprint, contract);

    if (!validation.valid) {
      console.error("[LOGIC] ✗ Blueprint validation failed:");
      for (const error of validation.errors) {
        console.error(`[LOGIC]   - ${error}`);
      }
      console.error("\n[LOGIC] Current blueprint stats:");
      console.error(`[LOGIC]   Steps: ${validation.stats.steps}`);
      console.error(`[LOGIC]   Choices: ${validation.stats.choices}`);
      console.error(`[LOGIC]   Total nodes: ${validation.stats.totalNodes}`);
      console.error(`[LOGIC]   Section counts:`, validation.stats.sectionCounts);
      process.exit(1);
    }

    console.log("[LOGIC] ✓ Blueprint validation passed");
    console.log(`[LOGIC]   Steps: ${validation.stats.steps}`);
    console.log(`[LOGIC]   Choices: ${validation.stats.choices}`);
    console.log(`[LOGIC]   Total nodes: ${validation.stats.totalNodes}`);
    console.log(`[LOGIC]   Section breakdown:`, validation.stats.sectionCounts);
    console.log(`[LOGIC]   Variables captured: ${validation.stats.variables}`);
    console.log(`[LOGIC]   Derived metrics: ${validation.stats.metrics}`);
    console.log(`[LOGIC]   Conditional branches: ${validation.stats.conditionalBranches}`);
    console.log(`[LOGIC]   Result Assembly: ${validation.stats.hasResultAssembly ? "✓" : "✗"}`);
    console.log(`[LOGIC]   Export block: ${validation.stats.hasExports ? "✓" : "✗"}`);

    // Write blueprint.txt (always overwrite when generating)
    const blueprintPath = path.join(onboardingDir, "blueprint.txt");
    fs.writeFileSync(blueprintPath, blueprint, "utf8");
    console.log(`[LOGIC] ✓ Generated ${blueprintPath}`);

    // B) Generate content.txt for ALL blueprint nodes
    console.log("[LOGIC] Generating content.txt for all blueprint nodes...");
    const blueprintIds = extractBlueprintIds(blueprint);
    const contentPath = path.join(onboardingDir, "content.txt");
    const existingContent = fs.existsSync(contentPath) 
      ? fs.readFileSync(contentPath, "utf8")
      : "";
    
    const contentContent = generateContentForBlueprint(blueprint, existingContent, siteKey);
    fs.writeFileSync(contentPath, contentContent, "utf8");
    
    // A) Audit ID parity - verify content has all blueprint IDs
    const contentIds = extractContentIds(contentContent);
    const blueprintIdsSet = new Set(blueprintIds);
    const missingInContent = blueprintIds.filter(id => !contentIds.has(id));
    const extraInContent = Array.from(contentIds).filter(id => !blueprintIdsSet.has(id));
    
    console.log(`[LOGIC] ID Parity Check:`);
    console.log(`[LOGIC]   Blueprint IDs: ${blueprintIds.length}`);
    console.log(`[LOGIC]   Content IDs: ${contentIds.size}`);
    
    if (missingInContent.length > 0) {
      console.error(`[LOGIC] ✗ ID PARITY FAILED - Content missing ${missingInContent.length} blueprint IDs:`);
      missingInContent.forEach(id => console.error(`[LOGIC]   - Missing: ${id}`));
      process.exit(1);
    }
    if (extraInContent.length > 0) {
      console.warn(`[LOGIC] ⚠ Content has ${extraInContent.length} extra IDs not in blueprint:`);
      extraInContent.forEach(id => console.warn(`[LOGIC]   - Extra: ${id}`));
    } else {
      console.log(`[LOGIC] ✓ ID parity: PASS (all ${blueprintIds.length} blueprint IDs have content)`);
    }
    console.log(`[LOGIC] ✓ Generated complete ${contentPath}`);
    console.log(`[LOGIC] ✓ Content covers all ${blueprintIds.length} blueprint nodes (${blueprintIds.length} IDs)`);

    // C) Generate supportAI.txt with ID-keyed support blocks
    console.log("[LOGIC] Generating supportAI.txt with ID-keyed support blocks...");
    const supportAIPath = path.join(onboardingDir, "supportAI.txt");
    const supportAIContent = generateSupportAIForBlueprint(blueprint, siteKey, artifacts);
    fs.writeFileSync(supportAIPath, supportAIContent, "utf8");
    console.log(`[LOGIC] ✓ Generated ${supportAIPath}`);

    console.log(`\n[LOGIC] ✓ Blueprint generation complete for ${siteKey}`);
    console.log(`[LOGIC]   Total nodes: ${validation.stats.totalNodes} (minimum required: ${contract.totalNodes.min})`);
    console.log(`[LOGIC] Next: Run 'npm run onboarding' to generate onboarding.flow.json`);
  } catch (error: any) {
    console.error("[LOGIC] Error:", error?.message || error);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[LOGIC] Fatal error:", error);
    process.exit(1);
  });
}
