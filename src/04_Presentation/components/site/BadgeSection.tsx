/**
 * BadgeSection
 * 
 * Displays badge indicators.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface BadgeSectionProps {
  label: string;
  variant?: "success" | "warning" | "info" | "error";
  data?: Record<string, any>;
  className?: string;
}

export default function BadgeSection({
  label,
  variant = "info",
  className = "",
}: BadgeSectionProps) {
  const variantColors = {
    success: {
      bg: "#10b981",
      text: "#ffffff",
    },
    warning: {
      bg: "#f59e0b",
      text: "#ffffff",
    },
    info: {
      bg: "#3b82f6",
      text: "#ffffff",
    },
    error: {
      bg: "#ef4444",
      text: "#ffffff",
    },
  };

  const colors = variantColors[variant];

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        padding: "var(--spacing-2) var(--spacing-4)",
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: "var(--radius-full)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--font-weight-medium)",
        margin: "var(--spacing-2)",
      }}
    >
      {label}
    </div>
  );
}
