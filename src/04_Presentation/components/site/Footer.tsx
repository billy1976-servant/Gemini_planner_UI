/**
 * Footer
 * 
 * Footer component - minimal, data-driven.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface FooterProps {
  siteId?: string;
  className?: string;
}

export default function Footer({ siteId, className = "" }: FooterProps) {
  return (
    <footer style={{
      borderTop: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-secondary)",
      paddingTop: "var(--spacing-8)",
      paddingBottom: "var(--spacing-8)",
      marginTop: "var(--spacing-16)",
    }} className={className}>
      <div className="site-container-inner">
        <div style={{
          textAlign: "center",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
        }}>
          {siteId && (
            <p style={{ margin: 0 }}>
              Generated from {siteId}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
