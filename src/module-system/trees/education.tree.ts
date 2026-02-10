/**
 * Education Module Master Tree
 * Used by: school (and any education-facing module).
 * Editable source-of-truth; blueprint.txt is generated FROM this tree.
 */

import type { SectionTree } from "../tree-types";

export const educationTree: SectionTree = [
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
        name: "WelcomeSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "WelcomeCard",
            type: "Card",
            slots: ["body"],
            children: [],
          },
          {
            name: "GetStartedBtn",
            type: "Button",
            slots: ["label"],
            target: "CurriculumSection",
            children: [],
          },
        ],
      },
      {
        name: "CurriculumSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "CurriculumCard",
            type: "Card",
            slots: ["body"],
            children: [],
          },
          {
            name: "ModulesList",
            type: "Card",
            slots: ["body"],
            children: [],
          },
        ],
      },
      {
        name: "ResourcesSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "ResourcesCard",
            type: "Card",
            slots: ["body"],
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
            name: "ContactEmail",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "contact.email",
            children: [],
          },
          {
            name: "ContactSubmit",
            type: "Button",
            slots: ["label"],
            logicAction: "state:contact.submit",
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

export default educationTree;
