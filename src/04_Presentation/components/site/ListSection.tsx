/**
 * ListSection
 * 
 * Renders ONLY list items - no wrappers, no layout styles.
 * Layout is controlled by the outer wrapper in renderFromSchema.tsx
 */

import React from "react";

interface ListSectionProps {
  items: string[] | any[];
  title?: string;
  className?: string;
}

export default function ListSection({
  items,
  title,
  className = "",
}: ListSectionProps) {
  // Normalize items to strings
  const listItems = Array.isArray(items)
    ? items.map(item => typeof item === "string" ? item : JSON.stringify(item))
    : [];

  // Use grid for longer lists, bullet list for shorter
  // Note: Grid layout is applied by outer wrapper, this just determines structure
  const useGrid = listItems.length > 6;

  return (
    <>
      {title && (
        <h2 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-6)",
          color: "var(--color-text-primary)",
        }}>
          {title}
        </h2>
      )}
      {useGrid ? (
        // Grid items - outer wrapper applies grid layout
        <>
          {listItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "var(--spacing-4)",
                backgroundColor: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-primary)",
              }}
            >
              {item}
            </div>
          ))}
        </>
      ) : (
        // Bullet list
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}>
          {listItems.map((item, index) => (
            <li
              key={index}
              style={{
                padding: "var(--spacing-3) 0",
                position: "relative",
                fontSize: "var(--font-size-base)",
                lineHeight: "var(--line-height-relaxed)",
                color: "var(--color-text-primary)",
              }}
            >
              <span style={{
                position: "absolute",
                left: 0,
                top: "var(--spacing-4)",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary)",
              }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
