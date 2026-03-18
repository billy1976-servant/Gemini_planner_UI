import type { NormalizedProduct } from "@/lib/site-compiler/normalizeSiteData";

/**
 * Deterministic mapping: NormalizedProduct → Card molecule node JSON.
 * No selection/filtering decisions belong here; engines decide which products to pass in.
 */
export function productToCardNode(product: NormalizedProduct) {
  const media = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined;
  const body =
    (typeof product.description === "string" && product.description.trim().length > 0
      ? product.description
      : product.brand || product.category) ?? undefined;

  return {
    id: `product:${product.id}`,
    type: "Card",
    content: {
      ...(media ? { media } : {}),
      title: product.name,
      ...(body ? { body } : {}),
    },
  };
}

export function productsToCardNodes(products: NormalizedProduct[]) {
  return (Array.isArray(products) ? products : []).map(productToCardNode);
}

/**
 * Deterministic mapping: NormalizedProduct → Chip molecule nodes for tags (brand/category).
 * Note: Chips are interactive by contract, but we intentionally omit behavior here.
 */
export function productToChipNodes(product: NormalizedProduct) {
  const tags = [product.brand, product.category].filter((x): x is string => typeof x === "string" && x.length > 0);
  return tags.map((t) => ({
    id: `product:${product.id}:chip:${t}`,
    type: "Chip",
    content: { title: t },
  }));
}

export function productsToChipNodes(products: NormalizedProduct[]) {
  return (Array.isArray(products) ? products : []).flatMap(productToChipNodes);
}

