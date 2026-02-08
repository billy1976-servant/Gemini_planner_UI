/**
 * ProductGridSection
 * 
 * Renders ONLY product cards - no wrappers, no layout styles.
 * Layout is controlled by the outer wrapper in renderFromSchema.tsx
 */

"use client";

import React from "react";
import { selectBestImageSimple } from "@/lib/media/bestImage";

export interface ProductCard {
  id: string;
  title: string;
  price?: number;
  description?: string;
  images?: string[];
  tags?: string[];
  url?: string;
  variants?: Record<string, string>; // Detected variant values (e.g., { finish: "Cherry Sunburst" })
  variantImages?: Record<string, string[]>; // Images mapped to specific variants
}

interface ProductGridSectionProps {
  products: ProductCard[];
  title?: string;
  className?: string;
  experience?: "website" | "app" | "learning";
}

export default function ProductGridSection({
  products,
  title,
  className = "",
  experience,
}: ProductGridSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <>
      {title && (
        <h2 style={{
          fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-8)",
          textAlign: "center",
          color: "var(--color-text-primary)",
        }}>
          {title}
        </h2>
      )}
      {products.map((product, index) => {
        // Select best image using helper
        const bestImage = selectBestImageSimple(product.images, 900);
        
        // Debug logging (dev only) - log first 10 product image URLs
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && index < 10) {
          console.log(`[ProductImage ${index}]`, {
            productId: product.id,
            productTitle: product.title,
            originalImages: product.images?.slice(0, 3),
            selectedImage: bestImage,
          });
        }
        
        return (
          <div key={product.id} className="product-card">
            {bestImage && (
              <div 
                className="product-image-frame"
                style={{
                  position: "relative",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <img
                  src={bestImage}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          <h3 className="product-title" style={{
            fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
            fontWeight: "var(--font-weight-semibold)",
            marginTop: "var(--spacing-4)",
            marginBottom: "var(--spacing-2)",
            color: "var(--color-text-primary)",
          }}>
            {product.title}
          </h3>
          {product.description && (
            <p className="product-description">
              {product.description}
            </p>
          )}
          {product.price !== undefined && product.price !== null && (
            <div className="product-price">
              ${product.price.toFixed(2)}
            </div>
          )}
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="product-button"
              style={{ display: "block", width: "100%", textAlign: "center" }}
            >
              View Product
            </a>
          )}
          </div>
        );
      })}
    </>
  );
}
