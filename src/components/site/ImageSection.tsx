/**
 * ImageSection
 * 
 * Image display section component.
 * No hardcoded content - purely presentational.
 * Layout is controlled by the outer wrapper in renderFromSchema.tsx
 */

import React from "react";

interface ImageSectionProps {
  imageUrl: string | string[];
  alt?: string;
  caption?: string;
  className?: string;
}

export default function ImageSection({
  imageUrl,
  alt = "",
  caption,
  className = "",
}: ImageSectionProps) {
  const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const isGallery = images.length > 1;

  return (
    <div className={className}>
      {isGallery ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "var(--spacing-6)",
        }}>
          {images.map((img, index) => (
            <div 
              key={index} 
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <img
                src={img}
                alt={alt || `Image ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}>
          <img
            src={images[0]}
            alt={alt}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              display: "block",
            }}
          />
          {caption && (
            <p style={{
              marginTop: "var(--spacing-4)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
