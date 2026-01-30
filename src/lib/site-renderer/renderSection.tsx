/**
 * renderSection
 * 
 * Maps section.type to visual component.
 * Pure function - no side effects, no hardcoded content.
 */

import React from "react";
import HeroSection from "@/components/site/HeroSection";
import TextSection from "@/components/site/TextSection";
import ImageSection from "@/components/site/ImageSection";
import ListSection from "@/components/site/ListSection";
import ProductGridSection, { ProductCard } from "@/components/site/ProductGridSection";
import { SectionModel } from "@/lib/site-compiler/compileSiteToScreenModel";
import { ProductModel } from "@/lib/site-compiler/compileSiteToScreenModel";

interface RenderSectionProps {
  section: SectionModel;
  products?: ProductModel[];
}

export default function renderSection({ section, products = [] }: RenderSectionProps): React.ReactElement | null {
  switch (section.type) {
    case "heading":
      return (
        <section className="site-section">
          <div className="site-container-inner">
            <h2 style={{
              fontSize: "var(--font-size-4xl)",
              fontWeight: "var(--font-weight-bold)",
              lineHeight: "var(--line-height-tight)",
              color: "var(--color-text-primary)",
              marginBottom: "var(--spacing-4)",
            }}>
              {typeof section.content === "string" ? section.content : JSON.stringify(section.content)}
            </h2>
          </div>
        </section>
      );

    case "text":
      return (
        <TextSection
          content={section.content}
        />
      );

    case "image":
      const imageUrl = typeof section.content === "string" 
        ? section.content 
        : (section.media && section.media.length > 0 ? section.media[0] : "");
      
      if (!imageUrl) {
        return null;
      }
      
      return (
        <ImageSection
          imageUrl={imageUrl}
          alt={typeof section.content === "string" ? section.content : ""}
        />
      );

    case "list":
      const listItems = Array.isArray(section.content)
        ? section.content
        : (typeof section.content === "string" 
          ? section.content.split("\n").filter(Boolean)
          : []);
      
      return (
        <ListSection
          items={listItems}
        />
      );

    case "productGrid":
      // Extract product IDs from content
      let productIds: string[] = [];
      if (section.content && typeof section.content === "object" && "productIds" in section.content) {
        productIds = (section.content as any).productIds || [];
      } else if (typeof section.content === "string") {
        // Try to extract product IDs from string content
        products.forEach(product => {
          if (section.content.includes(product.id) || section.content.toLowerCase().includes(product.title.toLowerCase())) {
            productIds.push(product.id);
          }
        });
      }
      
      // If no specific products, show all products
      const gridProducts: ProductCard[] = productIds.length > 0
        ? products
            .filter(p => productIds.includes(p.id))
            .map(p => ({
              id: p.id,
              title: p.title,
              price: p.price,
              description: p.description,
              images: p.images,
              tags: p.tags,
            }))
        : products.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            description: p.description,
            images: p.images,
            tags: p.tags,
          }));
      
      if (gridProducts.length === 0) {
        return null;
      }
      
      return (
        <ProductGridSection
          products={gridProducts}
        />
      );

    default:
      // Fallback to text for unknown types
      return (
        <TextSection
          content={typeof section.content === "string" 
            ? section.content 
            : JSON.stringify(section.content)}
        />
      );
  }
}
