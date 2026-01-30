/**
 * HeroSection
 * 
 * Hero section component for prominent page headers.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface HeroSectionProps {
  headline?: string;
  subheadline?: string;
  imageUrl?: string;
  backgroundImage?: string;
  link?: {
    label: string;
    href: string;
  };
  className?: string;
}

export default function HeroSection({
  headline,
  subheadline,
  imageUrl,
  backgroundImage,
  link,
  className = "",
}: HeroSectionProps) {
  return (
    <section
      className={`site-section ${className}`}
      style={{
        position: "relative",
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: backgroundImage ? undefined : "var(--color-bg-secondary)",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Dark gradient overlay for better text readability */}
      {backgroundImage && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))",
          zIndex: 0,
        }} />
      )}
      
      <div className="site-container-inner" style={{
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        width: "100%",
        maxWidth: "800px",
        padding: "var(--spacing-12) var(--spacing-4)",
      }}>
        {headline && (
          <h1 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: "var(--font-weight-bold)",
            lineHeight: "var(--line-height-tight)",
            marginBottom: subheadline ? "var(--spacing-6)" : (link ? "var(--spacing-8)" : 0),
            color: backgroundImage ? "#ffffff" : "var(--color-text-primary)",
            textShadow: backgroundImage ? "0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)" : undefined,
            letterSpacing: "-0.02em",
          }}>
            {headline}
          </h1>
        )}
        {subheadline && (
          <p style={{
            fontSize: "clamp(1.125rem, 2vw, 1.5rem)",
            lineHeight: "var(--line-height-relaxed)",
            color: backgroundImage ? "#ffffff" : "var(--color-text-secondary)",
            textShadow: backgroundImage ? "0 2px 4px rgba(0,0,0,0.5)" : undefined,
            maxWidth: "600px",
            margin: "0 auto",
            marginBottom: link ? "var(--spacing-8)" : 0,
          }}>
            {subheadline}
          </p>
        )}
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "var(--spacing-4) var(--spacing-8)",
              backgroundColor: backgroundImage ? "#ffffff" : "var(--color-primary)",
              color: backgroundImage ? "var(--color-text-primary)" : "#ffffff",
              textDecoration: "none",
              borderRadius: "var(--radius-lg)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-semibold)",
              transition: "all var(--transition-base)",
              boxShadow: "var(--shadow-lg)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-xl)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
            }}
          >
            {link.label}
          </a>
        )}
        {imageUrl && !backgroundImage && (
          <div style={{
            marginTop: "var(--spacing-8)",
          }}>
            <img
              src={imageUrl}
              alt={headline || "Hero image"}
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xl)",
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
