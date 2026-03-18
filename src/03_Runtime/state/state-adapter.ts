import { dispatchState } from "./state-store";


/**
 * Injects state into JSON nodes
 * AND wires two-way field binding
 */
export function applyStateToNode(node: any, state: any): any {
  if (!node) return node;


  let next = node;


  // ✅ TWO-WAY FIELD BINDING
  if (
    node.type === "field" &&
    node.state?.mode === "two-way" &&
    typeof node.state.key === "string"
  ) {
    const rawKey = node.state.key.replace(/^journal\./, "");
    const value = state.journal?.[rawKey] ?? "";


    next = {
      ...node,
      params: {
        ...(node.params ?? {}),
        value,
        onChange: (value: string) =>
          dispatchState("journal.set", { key: rawKey, value }),
      },
    };
  }


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
