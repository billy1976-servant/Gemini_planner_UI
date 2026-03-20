"use client";

import React from "react";

export interface EmptyContentStateProps {
  message: string;
  className?: string;
}

const emptyStateStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "2rem",
  borderRadius: 12,
  border: "1px dashed var(--prayer-card-border, rgba(148,163,184,0.3))",
  background: "var(--prayer-card-bg, rgba(30,41,59,0.5))",
  color: "var(--prayer-text-muted)",
  fontSize: "0.875rem",
  textAlign: "center",
};

export function EmptyContentState({ message, className }: EmptyContentStateProps) {
  return (
    <div className={className} style={emptyStateStyle}>
      {message}
    </div>
  );
}
