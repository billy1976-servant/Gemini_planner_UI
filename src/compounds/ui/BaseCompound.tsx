// src/compounds/ui/BaseCompound.tsx
"use client";


import React from "react";


/* ===============================
   IMPORT ALL 12 MOLECULES
   =============================== */
import AvatarCompound from "./12-molecules/avatar.compound";
import ButtonCompound from "./12-molecules/button.compound";
import CardCompound from "./12-molecules/card.compound";
import ChipCompound from "./12-molecules/chip.compound";
import FieldCompound from "./12-molecules/field.compound";
import FooterCompound from "./12-molecules/footer.compound";
import ListCompound from "./12-molecules/list.compound";
import ModalCompound from "./12-molecules/modal.compound";
import SectionCompound from "./12-molecules/section.compound";
import StepperCompound from "./12-molecules/stepper.compound";
import ToastCompound from "./12-molecules/toast.compound";
import ToolbarCompound from "./12-molecules/toolbar.compound";


/* ===============================
   MOLECULE REGISTRY
   =============================== */
const REGISTRY: Record<string, React.FC<any>> = {
  avatar: AvatarCompound,
  button: ButtonCompound,
  card: CardCompound,
  chip: ChipCompound,
  field: FieldCompound,
  footer: FooterCompound,
  list: ListCompound,
  modal: ModalCompound,
  section: SectionCompound,
  stepper: StepperCompound,
  toast: ToastCompound,
  toolbar: ToolbarCompound,
};


/* ===============================
   BASE COMPOUND ROUTER
   =============================== */
export default function BaseCompound(props: any) {
  const { type, ...rest } = props;


  const Component = REGISTRY[type];


  if (!Component) {
    return (
      <div style={{ color: "red" }}>
        Unknown compound type: <strong>{type}</strong>
      </div>
    );
  }


  return <Component {...rest} />;
}


