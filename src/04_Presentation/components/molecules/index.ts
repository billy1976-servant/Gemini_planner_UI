/**
 * Molecules — 12 contract compounds. Single source: molecules.json + these components.
 * No navigation or pricing-table (organs only).
 */
import type { ComponentType } from "react";
import Section from "./section.compound";
import Button from "./button.compound";
import Card from "./card.compound";
import Avatar from "./avatar.compound";
import Chip from "./chip.compound";
import Field from "./field.compound";
import Footer from "./footer.compound";
import List from "./list.compound";
import Modal from "./modal.compound";
import Stepper from "./stepper.compound";
import Toast from "./toast.compound";
import Toolbar from "./toolbar.compound";

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
};

export function getCompoundComponent(id: string): ReactComponent | undefined {
  if (!id || typeof id !== "string") return undefined;
  return COMPONENT_MAP[id] ?? undefined;
}
