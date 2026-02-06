// src/logic/engines/decision-types.ts
// Canonical Decision State types
// 
// CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts

import type { ExportDocumentContract } from "@/contracts/SystemContract";

export type DecisionState = {
  signals: string[];
  blockers: string[];
  opportunities: string[];
  recommendedNextSteps: RecommendedStep[];
  context: {
    location?: string;
    household?: Record<string, any>;
    businessType?: string;
    budgetTier?: string;
    [key: string]: any;
  };
  outputs: {
    immediateView: UIBlock[];
    expandedView: ExpandedBlock[];
    exportView: DocumentBlock[];
    exportArtifacts: ExportArtifact[];
  };
};

export type RecommendedStep = {
  stepId: string;
  reason: string;
  priority: "low" | "medium" | "high";
  basedOn: string[]; // Signals/blockers that triggered this recommendation
};

export type ExpandedBlock = {
  type: "explainer" | "accordion" | "detail";
  title: string;
  content: string;
  sections?: ExpandedSection[];
  metadata?: Record<string, any>;
};

export type ExpandedSection = {
  title: string;
  content: string;
  expanded?: boolean;
};

export type ExportArtifact = {
  type: "checklist" | "summary" | "action-plan" | "contractor-summary" | "homeowner-plan";
  title: string;
  content: string | Record<string, any>;
  format: "text" | "markdown" | "json";
  metadata?: Record<string, any>;
};

export type DecisionSignal = {
  signal: string;
  severity: "low" | "medium" | "high";
  affects?: string[];
  context?: Record<string, any>;
};

export type UIBlock = {
  type: "alert" | "opportunity" | "signal" | "summary";
  severity: "low" | "medium" | "high";
  title: string;
  items: string[];
  metadata?: Record<string, any>;
};

// DocumentBlock must satisfy ExportDocumentContract
export type DocumentBlock = ExportDocumentContract;
