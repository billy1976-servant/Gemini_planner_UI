"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDevMobileMode } from "@/app/dev/useDevMobileMode";

type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
};

/** Format screen path for pill: "File: journal_track/app-1.json" or "File: wrappers/GlobalAppSkin-test.tsx" (readable, no clipping) */
function formatScreenPillLabel(screen: string): string {
  if (!screen.trim()) return "";
  const isTsx = /^tsx:/i.test(screen);
  const normalized = screen.replace(/^tsx-screens\/|^tsx:/i, "").trim();
  const hasExt = /\.(tsx|json)$/i.test(normalized);
  const ext = isTsx ? ".tsx" : ".json";
  const path = hasExt ? normalized : `${normalized}${ext}`;
  return `File: ${path}`;
}

/** JSON-first: PROJECT (JSON apps) first, TSX/System last. */
function groupCategories(index: ScreensIndex[]): { section: string; categories: ScreensIndex[] }[] {
  const project = index.filter((c) => !c.category.toLowerCase().startsWith("tsx"));
  const tsx = index.filter((c) => c.category.toLowerCase().startsWith("tsx"));
  const groups: { section: string; categories: ScreensIndex[] }[] = [];
  if (project.length) groups.push({ section: "PROJECT", categories: project });
  if (tsx.length) groups.push({ section: "TSX / System", categories: tsx });
  return groups;
}

function firstJsonCategory(index: ScreensIndex[]): string | null {
  const first = index.find((c) => !c.category.toLowerCase().startsWith("tsx"));
  return first?.category ?? index[0]?.category ?? null;
}

const SECTION_HEADER_STYLE: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: 11,
  letterSpacing: "0.08em",
  opacity: 0.6,
  padding: "8px 16px",
  marginTop: 8,
  marginBottom: 4,
};

const PARENT_ROW_STYLE: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 16,
  background: "#0f172a08",
  padding: "14px 16px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  color: "#000",
  gap: 8,
};

const SUBFOLDER_ROW_STYLE: React.CSSProperties = {
  paddingLeft: 28,
  paddingRight: 16,
  paddingTop: 14,
  paddingBottom: 14,
  fontWeight: 400,
  fontSize: 14,
  opacity: 0.85,
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  color: "#000",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
};

type CascadingScreenMenuProps = {
  index: ScreensIndex[];
  /** Current screen path from URL (?screen=...) for pill label */
  currentScreen?: string;
};

export default function CascadingScreenMenu({ index, currentScreen = "" }: CascadingScreenMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const devMobileMode = useDevMobileMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  const base = pathname?.startsWith("/dev") ? "/dev" : "/";

  const closeMenu = () => {
    setOpen(false);
    setHoveredCategory(null);
    setHoveredFolder(null);
  };

  const navigate = (category: string, folder: string, file?: string) => {
    if (file === undefined) {
      const screenPath = `${category}/${folder}`;
      router.replace(`${base}?screen=${encodeURIComponent(screenPath)}`);
    } else {
      const screenPath = `${category}/${folder}/${file}`;
      router.replace(`${base}?screen=${encodeURIComponent(screenPath)}`);
    }
    closeMenu();
  };

  useEffect(() => {
    if (open && index.length > 0 && !hoveredCategory) {
      setHoveredCategory(firstJsonCategory(index) ?? index[0].category);
    }
    if (!open) {
      setHoveredCategory(null);
      setHoveredFolder(null);
    }
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeMenu();
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
            flexDirection: "column",
            minWidth: 200,
            pointerEvents: "auto",
            background: "#ffffff",
            color: "#111",
            boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
            borderRadius: 10,
          }}
        >
          {/* Breadcrumb header (mobile clarity) */}
          <div
            className="cascading-screen-menu-breadcrumb"
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>HIClarify Navigator</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Current: {hoveredCategory ?? "…"}
              {hoveredFolder ? ` → ${hoveredFolder}` : ""}
            </div>
          </div>

          <div className="cascading-screen-menu-panels-inner" style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Level 1: Categories with section headers */}
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
            {groupCategories(index).map(({ section, categories }) => (
              <div key={section}>
                <div style={SECTION_HEADER_STYLE}>{section}</div>
                <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 4 }} />
                {categories.map((cat) => {
                  const hasChildren = hasLevel2(cat);
                  return (
                    <div
                      key={cat.category}
                      role="menuitem"
                      className="cascading-screen-menu-item"
                      style={{
                        ...PARENT_ROW_STYLE,
                        backgroundColor: hoveredCategory === cat.category ? "#e2e8f0" : "#0f172a08",
                      }}
                      onMouseEnter={() => {
                        setHoveredCategory(cat.category);
                        setHoveredFolder(null);
                      }}
                    >
                      <span>{cat.category}</span>
                      {hasChildren && <span aria-hidden style={{ fontSize: 14, opacity: 0.7 }}>›</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Level 2: Files & subfolders (subfolder style) */}
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
                  style={{ ...SUBFOLDER_ROW_STYLE, backgroundColor: "#ffffff" }}
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
                      ...SUBFOLDER_ROW_STYLE,
                      backgroundColor: hoveredFolder === folderName ? "#f1f5f9" : "#ffffff",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={() => setHoveredFolder(folderName)}
                  >
                    <span>{folderName}</span>
                    {hasChildren && <span aria-hidden style={{ fontSize: 14, opacity: 0.7 }}>›</span>}
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
                  style={{ ...SUBFOLDER_ROW_STYLE, backgroundColor: "#ffffff" }}
                  onClick={() => navigate(hoveredCategory!, hoveredFolder, fileName)}
                >
                  {fileName}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
