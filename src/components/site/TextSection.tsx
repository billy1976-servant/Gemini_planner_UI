/**
 * TextSection
 * 
 * Text content section component.
 * No hardcoded content - purely presentational.
 * Layout is controlled by the outer wrapper in renderFromSchema.tsx
 */

import React from "react";

interface TextSectionProps {
  content: string | any;
  title?: string;
  className?: string;
}

export default function TextSection({
  content,
  title,
  className = "",
}: TextSectionProps) {
  // Handle different content types
  const textContent = typeof content === "string" 
    ? content 
    : (content?.originalContent || JSON.stringify(content));

  return (
    <div className={className}>
      {title && (
        <h2 style={{
          fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-6)",
          color: "var(--color-text-primary)",
          lineHeight: "var(--line-height-tight)",
        }}>
          {title}
        </h2>
      )}
      <div style={{
        fontSize: "var(--font-size-lg)",
        lineHeight: "var(--line-height-relaxed)",
        color: "var(--color-text-primary)",
      }}>
        {textContent.split("\n").map((paragraph: string, index: number) => {
          if (!paragraph.trim()) return null;
          
          // Detect headings (lines that are short and don't end with punctuation)
          const isHeading = paragraph.trim().length < 100 && 
                            !paragraph.trim().endsWith(".") && 
                            !paragraph.trim().endsWith("!") &&
                            !paragraph.trim().endsWith("?");
          
          if (isHeading) {
            return (
              <h3 key={index} style={{
                fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                fontWeight: "var(--font-weight-semibold)",
                marginTop: index > 0 ? "var(--spacing-6)" : 0,
                marginBottom: "var(--spacing-4)",
                color: "var(--color-text-primary)",
                lineHeight: "var(--line-height-tight)",
              }}>
                {paragraph.trim()}
              </h3>
            );
          }
          
          return (
            <p key={index} style={{
              marginBottom: "var(--spacing-6)",
              fontSize: "var(--font-size-lg)",
              lineHeight: "var(--line-height-relaxed)",
            }}>
              {paragraph.trim()}
            </p>
          );
        })}
      </div>
    </div>
  );
}
