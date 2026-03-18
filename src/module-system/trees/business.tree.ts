/**
 * Business Module Master Tree
 * Used by: dentist, contractor, doctor (and any business-facing module).
 * Editable source-of-truth; blueprint.txt is generated FROM this tree.
 */

import type { SectionTree, TreeNode } from "../tree-types";

export const businessTree: SectionTree = [
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
        name: "HeroSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "HeroCard",
            type: "Card",
            slots: ["body", "media"],
            children: [],
          },
          {
            name: "HeroCta",
            type: "Button",
            slots: ["label"],
            target: "ServicesSection",
            children: [],
          },
        ],
      },
      {
        name: "AboutSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "AboutCard",
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
          {
            name: "ServicesList",
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
            name: "ContactName",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "contact.name",
            children: [],
          },
          {
            name: "ContactEmail",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "contact.email",
            children: [],
          },
          {
            name: "ContactMessage",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "contact.message",
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
        name: "BookingSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "BookingPrompt",
            type: "Card",
            slots: ["body"],
            children: [],
          },
          {
            name: "BookingDate",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "booking.date",
            children: [],
          },
          {
            name: "BookingNotes",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "booking.notes",
            children: [],
          },
          {
            name: "BookingSubmit",
            type: "Button",
            slots: ["label"],
            logicAction: "state:booking.submit",
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

export default businessTree;
