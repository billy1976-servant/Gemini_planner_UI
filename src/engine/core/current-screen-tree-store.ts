/**
 * Current screen tree (composed node) for "Save Current Layout as Template".
 * Page sets it after compose; layout Save button reads it.
 */
let currentTree: unknown = null;
const listeners = new Set<() => void>();

export function getCurrentScreenTree(): unknown {
  return currentTree;
}

export function setCurrentScreenTree(tree: unknown): void {
  currentTree = tree;
  listeners.forEach((l) => l());
}

export function subscribeCurrentScreenTree(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
