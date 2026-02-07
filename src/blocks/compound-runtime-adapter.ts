/**
 * Compound runtime adapter — resolves compound components from blocks manifest first.
 *
 * Uses compounds.manifest.json runtimePath; components are loaded via static imports
 * (same TSX files as registry) so resolution is sync. If id is not in manifest or
 * lookup fails, caller falls back to existing registry/component logic.
 *
 * Does NOT remove or replace registry structure; registry uses this when
 * USE_BLOCKS_AS_PRIMARY is true.
 */

import type { ComponentType } from "react";
import compoundsManifest from "./compounds.manifest.json";
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
import PricingTable from "@/compounds/ui/12-molecules/pricing-table.compound";

type ReactComponent = ComponentType<any>;

const COMPONENT_MAP: Record<string, ReactComponent> = {
  section: Section,
  button: Button,
  card: Card,
  avatar: Avatar,
  chip: Chip,
  field: Field,
  footer: Footer,
  list: List,
  modal: Modal,
  stepper: Stepper,
  toast: Toast,
  toolbar: Toolbar,
  navigation: Navigation,
  "pricing-table": PricingTable,
};

/**
 * Returns the compound component for an id from the blocks manifest path.
 * Uses pre-loaded map keyed by manifest id. If not found, returns undefined
 * so caller can fall back to existing registry behavior.
 */
export function getCompoundComponent(id: string): ReactComponent | undefined {
  if (!id || typeof id !== "string") return undefined;
  const entry = compoundsManifest.compounds[id as keyof typeof compoundsManifest.compounds];
  if (!entry?.runtimePath) return undefined;
  return COMPONENT_MAP[id] ?? undefined;
}
