/**
 * RecommendationSection
 * 
 * Displays recommendation cards from recommendation engine.
 * No hardcoded content - purely presentational.
 */

import React from "react";
import { RecommendationItem } from "@/lib/site-schema/siteLayout.types";

interface RecommendationSectionProps {
  title: string;
  items: RecommendationItem[];
  data?: Record<string, any>;
  className?: string;
}

export default function RecommendationSection({
  title,
  items,
  className = "",
}: RecommendationSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`site-section ${className}`}>
      <div className="site-container-inner">
        <h2 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-8)",
          textAlign: "center",
          color: "var(--color-text-primary)",
        }}>
          {title}
        </h2>
        
        <div className="site-grid site-grid-3">
          {items.map((item) => (
            <div key={item.id} className="site-card">
              {item.image && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    aspectRatio: "4 / 3",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="site-card-image"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              <h3 className="site-card-title">{item.title}</h3>
              {item.description && (
                <p className="site-card-description">{item.description}</p>
              )}
              {item.action && (
                <a
                  href={item.action.href}
                  style={{
                    display: "inline-block",
                    marginTop: "var(--spacing-4)",
                    padding: "var(--spacing-3) var(--spacing-6)",
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    textDecoration: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-base)",
                    fontWeight: "var(--font-weight-medium)",
                    transition: "background-color var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                  }}
                >
                  {item.action.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
