/**
 * Map Variant Images
 * 
 * Maps product images to specific variants based on image URLs
 * and variant values
 */

export function mapVariantImages(product: any) {
  if (!product.images || !product.variants) return product;

  const variantImageMap: Record<string, string[]> = {};

  for (const variantType in product.variants) {
    const value = product.variants[variantType];
    const matchingImages = product.images.filter((img: string) =>
      img.toLowerCase().includes(value.toLowerCase().replace(/\s+/g, "-"))
    );

    if (matchingImages.length) {
      variantImageMap[variantType] = matchingImages;
    }
  }

  return {
    ...product,
    variantImages: variantImageMap
  };
}
