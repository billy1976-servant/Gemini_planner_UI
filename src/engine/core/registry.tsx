"use client";
/**
 * Component Registry — single source of truth for JSON node type → React component.
 * JsonRenderer resolves node.type via Registry only; no competing type→component maps.
 * Add new node types here (or derive from JSON manifest if a future contract requires);
 * do not duplicate Registry or maintain a separate type map elsewhere.
 */
// =====================================================
// ATOMS (ENGINE INTERNAL)
// =====================================================
import TextAtom from "@/components/9-atoms/primitives/text";
import MediaAtom from "@/components/9-atoms/primitives/media";
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import SequenceAtom from "@/components/9-atoms/primitives/sequence";
import TriggerAtom from "@/components/9-atoms/primitives/trigger";
import CollectionAtom from "@/components/9-atoms/primitives/collection";
import ConditionAtom from "@/components/9-atoms/primitives/condition";
import ShellAtom from "@/components/9-atoms/primitives/shell";
import FieldAtom from "@/components/9-atoms/primitives/field";
import SelectAtom from "@/components/9-atoms/primitives/select";
// =====================================================
// UI MOLECULES (LOCKED, JSON-FACING — DO NOT ADD MORE)
// =====================================================
import { USE_BLOCKS_AS_PRIMARY } from "@/blocks/blocks-runtime-config";
import { getCompoundComponent } from "@/blocks/compound-runtime-adapter";
import Section from "@/compounds/ui/12-molecules/section.compound";
import Button from "@/compounds/ui/12-molecules/button.compound";
import Card from "@/compounds/ui/12-molecules/card.compound";
import Avatar from "@/compounds/ui/12-molecules/avatar.compound";
import Chip from "@/compounds/ui/12-molecules/chip.compound";
import Field from "@/compounds/ui/12-molecules/field.compound";
import Footer from "@/compounds/ui/12-molecules/footer.compound";
import List from "@/compounds/ui/12-molecules/list.compound";
import Modal from "@/compounds/ui/12-molecules/modal.compound";
import Stepper from "@/compounds/ui/12-molecules/stepper.compound";
import Toast from "@/compounds/ui/12-molecules/toast.compound";
import Toolbar from "@/compounds/ui/12-molecules/toolbar.compound";
// =====================================================
// STATE-AWARE VIEWERS (NON-MOLECULE, SAFE)
// =====================================================
import userInputViewer from "@/ui/user-input-viewer";
import JournalHistory from "@/ui/molecules/JournalHistory";
// =====================================================
// LAYOUT MOLECULES (STRUCTURAL ONLY)
// =====================================================
import RowLayout from "@/lib/layout/molecules/row-layout";
import ColumnLayout from "@/lib/layout/molecules/column-layout";
import GridLayout from "@/lib/layout/molecules/grid-layout";
import StackLayout from "@/lib/layout/molecules/stack-layout";
import PageLayout from "@/lib/layout/molecules/page-layout";
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


  select: SelectAtom,
  Select: SelectAtom,


  // 🔹 UI molecules (blocks-first when USE_BLOCKS_AS_PRIMARY; fallback to direct import)
  section: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("section") ?? Section) : Section,
  Section: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("section") ?? Section) : Section,


  button: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("button") ?? Button) : Button,
  Button: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("button") ?? Button) : Button,


  card: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("card") ?? Card) : Card,
  Card: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("card") ?? Card) : Card,


  avatar: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("avatar") ?? Avatar) : Avatar,
  Avatar: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("avatar") ?? Avatar) : Avatar,


  chip: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("chip") ?? Chip) : Chip,
  Chip: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("chip") ?? Chip) : Chip,


  field: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("field") ?? Field) : Field,
  Field: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("field") ?? Field) : Field,


  footer: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("footer") ?? Footer) : Footer,
  Footer: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("footer") ?? Footer) : Footer,


  list: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("list") ?? List) : List,
  List: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("list") ?? List) : List,


  modal: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("modal") ?? Modal) : Modal,
  Modal: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("modal") ?? Modal) : Modal,


  stepper: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("stepper") ?? Stepper) : Stepper,
  Stepper: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("stepper") ?? Stepper) : Stepper,


  toast: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("toast") ?? Toast) : Toast,
  Toast: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("toast") ?? Toast) : Toast,


  toolbar: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("toolbar") ?? Toolbar) : Toolbar,
  Toolbar: USE_BLOCKS_AS_PRIMARY ? (getCompoundComponent("toolbar") ?? Toolbar) : Toolbar,


  // 🔹 STATE-AWARE VIEWERS
  UserInputViewer: userInputViewer,
  userInputViewer: userInputViewer,
  userinputviewer: userInputViewer,

  // 🔹 Journal display (non-molecule, safe)
  JournalHistory: JournalHistory,
  journalHistory: JournalHistory,
  journalViewer: JournalHistory,
  journalhistory: JournalHistory,


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
};


export default Registry;

