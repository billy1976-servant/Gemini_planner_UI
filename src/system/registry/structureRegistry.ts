import type { StructureType } from "./templateRegistry";


export type StructureTypeDefinition = {
  name: StructureType;
  description?: string;
  tags?: string[];
};


const structureTypes = new Map<string, StructureTypeDefinition>();


export function registerStructureType(def: StructureTypeDefinition) {
  if (!def?.name) throw new Error("registerStructureType: missing name");
  if (structureTypes.has(def.name)) {
    const msg = `Duplicate structureType registration: "${def.name}"`;
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    return;
  }
  structureTypes.set(def.name, Object.freeze({ ...def }));
}


export function getStructureTypes(): StructureTypeDefinition[] {
  return Array.from(structureTypes.values());
}


export function getStructureType(name: string): StructureTypeDefinition | undefined {
  return structureTypes.get(name);
}
