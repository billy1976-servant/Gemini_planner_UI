/**
 * ComparisonCard - Render comparison matrix
 * 
 * Features:
 * - Side-by-side comparison table
 * - Expandable sources for each attribute
 * - Strict/loose mode toggle
 * - Top similarities and differences highlighted
 */

"use client";
import React, { useState } from "react";
import type {
  ComparisonMatrix,
  AttributeComparison,
  Source,
} from "@/logic/products/product-types";

type ComparisonCardProps = {
  products: any[]; // Product[] - using any to avoid circular import
  comparison: ComparisonMatrix;
  mode?: "strict" | "loose";
  onToggleSource?: (attributeKey: string) => void;
  maxSimilarities?: number;
  maxDifferences?: number;
};

export function ComparisonCard({
  products,
  comparison,
  mode = "strict",
  onToggleSource,
  maxSimilarities = 5,
  maxDifferences = 10,
}: ComparisonCardProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set()
  );

  const toggleSource = (key: string) => {
    const newSet = new Set(expandedSources);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedSources(newSet);
    onToggleSource?.(key);
  };

  const topSimilarities = comparison.similarities.slice(0, maxSimilarities);
  const topDifferences = comparison.differences.slice(0, maxDifferences);

  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <h2 style={title}>Product Comparison</h2>
        <div style={modeBadge}>
          Mode: {mode === "strict" ? "Strict" : "Loose"}
        </div>
      </div>

      {/* Summary */}
      <div style={summary}>
        <div style={summaryItem}>
          <strong>{comparison.similarities.length}</strong> Similar Attributes
        </div>
        <div style={summaryItem}>
          <strong>{comparison.differences.length}</strong> Different Attributes
        </div>
        <div style={summaryItem}>
          <strong>{comparison.products.length}</strong> Products Compared
        </div>
      </div>

      {/* Top Similarities */}
      {topSimilarities.length > 0 && (
        <section style={section}>
          <h3 style={sectionTitle}>
            Top Similarities ({topSimilarities.length})
          </h3>
          <ComparisonTable
            comparisons={topSimilarities}
            products={products}
            expandedSources={expandedSources}
            onToggleSource={toggleSource}
            highlight="similarity"
          />
        </section>
      )}

      {/* Top Differences */}
      {topDifferences.length > 0 && (
        <section style={section}>
          <h3 style={sectionTitle}>
            Top Differences ({topDifferences.length})
          </h3>
          <ComparisonTable
            comparisons={topDifferences}
            products={products}
            expandedSources={expandedSources}
            onToggleSource={toggleSource}
            highlight="difference"
          />
        </section>
      )}

      {/* Empty State */}
      {topSimilarities.length === 0 && topDifferences.length === 0 && (
        <div style={emptyState}>
          <p>No comparison data available</p>
        </div>
      )}
    </div>
  );
}

type ComparisonTableProps = {
  comparisons: AttributeComparison[];
  products: any[];
  expandedSources: Set<string>;
  onToggleSource: (key: string) => void;
  highlight: "similarity" | "difference";
};

