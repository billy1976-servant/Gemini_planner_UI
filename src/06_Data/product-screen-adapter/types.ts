/**
 * Types for the product-screen adapter output.
 * Matches the offline JSON screen schema consumed by JsonRenderer (screen-loader + registry).
 */

/**
 * Minimal node shape for the offline screen tree.
 * Only Registry types: 12 molecules, layout (Row, Column, Grid, Stack, Page), atoms.
 */
export type ScreenTreeNode = {
  id?: string;
  type: string;
  content?: Record<string, unknown>;
  params?: Record<string, unknown>;
  variant?: string;
  size?: string;
  behavior?: unknown;
  state?: unknown;
  when?: { state: string; equals: unknown };
  layout?: { type: string; [key: string]: unknown };
  children?: ScreenTreeNode[];
};

/**
 * Root screen document: what loadScreen() returns and JsonRenderer expects.
 */
export type ScreenTree = {
  id: string;
  type: "screen";
  state: { currentView: string };
  children: ScreenTreeNode[];
};
