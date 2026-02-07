/**
 * ProductCard - Render product grid/list
 * 
 * Features:
 * - Image, name, price, key 3 attributes
 * - "View product" link
 * - "Show source" expanders under each attribute/spec
 * - Brand-neutral and factual
 */

"use client";
import React, { useState } from "react";
import type { Product, Source } from "@/logic/products/product-types";

type ProductCardProps = {
  products: Product[];
  onSelect?: (productId: string) => void;
  selectedProductIds?: string[];
  showSources?: boolean;
  maxAttributes?: number; // Number of key attributes to show (default: 3)
};

export function ProductCard({
  products,
  onSelect,
  selectedProductIds = [],
  showSources = true,
  maxAttributes = 3,
}: ProductCardProps) {
  if (products.length === 0) {
    return (
      <div style={emptyState}>
        <p>No products to display</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={grid}>
        {products.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            isSelected={selectedProductIds.includes(product.id)}
            onSelect={onSelect ? () => onSelect(product.id) : undefined}
            showSources={showSources}
            maxAttributes={maxAttributes}
          />
        ))}
      </div>
    </div>
  );
}

type ProductItemProps = {
  product: Product;
  isSelected: boolean;
  onSelect?: () => void;
  showSources: boolean;
  maxAttributes: number;
};

function ProductItem({
  product,
  isSelected,
  onSelect,
  showSources,
  maxAttributes,
}: ProductItemProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Get top attributes by importance (core > secondary > cosmetic)
  const sortedAttributes = Object.entries(product.attributes)
    .sort(([, a], [, b]) => {
      const importanceOrder = { core: 0, secondary: 1, cosmetic: 2 };
      return (
        importanceOrder[a.importanceClass] - importanceOrder[b.importanceClass]
      );
    })
    .slice(0, maxAttributes);

  const toggleSource = (key: string) => {
    const newSet = new Set(expandedSources);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedSources(newSet);
  };

  return (
    <div
      style={{
        ...card,
        ...(isSelected ? cardSelected : {}),
        ...(onSelect ? cardClickable : {}),
      }}
      onClick={onSelect}
    >
      {/* Image */}
      {product.images.length > 0 && (
        <div style={imageContainer}>
          <img
            src={product.images[0].url}
            alt={product.images[0].alt}
            style={image}
            onError={(e) => {
              // Fallback to gradient if image fails
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {product.images.length > 1 && (
            <div style={imageCountBadge}>+{product.images.length - 1}</div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={content}>
        {/* Brand */}
        <div style={brand}>{product.brand}</div>

        {/* Name */}
        <h3 style={name}>{product.name}</h3>

        {/* Price */}
        <div style={price}>
          {product.price.currency} {product.price.amount.toLocaleString()}
          {product.price.min !== undefined && product.price.max !== undefined && (
            <span style={priceRange}>
              {" "}
              - {product.price.currency} {product.price.max.toLocaleString()}
            </span>
          )}
        </div>

        {/* Key Attributes */}
        {sortedAttributes.length > 0 && (
          <div style={attributesContainer}>
            {sortedAttributes.map(([key, attrValue]) => (
              <div key={key} style={attributeItem}>
                <div style={attributeRow}>
                  <span style={attributeKey}>{key.replace(/_/g, " ")}:</span>
                  <span style={attributeValue}>
                    {formatAttributeValue(attrValue.value)}
                    {attrValue.unit && ` ${attrValue.unit}`}
                  </span>
                </div>
                {showSources && (
                  <div style={sourceToggle}>
                    <button
                      style={sourceButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSource(key);
                      }}
                    >
                      {expandedSources.has(key) ? "▼" : "▶"} Source
                    </button>
                    {expandedSources.has(key) && (
                      <div style={sourcePanel}>
                        <SourceDisplay source={attrValue.source} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View Product Link */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={viewLink}
          onClick={(e) => e.stopPropagation()}
        >
          View product →
        </a>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div style={selectedBadge}>
          <span style={selectedCheckmark}>✓</span>
        </div>
      )}
    </div>
  );
}

function SourceDisplay({ source }: { source: Source }) {
  return (
    <div style={sourceContent}>
      <div style={sourceLabel}>{source.label}</div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={sourceLink}
      >
        {source.url}
      </a>
      {source.snippet && (
        <div style={sourceSnippet}>"{source.snippet}"</div>
      )}
    </div>
  );
}

function formatAttributeValue(
  value: string | number | boolean | string[]
): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

// Styles
const container: React.CSSProperties = {
  width: "100%",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 20,
};

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  overflow: "hidden",
  position: "relative",
  transition: "all 0.2s ease",
};

const cardClickable: React.CSSProperties = {
  cursor: "pointer",
};

const cardSelected: React.CSSProperties = {
  borderColor: "#3b82f6",
  borderWidth: 2,
  boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
};

const imageContainer: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: 200,
  background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const image: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const imageCountBadge: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "rgba(0, 0, 0, 0.7)",
  color: "#e5e7eb",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
};

const content: React.CSSProperties = {
  padding: 16,
};

const brand: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 4,
};

const name: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#f1f5f9",
  margin: "0 0 8px 0",
  lineHeight: 1.4,
};

const price: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#10b981",
  marginBottom: 16,
};

const priceRange: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: "#94a3b8",
};

const attributesContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 16,
};

const attributeItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const attributeRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
};

const attributeKey: React.CSSProperties = {
  color: "#94a3b8",
  fontWeight: 500,
};

const attributeValue: React.CSSProperties = {
  color: "#e5e7eb",
  fontWeight: 600,
};

const sourceToggle: React.CSSProperties = {
  marginTop: 4,
};

const sourceButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  fontSize: 11,
  cursor: "pointer",
  padding: "2px 4px",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const sourcePanel: React.CSSProperties = {
  marginTop: 8,
  padding: 8,
  background: "#0f172a",
  borderRadius: 6,
  border: "1px solid #1e293b",
};

const sourceContent: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 11,
};

const sourceLabel: React.CSSProperties = {
  color: "#cbd5e1",
  fontWeight: 600,
};

const sourceLink: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  wordBreak: "break-all",
};

const sourceSnippet: React.CSSProperties = {
  color: "#94a3b8",
  fontStyle: "italic",
  marginTop: 4,
};

const viewLink: React.CSSProperties = {
  display: "inline-block",
  color: "#60a5fa",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
  marginTop: 8,
};

const selectedBadge: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "#3b82f6",
  color: "#ffffff",
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
};

const selectedCheckmark: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const emptyState: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
};
