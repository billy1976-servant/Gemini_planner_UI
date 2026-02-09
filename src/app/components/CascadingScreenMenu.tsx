"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
};

type CascadingScreenMenuProps = {
  index: ScreensIndex[];
};

export default function CascadingScreenMenu({ index }: CascadingScreenMenuProps) {
  const router = useRouter();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  const navigate = (category: string, folder: string, file?: string) => {
    if (file === undefined) {
      const screenPath = `${category}/${folder}`;
      router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
    } else {
      const screenPath = `${category}/${folder}/${file}`;
      router.replace(`/?screen=${encodeURIComponent(screenPath)}`);
    }
    // Close menu after navigation
    setHoveredCategory(null);
    setHoveredFolder(null);
  };

  const categoryObj = hoveredCategory ? index.find(x => x.category === hoveredCategory) : null;
  const directFiles = categoryObj?.directFiles ?? [];
  const subfolderNames = Object.keys(categoryObj?.folders ?? {});
  const folderObj = hoveredFolder && categoryObj ? categoryObj.folders[hoveredFolder] : null;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
      onMouseLeave={() => {
        setHoveredCategory(null);
        setHoveredFolder(null);
      }}
    >
      <button
        type="button"
        style={{
          padding: "var(--spacing-2) var(--spacing-3)",
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          fontSize: "inherit",
          color: "var(--color-text-primary)",
        }}
        onMouseEnter={() => {
          if (index.length > 0) {
            setHoveredCategory(index[0].category);
          }
        }}
      >
        Screens ▸
      </button>

      {hoveredCategory && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "var(--spacing-1)",
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            zIndex: 1000,
            display: "flex",
            minWidth: 200,
          }}
        >
          {/* Categories Column */}
          <div
            style={{
              borderRight: "1px solid var(--color-border)",
              minWidth: 150,
            }}
          >
            {index.map((cat) => (
              <div
                key={cat.category}
                style={{
                  padding: "var(--spacing-2) var(--spacing-3)",
                  cursor: "pointer",
                  backgroundColor: hoveredCategory === cat.category ? "var(--color-bg-secondary)" : "transparent",
                  borderBottom: "1px solid var(--color-border)",
                }}
                onMouseEnter={() => {
                  setHoveredCategory(cat.category);
                  setHoveredFolder(null);
                }}
              >
                {cat.category}
              </div>
            ))}
          </div>

          {/* Folders/Files Column */}
          {categoryObj && (
            <div
              style={{
                minWidth: 200,
              }}
            >
              {/* Direct files */}
              {directFiles.map((fileName) => (
                <div
                  key={fileName}
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                  onClick={() => navigate(hoveredCategory, fileName)}
                  onMouseEnter={() => setHoveredFolder(null)}
                >
                  {fileName}
                </div>
              ))}

              {/* Folders */}
              {subfolderNames.map((folderName) => (
                <div
                  key={folderName}
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    backgroundColor: hoveredFolder === folderName ? "var(--color-bg-secondary)" : "transparent",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onMouseEnter={() => setHoveredFolder(folderName)}
                >
                  <span>{folderName}</span>
                  <span>▸</span>
                </div>
              ))}
            </div>
          )}

          {/* Files Column */}
          {hoveredFolder && folderObj && (
            <div
              style={{
                borderLeft: "1px solid var(--color-border)",
                minWidth: 200,
              }}
            >
              {folderObj.map((fileName) => (
                <div
                  key={fileName}
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                  onClick={() => navigate(hoveredCategory, hoveredFolder, fileName)}
                >
                  {fileName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
