/**
 * Atom definitions adapter — blocks-only authority for atom definition lookup.
 *
 * Sources: src/blocks/atoms.manifest.json and src/blocks/atom-definitions/*.json.
 * No fallback to components folder.
 *
 * Use getAtomDefinition(atomId) wherever atom definition content is needed.
 * Does not replace registry.tsx, json-renderer, or compound runtime.
 */

import { getBlockAtomDefs } from "./blocks-registry";
import collectionDef from "./atom-definitions/collection.json";
import conditionDef from "./atom-definitions/condition.json";
import fieldDef from "./atom-definitions/field.json";
import mediaDef from "./atom-definitions/media.json";
import sequenceDef from "./atom-definitions/sequence.json";
import shellDef from "./atom-definitions/shell.json";
import surfaceDef from "./atom-definitions/surface.json";
import textDef from "./atom-definitions/text.json";
import triggerDef from "./atom-definitions/trigger.json";

export type AtomDefinition = Record<string, unknown>;

const BLOCKS_DEFINITIONS: Record<string, AtomDefinition> = {
  collection: collectionDef as AtomDefinition,
  condition: conditionDef as AtomDefinition,
  field: fieldDef as AtomDefinition,
  media: mediaDef as AtomDefinition,
  sequence: sequenceDef as AtomDefinition,
  shell: shellDef as AtomDefinition,
  surface: surfaceDef as AtomDefinition,
  text: textDef as AtomDefinition,
  trigger: triggerDef as AtomDefinition,
};

/**
 * Returns the definition object for an atom by id.
 * Reads only from blocks: atoms.manifest.json first, then atom-definitions/*.json.
 */
export function getAtomDefinition(atomId: string): AtomDefinition | undefined {
  const manifest = getBlockAtomDefs();
  const fromManifest = manifest[atomId as keyof typeof manifest];
  if (fromManifest !== undefined) {
    return fromManifest as AtomDefinition;
  }
  return BLOCKS_DEFINITIONS[atomId];
}
