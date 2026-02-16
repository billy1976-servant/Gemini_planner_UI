"use client";
import React from "react";
/**
 * Component Registry — single source of truth for JSON node type → React component.
 * JsonRenderer resolves node.type via Registry only; no competing type→component maps.
 * Add new node types here (or derive from JSON manifest if a future contract requires);
 * do not duplicate Registry or maintain a separate type map elsewhere.
 */
// =====================================================
// ATOMS (ENGINE INTERNAL) — src/components/atoms
// =====================================================
import {
  TextAtom,
  MediaAtom,
  SurfaceAtom,
  SequenceAtom,
  TriggerAtom,
  CollectionAtom,
  ConditionAtom,
  ShellAtom,
  FieldAtom,
} from "@/components/atoms";
// =====================================================
// UI MOLECULES — 12 contract molecules (getCompoundComponent)
// =====================================================
import { getCompoundComponent } from "@/components/molecules";
// =====================================================
// STATE-AWARE VIEWERS (NON-MOLECULE, SAFE)
// =====================================================
import userInputViewer from "@/ui/user-input-viewer";
import JournalHistory from "@/ui/molecules/JournalHistory";
import DiagnosticsValueViewer from "@/ui/dev/DiagnosticsValueViewer";
import DiagnosticsLevelSelect from "@/ui/dev/DiagnosticsLevelSelect";
// =====================================================
// LAYOUT MOLECULES (STRUCTURAL ONLY)
// =====================================================
import RowLayout from "@/lib/layout/molecules/row-layout";
import ColumnLayout from "@/lib/layout/molecules/column-layout";
import GridLayout from "@/lib/layout/molecules/grid-layout";
import StackLayout from "@/lib/layout/molecules/stack-layout";
import PageLayout from "@/lib/layout/molecules/page-layout";
// =====================================================
// FLOW/ONBOARDING CARDS (JSON type → component; adapter for JsonRenderer props)
// =====================================================
import { CalculatorCard, EducationCard, SummaryCard } from "@/ui/molecules/cards";
<<<<<<< HEAD
// =====================================================
// OSB HOME V2 (text-first, registry-driven)
// =====================================================
import OsbHomeV2 from "@/apps-tsx/HiClarify/OsbHomeV2";
import AppsListV2 from "@/apps-tsx/HiClarify/AppsListV2";
=======
>>>>>>> c529cf0 (Clean version)

/** Wrap card components so they receive JsonRenderer spread props; provide no-op callbacks for standalone render. */
function wrapCard(CardComponent: React.ComponentType<any>) {
  return (props: any) => (
    <CardComponent
      onAdvance={() => {}}
      onComplete={() => {}}
      restoreState={null}
      {...props}
    />
  );
}

// =====================================================
// REGISTRY — JSON `type` → COMPONENT
// =====================================================
export const Registry = {
  // 🔹 ROOT
  screen: ({ children }: any) => <>{children}</>,
  Screen: ({ children }: any) => <>{children}</>,


  // 🔹 Atoms
  text: TextAtom,
  Text: TextAtom,


  media: MediaAtom,
  Media: MediaAtom,


  surface: SurfaceAtom,
  Surface: SurfaceAtom,


  sequence: SequenceAtom,
  Sequence: SequenceAtom,


  trigger: TriggerAtom,
  Trigger: TriggerAtom,


  collection: CollectionAtom,
  Collection: CollectionAtom,


  condition: ConditionAtom,
  Condition: ConditionAtom,


  shell: ShellAtom,
  Shell: ShellAtom,


  fieldatom: FieldAtom,
  FieldAtom: FieldAtom,


  // 🔹 INPUT ALIAS
  textarea: FieldAtom,
  Textarea: FieldAtom,


  // 🔹 UI molecules (12 contract only)
  section: getCompoundComponent("section") ?? (() => null),
  Section: getCompoundComponent("section") ?? (() => null),

  button: getCompoundComponent("button") ?? (() => null),
  Button: getCompoundComponent("button") ?? (() => null),

  card: getCompoundComponent("card") ?? (() => null),
  Card: getCompoundComponent("card") ?? (() => null),

  avatar: getCompoundComponent("avatar") ?? (() => null),
  Avatar: getCompoundComponent("avatar") ?? (() => null),

  chip: getCompoundComponent("chip") ?? (() => null),
  Chip: getCompoundComponent("chip") ?? (() => null),

  field: getCompoundComponent("field") ?? (() => null),
  Field: getCompoundComponent("field") ?? (() => null),

  footer: getCompoundComponent("footer") ?? (() => null),
  Footer: getCompoundComponent("footer") ?? (() => null),

  list: getCompoundComponent("list") ?? (() => null),
  List: getCompoundComponent("list") ?? (() => null),

  modal: getCompoundComponent("modal") ?? (() => null),
  Modal: getCompoundComponent("modal") ?? (() => null),

  stepper: getCompoundComponent("stepper") ?? (() => null),
  Stepper: getCompoundComponent("stepper") ?? (() => null),

  toast: getCompoundComponent("toast") ?? (() => null),
  Toast: getCompoundComponent("toast") ?? (() => null),

  toolbar: getCompoundComponent("toolbar") ?? (() => null),
  Toolbar: getCompoundComponent("toolbar") ?? (() => null),

  // 🔹 Flow/onboarding card types (referenced by JSON; reconnected for prod visibility)
  question: wrapCard(EducationCard),
  Question: wrapCard(EducationCard),
  education: wrapCard(EducationCard),
  Education: wrapCard(EducationCard),
  calculator: wrapCard(CalculatorCard),
  Calculator: wrapCard(CalculatorCard),
  summary: wrapCard(SummaryCard),
  Summary: wrapCard(SummaryCard),
  cta: getCompoundComponent("button") ?? (() => null),
  Cta: getCompoundComponent("button") ?? (() => null),
  CTA: getCompoundComponent("button") ?? (() => null),

  // 🔹 STATE-AWARE VIEWERS
  UserInputViewer: userInputViewer,
  userInputViewer: userInputViewer,
  userinputviewer: userInputViewer,

  // 🔹 Journal display (non-molecule, safe)
  JournalHistory: JournalHistory,
  journalHistory: JournalHistory,
  journalViewer: JournalHistory,
  journalhistory: JournalHistory,

  // 🔹 Diagnostics (dev only; inline result viewer + level control)
  "diagnostics-value": DiagnosticsValueViewer,
  DiagnosticsValue: DiagnosticsValueViewer,
  select: DiagnosticsLevelSelect,
  Select: DiagnosticsLevelSelect,

  // 🔹 Layout molecules (screen-level)
  row: RowLayout,
  Row: RowLayout,


  column: ColumnLayout,
  Column: ColumnLayout,


  grid: GridLayout,
  Grid: GridLayout,


  stack: StackLayout,
  Stack: StackLayout,


  page: PageLayout,
  Page: PageLayout,

  // 🔹 OSB Home V2 (single doorway screen; content from osb-home-registry.json)
  OsbHomeV2,
  osbHomeV2: OsbHomeV2,

  // 🔹 Apps list V2 (search + alphabetical; data from apps_categories.json)
  AppsListV2,
  appsListV2: AppsListV2,
};


export default Registry;

