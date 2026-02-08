/**
 * Apply Variants To Products
 * 
 * Attaches detected variant patterns to individual products
 */

export function applyVariantsToProducts(products: any[], variantPatterns: Record<string, string[]>) {
  return products.map(product => {
    const variants: Record<string, string> = {};

    for (const variantKey in variantPatterns) {
      for (const productKey in product) {
        if (productKey.toLowerCase().includes(variantKey)) {
          variants[variantKey] = product[productKey];
        }
      }
    }

    return {
      ...product,
      variants
    };
  });
}
