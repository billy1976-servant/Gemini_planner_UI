"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
};

/** Format screen path for pill: "File: journal_track/app-1.json" (readable, no clipping) */
function formatScreenPillLabel(screen: string): string {
  if (!screen.trim()) return "";
  const normalized = screen.replace(/^tsx-screens\/|^tsx:/i, "").trim();
  const hasExt = /\.(tsx|json)$/i.test(normalized);
  const path = hasExt ? normalized : `${normalized}.json`;
  return `File: ${path}`;
}

type CascadingScreenMenuProps = {
  index: ScreensIndex[];
  /** Current screen path from URL (?screen=...) for pill label */
  currentScreen?: string;
};

export default function CascadingScreenMenu({ index, currentScreen = "" }: CascadingScreenMenuProps) {
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

  const pillLabel = currentScreen ? formatScreenPillLabel(currentScreen) : "";
  const triggerText = pillLabel ? `${pillLabel} ▾` : "Screens ▾";

  /* Dropdown panel: solid white, above everything, no debug styles */
  const panelStyle: React.CSSProperties = {
    position: "relative",
    background: "#ffffff",
    color: "#111",
    minWidth: 200,
  };

  return (
    <div
      ref={containerRef}
      className="cascading-screen-menu"
      style={{ position: "relative", zIndex: 60, display: "inline-block", overflow: "visible" }}
    >
      <button
        type="button"
        className="cascading-screen-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          minWidth: pillLabel ? 180 : undefined,
          maxWidth: 320,
          overflow: "visible",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--chrome-text)",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "var(--radius-md)",
          paddingLeft: "var(--spacing-2)",
          paddingRight: "var(--spacing-3)",
        }}
      >
        {triggerText}
      </button>

      {open && index.length > 0 && (
        <div
          className="cascading-screen-menu-panels"
          role="menu"
          style={{
            position: "absolute",
            zIndex: 9999,
            top: "100%",
            left: 0,
            marginTop: 4,
            display: "flex",
            minWidth: 200,
            pointerEvents: "auto",
            background: "#ffffff",
            color: "#111",
            boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
            borderRadius: 10,
          }}
        >
          {/* Level 1: Categories */}
          <div
            className="cascading-screen-menu-panel"
            style={{
              position: "relative",
              background: "#ffffff",
              borderRight: "1px solid #e5e7eb",
              minWidth: 180,
              borderRadius: "10px 0 0 10px",
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
                ...panelStyle,
                borderRight: hoveredFolder && folderObj?.length ? "1px solid #e5e7eb" : undefined,
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
              style={{ ...panelStyle, borderRadius: "0 10px 10px 0" }}
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
