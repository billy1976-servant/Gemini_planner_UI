/**
 * Section-type registry: map section.type to renderer and compiler output type.
 * Config-driven; new section types require only config + registry entry.
 */

import React from "react";
import TextSection from "@/components/site/TextSection";
import ImageSection from "@/components/site/ImageSection";
import ListSection from "@/components/site/ListSection";
import ProductGridSection, { ProductCard } from "@/components/site/ProductGridSection";
import type { SectionModel, ProductModel } from "@/lib/site-compiler/compileSiteToScreenModel";
import sectionTypesConfig from "@/config/section-types.json";

export type SectionTypesConfig = {
  types: Record<string, { outputType: string }>;
  productPageTypes?: string[];
  heroTypes?: string[];
  defaultOutputType?: string;
};

const config = sectionTypesConfig as SectionTypesConfig;

/**
 * Resolve compiler output type for a section type. Used by compileSiteToScreenModel.
 */
export function getSectionOutputType(sectionType: string): string {
  const entry = config.types?.[sectionType];
  return entry?.outputType ?? config.defaultOutputType ?? "text";
}

/**
 * Whether this section type should route to product pages (derivePages).
 */
export function isProductPageSectionType(sectionType: string): boolean {
  return (config.productPageTypes ?? []).includes(sectionType);
}

/**
 * Whether this section type is a hero (e.g. for build-site, derivePages).
 */
export function isHeroSectionType(sectionType: string): boolean {
  return (config.heroTypes ?? []).includes(sectionType);
}

/**
 * Whether section type or role is hero (for build-site: s.type === "hero" || s.role === "hero").
 */
export function isHeroSection(section: { type?: string; role?: string }): boolean {
  const t = (section.type ?? "").toLowerCase();
  const r = (section.role ?? "").toLowerCase();
  return isHeroSectionType(t) || r === "hero";
}

type SectionRendererFn = (section: SectionModel, products: ProductModel[]) => React.ReactElement | null;

function renderHeading(section: SectionModel): React.ReactElement {
  return (
    <section className="site-section">
      <div className="site-container-inner">
        <h2
          style={{
            fontSize: "var(--font-size-4xl)",
            fontWeight: "var(--font-weight-bold)",
            lineHeight: "var(--line-height-tight)",
            color: "var(--color-text-primary)",
            marginBottom: "var(--spacing-4)",
          }}
        >
          {typeof section.content === "string" ? section.content : JSON.stringify(section.content)}
        </h2>
      </div>
    </section>
  );
}

function renderText(section: SectionModel): React.ReactElement {
  return <TextSection content={section.content} />;
}

function renderImage(section: SectionModel): React.ReactElement | null {
  const imageUrl =
    typeof section.content === "string"
      ? section.content
      : section.media && section.media.length > 0
        ? section.media[0]
        : "";
  if (!imageUrl) return null;
  return (
    <ImageSection
      imageUrl={imageUrl}
      alt={typeof section.content === "string" ? section.content : ""}
    />
  );
}

function renderList(section: SectionModel): React.ReactElement {
  const listItems = Array.isArray(section.content)
    ? section.content
    : typeof section.content === "string"
      ? section.content.split("\n").filter(Boolean)
      : [];
  return <ListSection items={listItems} />;
}

function renderProductGrid(section: SectionModel, products: ProductModel[]): React.ReactElement | null {
  let productIds: string[] = [];
  if (section.content && typeof section.content === "object" && "productIds" in section.content) {
    productIds = (section.content as { productIds?: string[] }).productIds ?? [];
  } else if (typeof section.content === "string") {
    products.forEach((product) => {
      if (
        section.content.includes(product.id) ||
        (typeof section.content === "string" && section.content.toLowerCase().includes(product.title.toLowerCase()))
      ) {
        productIds.push(product.id);
      }
    });
  }
  const gridProducts: ProductCard[] =
    productIds.length > 0
      ? products
          .filter((p) => productIds.includes(p.id))
          .map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            description: p.description,
            images: p.images,
            tags: p.tags,
          }))
      : products.map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description,
          images: p.images,
          tags: p.tags,
        }));
  if (gridProducts.length === 0) return null;
  return <ProductGridSection products={gridProducts} />;
}

function renderDefault(section: SectionModel, _products: ProductModel[]): React.ReactElement {
  return (
    <TextSection
      content={
        typeof section.content === "string" ? section.content : JSON.stringify(section.content)
      }
    />
  );
}

const sectionRegistry: Record<string, SectionRendererFn> = {
  heading: (section) => renderHeading(section),
  text: (section) => renderText(section),
  image: (section) => renderImage(section),
  list: (section) => renderList(section),
  productGrid: (section, products) => renderProductGrid(section, products),
};

/**
 * Get the render function for a section type. Returns default (text) for unknown types.
 */
export function getSectionRenderer(sectionType: string): SectionRendererFn {
  return sectionRegistry[sectionType] ?? ((section, products) => renderDefault(section, products));
}
