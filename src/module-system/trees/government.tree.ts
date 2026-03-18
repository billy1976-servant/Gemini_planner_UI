/**
 * Government Module Master Tree
 * Used by: gov (and any government-facing module).
 * Editable source-of-truth; blueprint.txt is generated FROM this tree.
 */

import type { SectionTree } from "../tree-types";

export const governmentTree: SectionTree = [
  {
    name: "RootSection",
    type: "Section",
    slots: ["title"],
    children: [
      {
        name: "NavStepper",
        type: "Stepper",
        slots: ["steps"],
        children: [],
      },
      {
        name: "OverviewSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "OverviewCard",
            type: "Card",
            slots: ["body"],
            children: [],
          },
        ],
      },
      {
        name: "ServicesSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "ServicesCard",
            type: "Card",
            slots: ["body"],
            children: [],
          },
        ],
      },
      {
        name: "FormsSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "FormPrompt",
            type: "Card",
            slots: ["body"],
            children: [],
          },
          {
            name: "FormField",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "form.data",
            children: [],
          },
          {
            name: "FormSubmit",
            type: "Button",
            slots: ["label"],
            logicAction: "state:form.submit",
            children: [],
          },
        ],
      },
      {
        name: "ContactSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "ContactInfo",
            type: "Card",
            slots: ["body"],
            children: [],
          },
        ],
      },
      {
        name: "FooterBlock",
        type: "Footer",
        slots: ["left", "right"],
        children: [],
      },
    ],
  },
];

export default governmentTree;
