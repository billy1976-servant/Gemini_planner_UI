/**
 * WebsiteBlockRenderer
 *
 * Bridge component: renders a single website block (product grid, hero, etc.)
 * using normalized site data. Used by onboarding to reuse website UI.
 * Fetches /api/sites/[domain]/normalized and delegates to existing site components.
 */

"use client";

import React, { useEffect, useState } from "react";
import HeroSection from "@/components/site/HeroSection";
import TextSection from "@/components/site/TextSection";
import ProductGridSection, { ProductCard } from "@/components/site/ProductGridSection";
import ListSection from "@/components/site/ListSection";
import { NormalizedSite, NormalizedProduct } from "@/lib/site-compiler/normalizeSiteData";
import "@/styles/site-theme.css";

export type WebsiteBlockType = "productCard" | "productCompare" | "featureList" | "hero";

interface WebsiteBlockRendererProps {
  domain: string;
  blockType: WebsiteBlockType;
  productIds?: string[];
  sectionId?: string;
  /** Optional override for hero (headline, subheadline, imageUrl) */
  headline?: string;
  subheadline?: string;
  imageUrl?: string;
  /** Optional override for featureList */
  items?: string[];
  /** Optional title for productCard / featureList */
  title?: string;
}

function toProductCard(p: NormalizedProduct): ProductCard {
  return {
    id: p.id,
    title: p.name,
    price: p.price?.amount,
    description: p.description,
    images: p.images ?? [],
    url: p.url,
    variants: p.variants,
    variantImages: p.variantImages,
    tags: [
      ...(p.category ? [p.category] : []),
      ...(p.brand ? [p.brand] : []),
      ...(p.attributes ? (Object.values(p.attributes).filter((v) => typeof v === "string") as string[]) : []),
    ],
  };
}

export default function WebsiteBlockRenderer({
  domain,
  blockType,
  productIds,
  sectionId,
  headline,
  subheadline,
  imageUrl,
  items,
  title,
}: WebsiteBlockRendererProps) {
  const [site, setSite] = useState<NormalizedSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      setLoading(false);
      setError("domain is required");
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/sites/${domain}/normalized`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || d.message || "Failed to load")));
        return res.json();
      })
      .then((data) => {
        setSite(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load site");
        setLoading(false);
      });
  }, [domain]);

  if (loading) {
    return (
      <div className="site-theme" style={{ padding: "var(--spacing-6)", color: "var(--color-text-secondary)" }}>
        Loading…
      </div>
    );
  }
  if (error || !site) {
    return (
      <div className="site-theme" style={{ padding: "var(--spacing-6)", color: "var(--color-text-muted)" }}>
        {error ?? "No site data"}
      </div>
    );
  }

  const products = site.products ?? [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const filtered =
    productIds && productIds.length > 0
      ? productIds.map((id) => byId.get(id)).filter(Boolean) as NormalizedProduct[]
      : products;
  const productCards = filtered.map(toProductCard);

  let content: React.ReactNode = null;

  switch (blockType) {
    case "hero":
      content = (
        <HeroSection
          headline={headline}
          subheadline={subheadline}
          imageUrl={imageUrl}
        />
      );
      break;
    case "productCard":
    case "productCompare":
      if (productCards.length === 0) {
        content = (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            No products to display.
          </p>
        );
      } else {
        content = (
          <ProductGridSection
            products={productCards}
            title={title}
            experience="website"
          />
        );
      }
      break;
    case "featureList":
      const listItems = items && items.length > 0 ? items : [];
      content = <ListSection items={listItems} title={title} />;
      if (listItems.length === 0 && !title) {
        content = (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            No list items.
          </p>
        );
      }
      break;
    default:
      content = (
        <p style={{ color: "var(--color-text-muted)" }}>
          Unknown block type: {blockType}
        </p>
      );
  }

  return <div className="site-theme">{content}</div>;
}
