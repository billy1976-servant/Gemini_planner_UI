import { registerStructureType } from "./structureRegistry";


export function registerBuiltinStructureTypes() {
  registerStructureType({ name: "list", description: "Linear collection / feed layout" });
  registerStructureType({ name: "board", description: "Kanban / columns + cards layout" });
  registerStructureType({ name: "dashboard", description: "Panels + metrics layout" });
  registerStructureType({ name: "editor", description: "Editable document / form builder layout" });
  registerStructureType({ name: "timeline", description: "Time-axis / scheduling layout" });
  registerStructureType({ name: "detail", description: "Single item detail layout" });
  registerStructureType({ name: "wizard", description: "Step-based flow layout" });
  registerStructureType({ name: "gallery", description: "Media grid / gallery layout" });
}
