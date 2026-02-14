/**
 * Unified pipeline stage contract for diagnostics.
 * Each stage (JSON, Template, Layout, Palette, Molecule, Atom, Renderer, DOM) can report pass/fail and optional trace link.
 */

export type PipelineStageId =
  | "json"
  | "template"
  | "layout"
  | "palette"
  | "molecule"
  | "atom"
  | "renderer"
  | "dom";

export type PipelineStageResult = {
  stageId: PipelineStageId;
  label: string;
  pass: boolean;
  message?: string;
  contractResult?: string;
  traceLink?: string;
};

export const PIPELINE_STAGE_ORDER: PipelineStageId[] = [
  "json",
  "template",
  "layout",
  "palette",
  "molecule",
  "atom",
  "renderer",
  "dom",
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStageId, string> = {
  json: "JSON",
  template: "Template",
  layout: "Layout",
  palette: "Palette",
  molecule: "Molecule",
  atom: "Atom",
  renderer: "Renderer",
  dom: "DOM",
};
