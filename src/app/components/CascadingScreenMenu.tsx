"use client";

import { useState, useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    setHoveredCategory(null);
    setHoveredFolder(null);
  };

  useEffect(() => {
    if (open && index.length > 0 && !hoveredCategory) {
      setHoveredCategory(index[0].category);
    }
    if (!open) {
      setHoveredCategory(null);
      setHoveredFolder(null);
    }
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHoveredCategory(null);
        setHoveredFolder(null);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHoveredCategory(null);
        setHoveredFolder(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClickOutside, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClickOutside, true);
    };
  }, [open]);

  const categoryObj = hoveredCategory ? index.find(x => x.category === hoveredCategory) : null;
  const directFiles = categoryObj?.directFiles ?? [];
  const subfolderNames = Object.keys(categoryObj?.folders ?? {});
  const folderObj = hoveredFolder && categoryObj ? categoryObj.folders[hoveredFolder] : null;

  const hasLevel2 = (cat: ScreensIndex) =>
    (cat.directFiles?.length ?? 0) > 0 || Object.keys(cat.folders ?? {}).length > 0;

  const dropdownPanelStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#000000",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
    position: "absolute",
  };

  const dropdownContentStyle: React.CSSProperties = {
    ...dropdownPanelStyle,
    pointerEvents: "auto",
  };

  return (
    <div
      ref={containerRef}
      className="cascading-screen-menu"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        className="cascading-screen-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Screens ▾
      </button>

      {open && index.length > 0 && (
        <div
          className="cascading-screen-menu-panels"
          role="menu"
          style={{
            ...dropdownContentStyle,
            top: "100%",
            left: 0,
            marginTop: 0,
            borderRadius: "var(--radius-md)",
            display: "flex",
            minWidth: 200,
          }}
        >
          {/* Level 1: Categories */}
          <div
            className="cascading-screen-menu-panel"
            style={{
              ...dropdownPanelStyle,
              position: "relative",
              borderRight: "1px solid #e5e7eb",
              minWidth: 180,
              borderRadius: 0,
              boxShadow: "none",
            }}
          >
            {index.map((cat) => {
              const hasChildren = hasLevel2(cat);
              return (
                <div
                  key={cat.category}
                  role="menuitem"
                  className="cascading-screen-menu-item"
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    color: "#000000",
                    backgroundColor: hoveredCategory === cat.category ? "#f3f4f6" : "#ffffff",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "var(--spacing-2)",
                  }}
                  onMouseEnter={() => {
                    setHoveredCategory(cat.category);
                    setHoveredFolder(null);
                  }}
                >
                  <span>{cat.category}</span>
                  {hasChildren && <span aria-hidden>▸</span>}
                </div>
              );
            })}
          </div>

          {/* Level 2: Files & folders */}
          {categoryObj && (
            <div
              className="cascading-screen-menu-panel"
              style={{
                ...dropdownPanelStyle,
                position: "relative",
                borderRight: hoveredFolder && folderObj?.length ? "1px solid #e5e7eb" : undefined,
                minWidth: 200,
                borderRadius: 0,
                boxShadow: "none",
              }}
            >
              {directFiles.map((fileName) => (
                <div
                  key={fileName}
                  role="menuitem"
                  className="cascading-screen-menu-item"
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    color: "#000000",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                  onClick={() => navigate(hoveredCategory!, fileName)}
                  onMouseEnter={() => setHoveredFolder(null)}
                >
                  {fileName}
                </div>
              ))}
              {subfolderNames.map((folderName) => {
                const files = categoryObj.folders?.[folderName] ?? [];
                const hasChildren = files.length > 0;
                return (
                  <div
                    key={folderName}
                    role="menuitem"
                    className="cascading-screen-menu-item"
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      cursor: "pointer",
                      color: "#000000",
                      backgroundColor: hoveredFolder === folderName ? "#f3f4f6" : "#ffffff",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--spacing-2)",
                    }}
                    onMouseEnter={() => setHoveredFolder(folderName)}
                  >
                    <span>{folderName}</span>
                    {hasChildren && <span aria-hidden>▸</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Level 3: Files in folder */}
          {hoveredFolder && folderObj && folderObj.length > 0 && (
            <div
              className="cascading-screen-menu-panel"
              style={{
                ...dropdownPanelStyle,
                position: "relative",
                minWidth: 200,
                borderRadius: 0,
                boxShadow: "none",
              }}
            >
              {folderObj.map((fileName) => (
                <div
                  key={fileName}
                  role="menuitem"
                  className="cascading-screen-menu-item"
                  style={{
                    padding: "var(--spacing-2) var(--spacing-3)",
                    cursor: "pointer",
                    color: "#000000",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                  onClick={() => navigate(hoveredCategory!, hoveredFolder, fileName)}
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
