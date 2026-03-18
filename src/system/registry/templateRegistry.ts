export type StructureType =
  | "list"
  | "board"
  | "dashboard"
  | "editor"
  | "timeline"
  | "detail"
  | "wizard"
  | "gallery";


export type TemplateDefinition = {
  name: string;
  structureType: StructureType;
  requiredStateKeys?: string[];
  supportedEngines?: string[];
  description?: string;
  tags?: string[];
  file?: string; // optional: auto-filled by callers
};


const templates = new Map<string, TemplateDefinition>();


export function registerTemplate(def: TemplateDefinition) {
  if (!def?.name) throw new Error("registerTemplate: missing name");
  if (templates.has(def.name)) {
    const msg = `Duplicate template registration: "${def.name}"`;
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    return;
  }
  templates.set(def.name, Object.freeze({ ...def }));
}


export function getTemplates(): TemplateDefinition[] {
  return Array.from(templates.values());
}


export function getTemplate(name: string): TemplateDefinition | undefined {
  return templates.get(name);
}
