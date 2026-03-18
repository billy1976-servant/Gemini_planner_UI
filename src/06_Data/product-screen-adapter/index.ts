/**
 * Product-to-Screen Compiler Adapter
 *
 * Converts compiled product data into the offline JSON screen format
 * so it renders through the Molecule renderer without new UI types.
 */

export { compileProductDataToScreen } from "./compileProductDataToScreen";
export type {
  ProductScreenInput,
  ProductScreenOptions,
} from "./compileProductDataToScreen";
export type { ScreenTree, ScreenTreeNode } from "./types";
