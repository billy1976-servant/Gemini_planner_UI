export type EngineDefinition = {
  name: string;
  integratesWith?: string[]; // stateKey(s)
  description?: string;
  tags?: string[];
  file?: string; // optional: auto-filled by callers
};


const engines = new Map<string, EngineDefinition>();


export function registerEngine(def: EngineDefinition) {
  if (!def?.name) throw new Error("registerEngine: missing name");
  if (engines.has(def.name)) {
    const msg = `Duplicate engine registration: "${def.name}"`;
    if (process.env.NODE_ENV !== "production") throw new Error(msg);
    return;
  }
  engines.set(def.name, Object.freeze({ ...def }));
}


export function getEngines(): EngineDefinition[] {
  return Array.from(engines.values());
}


export function getEngine(name: string): EngineDefinition | undefined {
  return engines.get(name);
}
