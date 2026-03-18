/**
 * PageContainer
 * 
 * Wrapper component for page content with consistent spacing and max-width.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  containerStyles?: React.CSSProperties;
}

export default function PageContainer({ 
  children, 
  className = "",
  containerStyles = {}
}: PageContainerProps) {
  return (
    <div className={`site-container ${className}`} style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-bg-primary)",
      width: "100%",
      ...containerStyles, // Apply experience-based container styles
    }}>
      {children}
    </div>
  );
}