function ComparisonTable({
  comparisons,
  products,
  expandedSources,
  onToggleSource,
  highlight,
}: ComparisonTableProps) {
  return (
    <div style={tableContainer}>
      <table style={table}>
        <thead>
          <tr>
            <th style={tableHeader}>Attribute</th>
            {products.map((product) => (
              <th key={product.id} style={tableHeader}>
                {product.name}
              </th>
            ))}
            <th style={tableHeader}>Sources</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((comp) => (
            <ComparisonRow
              key={comp.attributeKey}
              comparison={comp}
              products={products}
              expandedSources={expandedSources}
              onToggleSource={onToggleSource}
              highlight={highlight}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ComparisonRowProps = {
  comparison: AttributeComparison;
  products: any[];
  expandedSources: Set<string>;
  onToggleSource: (key: string) => void;
  highlight: "similarity" | "difference";
};

function ComparisonRow({
  comparison,
  products,
  expandedSources,
  onToggleSource,
  highlight,
}: ComparisonRowProps) {
  const isExpanded = expandedSources.has(comparison.attributeKey);

  return (
    <>
      <tr
        style={{
          ...tableRow,
          ...(highlight === "similarity" ? rowSimilarity : rowDifference),
        }}
      >
        <td style={tableCell}>
          <div style={attributeName}>
            {comparison.attributeKey.replace(/_/g, " ")}
          </div>
          <div style={attributeGroup}>{comparison.attributeGroup}</div>
        </td>
        {products.map((product) => {
          const value = comparison.values.find(
            (v) => v.productId === product.id
          );
          return (
            <td key={product.id} style={tableCell}>
              {value ? (
                <div style={valueCell}>
                  <span style={valueText}>
                    {formatAttributeValue(value.value.value)}
                    {value.value.unit && ` ${value.value.unit}`}
                  </span>
                  {value.value.rawText &&
                    value.value.rawText !== String(value.value.value) && (
                      <div style={rawText}>{value.value.rawText}</div>
                    )}
                </div>
              ) : (
                <span style={noValue}>—</span>
              )}
            </td>
          );
        })}
        <td style={tableCell}>
          <button
            style={sourceToggleButton}
            onClick={() => onToggleSource(comparison.attributeKey)}
          >
            {isExpanded ? "▼" : "▶"} {comparison.sources.length} source
            {comparison.sources.length !== 1 ? "s" : ""}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={products.length + 2} style={sourceCell}>
            <div style={sourcesContainer}>
              {comparison.sources.map((source, idx) => (
                <SourceDisplay key={idx} source={source} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SourceDisplay({ source }: { source: Source }) {
  return (
    <div style={sourceItem}>
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
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 24,
  width: "100%",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#f1f5f9",
  margin: 0,
};

const modeBadge: React.CSSProperties = {
  padding: "4px 12px",
  background: "#334155",
  borderRadius: 6,
  fontSize: 12,
  color: "#cbd5e1",
  fontWeight: 600,
};

const summary: React.CSSProperties = {
  display: "flex",
  gap: 24,
  marginBottom: 24,
  padding: 16,
  background: "#0f172a",
  borderRadius: 8,
};

const summaryItem: React.CSSProperties = {
  fontSize: 14,
  color: "#cbd5e1",
};

const section: React.CSSProperties = {
  marginBottom: 32,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 12,
};

const tableContainer: React.CSSProperties = {
  overflowX: "auto",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const tableHeader: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  background: "#0f172a",
  color: "#cbd5e1",
  fontWeight: 600,
  borderBottom: "2px solid #334155",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const tableRow: React.CSSProperties = {
  borderBottom: "1px solid #334155",
};

const rowSimilarity: React.CSSProperties = {
  background: "rgba(16, 185, 129, 0.05)",
};

const rowDifference: React.CSSProperties = {
  background: "rgba(239, 68, 68, 0.05)",
};

const tableCell: React.CSSProperties = {
  padding: "12px 16px",
  color: "#e5e7eb",
  verticalAlign: "top",
};

const attributeName: React.CSSProperties = {
  fontWeight: 600,
  color: "#f1f5f9",
  marginBottom: 4,
};

const attributeGroup: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const valueCell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const valueText: React.CSSProperties = {
  fontWeight: 600,
  color: "#e5e7eb",
};

const rawText: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  fontStyle: "italic",
};

const noValue: React.CSSProperties = {
  color: "#64748b",
  fontStyle: "italic",
};

const sourceToggleButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  fontSize: 11,
  cursor: "pointer",
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const sourceCell: React.CSSProperties = {
  padding: 16,
  background: "#0f172a",
  borderTop: "1px solid #334155",
};

const sourcesContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const sourceItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 8,
  background: "#1e293b",
  borderRadius: 6,
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

const emptyState: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
};
