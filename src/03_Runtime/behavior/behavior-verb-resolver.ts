// src/behavior/behavior-verb-resolver.ts
import actions from "./behavior-actions-6x7.json";


export function resolveBehaviorVerb(
  domain: keyof typeof actions,   // image | video | audio | document | canvas | map | camera
  verb: string                     // crop | filter | layout | motion | overlay | frame
) {
  const entry = actions?.[domain]?.[verb];


  if (!entry || entry.enabled !== true) {
    return null;
  }


  return {
    handler: entry.handler,
    params: entry.params ?? [],
  };
}


