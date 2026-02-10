/**
 * Personal Module Master Tree
 * Used by: personal (journal, habits, goals, etc.).
 * Editable source-of-truth; blueprint.txt is generated FROM this tree.
 */

import type { SectionTree } from "../tree-types";

export const personalTree: SectionTree = [
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
        name: "DashboardSection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "DashboardCard",
            type: "Card",
            slots: ["body"],
            children: [],
          },
        ],
      },
      {
        name: "EntrySection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "EntryPrompt",
            type: "Card",
            slots: ["body"],
            children: [],
          },
          {
            name: "EntryField",
            type: "Field",
            slots: ["label", "input"],
            stateBind: "journal.entry",
            children: [],
          },
          {
            name: "EntrySave",
            type: "Button",
            slots: ["label"],
            logicAction: "state:journal.add",
            children: [],
          },
        ],
      },
      {
        name: "HistorySection",
        type: "Section",
        slots: ["title"],
        children: [
          {
            name: "HistoryCard",
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

export default personalTree;
