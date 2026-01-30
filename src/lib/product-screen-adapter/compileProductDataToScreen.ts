/**
 * Product-to-Screen Compiler Adapter
 *
 * Converts compiled product data (product.graph.json or NormalizedProduct[]) into
 * a single JSON document in the offline screen schema so it can be loaded via
 * /api/screens and rendered by JsonRenderer without adding new UI types.
 */

import type { NormalizedProduct } from "@/lib/site-compiler/normalizeSiteData";
import { normalizeProducts } from "@/lib/site-compiler/normalizeSiteData";
import { productsToCardNodes } from "@/lib/site-skin/mappers/productToMoleculeNodes";
import type { ScreenTree, ScreenTreeNode } from "./types";

/** Raw product graph shape (product.graph.json). */
type RawProductGraph = { products?: unknown[] };

/** Input: raw graph or normalized products array. */
export type ProductScreenInput =
  | RawProductGraph
  | NormalizedProduct[];

export type ProductScreenOptions = {
  sectionTitle?: string;
  currentView?: string;
  layout?: "grid" | "column" | "row";
  maxProducts?: number;
};

function isRawProductGraph(
  input: ProductScreenInput
): input is RawProductGraph {
  return (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    "products" in input &&
    Array.isArray((input as RawProductGraph).products)
  );
}

function ensureChildren(node: ScreenTreeNode): ScreenTreeNode {
  if (node.children === undefined) {
    return { ...node, children: [] };
  }
  return {
    ...node,
    children: node.children.map(ensureChildren),
  };
}

/**
 * Compile product data into a full screen JSON document for the offline Molecule renderer.
 * Uses only Registry types (Section, Grid/Column/Row, Card); no new UI types.
 */
export function compileProductDataToScreen(
  input: ProductScreenInput,
  options: ProductScreenOptions = {}
): ScreenTree {
  const normalized: NormalizedProduct[] = isRawProductGraph(input)
    ? normalizeProducts(input as RawProductGraph)
    : (input as NormalizedProduct[]);

  const maxProducts = options.maxProducts ?? normalized.length;
  const products = normalized.slice(0, maxProducts);

  const cardNodes: ScreenTreeNode[] = productsToCardNodes(products).map(
    (n) => ensureChildren({ ...n, children: [] })
  );

  const layoutType =
    options.layout === "column"
      ? "Column"
      : options.layout === "row"
        ? "Row"
        : "Grid";

  const layoutParams: Record<string, unknown> =
    layoutType === "Grid"
      ? { columns: 3, gap: "1rem" }
      : layoutType === "Row"
        ? { gap: "1rem", wrap: true }
        : { gap: "1rem" };

  const layoutNode: ScreenTreeNode = ensureChildren({
    id: "products_layout",
    type: layoutType,
    params: layoutParams,
    children: cardNodes,
  });

  const sectionTitle = options.sectionTitle ?? "Products";
  const sectionNode: ScreenTreeNode = ensureChildren({
    id: "products_section",
    type: "Section",
    content: { title: sectionTitle },
    children: [layoutNode],
  });

  const currentView = options.currentView ?? "|products";

  const root: ScreenTree = {
    id: "screenRoot",
    type: "screen",
    state: { currentView },
    children: [sectionNode],
  };

  return root;
}
