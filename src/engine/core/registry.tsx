"use client";
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
// =====================================================
// UI MOLECULES (LOCKED, JSON-FACING — DO NOT ADD MORE)
// =====================================================
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
import Navigation from "@/compounds/ui/12-molecules/navigation.compound";
// Phase 8: Content Block Library
import PricingTable from "@/compounds/ui/12-molecules/pricing-table.compound";
import FAQ from "@/compounds/ui/12-molecules/faq.compound";
import CTABanner from "@/compounds/ui/12-molecules/cta-banner.compound";
import ImageGallery from "@/compounds/ui/12-molecules/image-gallery.compound";
import IconTextRow from "@/compounds/ui/12-molecules/icon-text-row.compound";
// =====================================================
// STATE-AWARE VIEWERS (NON-MOLECULE, SAFE)
// =====================================================
import userInputViewer from "@/ui/user-input-viewer";
import JournalHistory from "@/ui/molecules/JournalHistory";
// =====================================================
// LAYOUT MOLECULES (STRUCTURAL ONLY)
// =====================================================
import RowLayout from "@/layout/molecules/row-layout";
import ColumnLayout from "@/layout/molecules/column-layout";
import GridLayout from "@/layout/molecules/grid-layout";
import StackLayout from "@/layout/molecules/stack-layout";
import PageLayout from "@/layout/molecules/page-layout";
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


  // 🔹 UI molecules
  section: Section,
  Section: Section,


  button: Button,
  Button: Button,


  card: Card,
  Card: Card,


  avatar: Avatar,
  Avatar: Avatar,


  chip: Chip,
  Chip: Chip,


  field: Field,
  Field: Field,


  footer: Footer,
  Footer: Footer,


  list: List,
  List: List,


  modal: Modal,
  Modal: Modal,


  stepper: Stepper,
  Stepper: Stepper,


  toast: Toast,
  Toast: Toast,


  toolbar: Toolbar,
  Toolbar: Toolbar,

  navigation: Navigation,
  Navigation: Navigation,

  // 🔹 CONTENT BLOCKS (Phase 8)
  pricingtable: PricingTable,
  PricingTable: PricingTable,

  faq: FAQ,
  FAQ: FAQ,

  ctabanner: CTABanner,
  CTABanner: CTABanner,

  imagegallery: ImageGallery,
  ImageGallery: ImageGallery,

  icontextrow: IconTextRow,
  IconTextRow: IconTextRow,


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

