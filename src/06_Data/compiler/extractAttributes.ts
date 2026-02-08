/**
 * Extract Attributes
 * 
 * Extracts all attributes from raw products into a structured format.
 * Generic and keyword-driven - works across any industry.
 */

export interface ExtractedAttributes {
  [key: string]: string | number | boolean | string[] | null;
}

/**
 * Extract attributes from a product
 * Looks for common attribute patterns in product data
 */
export function extractAttributes(product: any): ExtractedAttributes {
  const attributes: ExtractedAttributes = {};

  // Extract from top-level fields
  for (const key in product) {
    const value = product[key];
    
    // Skip internal/metadata fields
    if (key === 'id' || key === 'url' || key === 'href' || key === 'images' || 
        key === 'price' || key === 'name' || key === 'title' || key === 'description' ||
        key === 'category' || key === 'brand' || key === 'sourceUrl' || key === 'alt') {
      continue;
    }

    // Extract meaningful attributes
    if (value !== null && value !== undefined) {
      if (typeof value === 'string' && value.trim().length > 0) {
        attributes[key] = value.trim();
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        attributes[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        attributes[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested objects with dot notation
        for (const nestedKey in value) {
          const nestedValue = value[nestedKey];
          if (nestedValue !== null && nestedValue !== undefined) {
            attributes[`${key}.${nestedKey}`] = nestedValue;
          }
        }
      }
    }
  }

  // Extract from specifications if present
  if (product.specifications && typeof product.specifications === 'object') {
    for (const specKey in product.specifications) {
      attributes[specKey] = product.specifications[specKey];
    }
  }

  // Extract from attributes field if present
  if (product.attributes && typeof product.attributes === 'object') {
    for (const attrKey in product.attributes) {
      attributes[attrKey] = product.attributes[attrKey];
    }
  }

  return attributes;
}

/**
 * Extract attributes from multiple products
 */
export function extractAttributesFromProducts(products: any[]): Array<{ product: any; attributes: ExtractedAttributes }> {
  return products.map(product => ({
    product,
    attributes: extractAttributes(product)
  }));
}
