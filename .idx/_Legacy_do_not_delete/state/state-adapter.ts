// src/state/state-adapter.ts
/**
 * STATE → JSON ADAPTER (PURE)
 *
 * Injects derived state into JSON in a way
 * that EXISTING compounds + atoms already support.
 *
 * No hooks. No side effects.
 */




import { dispatchState } from "@/state/state-store";




export function applyStateToNode(node: any, state: any): any {
  if (!node || !state) return node;




  let next = node;




  /* ======================================================
     🔑 TWO-WAY FIELD BINDING (FINAL)
     ====================================================== */
  if (
    node.type === "field" &&
    node.state?.mode === "two-way" &&
    typeof node.state.key === "string"
  ) {
    // normalize "journal.|thinkjournal" → "thinkjournal"
    const rawKey = node.state.key.replace(/^journal\.\|?/, "");




    const value = state.journal?.[rawKey] ?? "";




    next = {
      ...node,
      params: {
        ...(node.params ?? {}),
        value,
        onChange: (value: string) => {
          dispatchState("journal.set", {
            key: rawKey,
            value,
          });
        },
      },
    };
  }




  /* ======================================================
     🔁 RECURSE CHILDREN (UNCHANGED)
     ====================================================== */
  if (Array.isArray(node.children)) {
    next = {
      ...next,
      children: node.children.map(child =>
        applyStateToNode(child, state)
      ),
    };
  }




  return next;
}