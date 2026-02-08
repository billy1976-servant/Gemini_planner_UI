/**
 * ComparisonSection
 * 
 * Displays product comparison results from comparison engine.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface ComparisonSectionProps {
  engineId: string;
  data: {
    products?: Array<{
      id: string;
      name: string;
      price?: number;
      category?: string;
      attributes?: Record<string, any>;
    }>;
    comparisons?: Array<{
      productA: string;
      productB: string;
      dimension: string;
      winner: "A" | "B" | "tie";
      statement: string;
      delta?: {
        value: number;
        unit: string;
        direction: "better" | "worse";
      };
    }>;
    summary?: string;
  };
  className?: string;
}

export default function ComparisonSection({
  engineId,
  data,
  className = "",
}: ComparisonSectionProps) {
  return (
    <section className={`site-section ${className}`}>
      <div className="site-container-inner">
        <h2 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-6)",
          color: "var(--color-text-primary)",
        }}>
          Product Comparison
        </h2>
        
        {data.summary && (
          <p style={{
            fontSize: "var(--font-size-lg)",
            color: "var(--color-text-secondary)",
            marginBottom: "var(--spacing-6)",
          }}>
            {data.summary}
          </p>
        )}
        
        {data.comparisons && data.comparisons.length > 0 ? (
          <div className="site-grid site-grid-2">
            {data.comparisons.map((comparison, index) => (
              <div key={index} className="site-card">
                <h3 style={{
                  fontSize: "var(--font-size-xl)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--spacing-4)",
                }}>
                  {comparison.productA} vs {comparison.productB}
                </h3>
                <p style={{
                  fontSize: "var(--font-size-base)",
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--spacing-4)",
                }}>
                  {comparison.statement}
                </p>
                {comparison.delta && (
                  <div style={{
                    padding: "var(--spacing-3)",
                    backgroundColor: comparison.delta.direction === "better" 
                      ? "var(--color-bg-secondary)" 
                      : "var(--color-bg-muted)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "var(--spacing-4)",
                  }}>
                    <span style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                    }}>
                      {comparison.delta.value} {comparison.delta.unit} {comparison.delta.direction}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : data.products && data.products.length >= 2 ? (
          <div className="site-grid site-grid-2">
            {data.products.slice(0, 2).map((product) => (
              <div key={product.id} className="site-card">
                <h3 style={{
                  fontSize: "var(--font-size-xl)",
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--spacing-2)",
                }}>
                  {product.name}
                </h3>
                {product.price !== undefined && (
                  <div style={{
                    fontSize: "var(--font-size-lg)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--color-primary)",
                    marginTop: "var(--spacing-2)",
                  }}>
                    ${product.price.toFixed(2)}
                  </div>
                )}
                {product.category && (
                  <span style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    marginTop: "var(--spacing-2)",
                    display: "block",
                  }}>
                    {product.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-secondary)",
          }}>
            No comparison data available
          </p>
        )}
      </div>
    </section>
  );
}
