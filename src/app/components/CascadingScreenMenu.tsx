"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDevMobileMode } from "@/app/dev/useDevMobileMode";

export type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
  rootSection: string;
  displayName: string;
};

/** Known TSX paths (no tsx: prefix) so pill shows .tsx even if URL was restored without prefix */
function isKnownTsxPath(normalized: string): boolean {
  const n = normalized.replace(/\\/g, "/").trim();
  return /^\(live\)\s+Business\//i.test(n) || /^Container_Creations\/ContainerCreationsWebsite$/i.test(n);
}

/** Format screen path for pill (readable, no clipping) */
function formatScreenPillLabel(screen: string): string {
  if (!screen.trim()) return "";
  const normalized = screen.replace(/^tsx-screens\/|^tsx:/i, "").trim();
  const hasExt = /\.(tsx|json)$/i.test(normalized);
  const useTsxExt = /^tsx:/i.test(screen) || isKnownTsxPath(normalized);
  const ext = useTsxExt ? ".tsx" : ".json";
  const path = hasExt ? normalized : `${normalized}${ext}`;
  return `File: ${path}`;
}

<<<<<<< HEAD
/** Root folder color: (dead) = red, (live) = green; only for 01_App roots with (dead)/(live) in name. */
function rootFolderColor(rootName: string): string | undefined {
  if (rootName.includes("(dead)")) return "#b91c1c";
  if (rootName.includes("(live)")) return "#15803d";
  return undefined;
}

/** Group categories strictly by item.rootSection (no PROJECT/TSX, no renaming) */
function groupByRootSection(index: ScreensIndex[]): Map<string, ScreensIndex[]> {
  const map = new Map<string, ScreensIndex[]>();
  for (const item of index) {
    const root = item.rootSection ?? item.displayName ?? "";
    if (!root) continue;
    if (!map.has(root)) map.set(root, []);
    map.get(root)!.push(item);
  }
  return map;
}

const ROOT_ROW_STYLE: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  padding: "10px 16px",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  color: "#000",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  background: "#f8fafc",
=======
/** Group categories into TSX SYSTEM (tsx*) vs PROJECT */
function groupCategories(index: ScreensIndex[]): { section: string; categories: ScreensIndex[] }[] {
  const tsx = index.filter((c) => c.category.toLowerCase().startsWith("tsx"));
  const project = index.filter((c) => !c.category.toLowerCase().startsWith("tsx"));
  const groups: { section: string; categories: ScreensIndex[] }[] = [];
  if (tsx.length) groups.push({ section: "TSX SYSTEM", categories: tsx });
  if (project.length) groups.push({ section: "PROJECT", categories: project });
  return groups;
}

const SECTION_HEADER_STYLE: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: 11,
  letterSpacing: "0.08em",
  opacity: 0.6,
  padding: "8px 16px",
  marginTop: 8,
  marginBottom: 4,
>>>>>>> c529cf0 (Clean version)
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
  currentScreen?: string;
};

export default function CascadingScreenMenu({ index, currentScreen = "" }: CascadingScreenMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const devMobileMode = useDevMobileMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [hoveredRootSection, setHoveredRootSection] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  const base = pathname?.startsWith("/dev") ? "/dev" : "/";

<<<<<<< HEAD
  /** Accordion: only one root expanded at a time; expanding one collapses the others. */
  const toggleRoot = (name: string) => {
    setExpandedRoots((prev) => {
      if (prev.has(name)) return new Set<string>();
      return new Set([name]);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setHoveredRootSection(null);
    setHoveredCategory(null);
    setHoveredFolder(null);
=======
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
>>>>>>> c529cf0 (Clean version)
  };

  /** Build path and navigate; (dead) Tsx and (live)* use tsx: prefix so loader resolves TSX. */
  const navigate = (rootSection: string, category: string, folder: string, file?: string) => {
    const useTsx =
      rootSection === "(dead) Tsx" || rootSection.includes("(live)");
    const prefix = useTsx
      ? rootSection.includes("(live)")
        ? `tsx:${rootSection}/`
        : "tsx:"
      : "";
    const screenPath =
      file === undefined
        ? `${prefix}${category}/${folder}`
        : `${prefix}${category}/${folder}/${file}`;
    router.replace(`${base}?screen=${encodeURIComponent(screenPath)}`);
    closeMenu();
  };

  useEffect(() => {
    if (!open) {
      setHoveredRootSection(null);
      setHoveredCategory(null);
      setHoveredFolder(null);
    }
  }, [open]);

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

  const categoryObj =
    hoveredRootSection && hoveredCategory
      ? index.find(
          (x) => x.rootSection === hoveredRootSection && x.category === hoveredCategory
        )
      : null;
  const directFiles = categoryObj?.directFiles ?? [];
  const subfolderNames = Object.keys(categoryObj?.folders ?? {});
  const folderObj = hoveredFolder && categoryObj ? categoryObj.folders[hoveredFolder] : null;

  const hasLevel2 = (cat: ScreensIndex) =>
    (cat.directFiles?.length ?? 0) > 0 || Object.keys(cat.folders ?? {}).length > 0;

  const byRoot = groupByRootSection(index);
  const rootNames = Array.from(byRoot.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const pillLabel = currentScreen ? formatScreenPillLabel(currentScreen) : "";
  const triggerText = pillLabel ? `${pillLabel} ▾` : "Screens ▾";

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
<<<<<<< HEAD
=======
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
>>>>>>> c529cf0 (Clean version)
          <div
            className="cascading-screen-menu-breadcrumb"
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
              flexShrink: 0,
            }}
          >
<<<<<<< HEAD
            <div style={{ fontSize: 12, color: "#64748b" }}>HIClarify Navigator</div>
            {hoveredRootSection && hoveredCategory && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {hoveredRootSection} → {hoveredCategory}
                {hoveredFolder ? ` → ${hoveredFolder}` : ""}
              </div>
            )}
          </div>

          <div
            className="cascading-screen-menu-panels-inner"
            style={{ display: "flex", flex: 1, minHeight: 0 }}
          >
            {/* Column 1: Root sections only — accordion, expand inline in same column */}
=======
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
>>>>>>> c529cf0 (Clean version)
            <div
              className="cascading-screen-menu-panel"
              style={{
                position: "relative",
                background: "#ffffff",
                borderRight: "1px solid #e5e7eb",
                minWidth: 220,
                borderRadius: "10px 0 0 10px",
              }}
            >
<<<<<<< HEAD
              {rootNames.map((rootName) => {
                const categories = byRoot.get(rootName) ?? [];
                const isExpanded = expandedRoots.has(rootName);
                return (
                  <div key={rootName}>
                    <button
                      type="button"
                      role="treeitem"
                      aria-expanded={isExpanded}
                      style={{
                        ...ROOT_ROW_STYLE,
                        width: "100%",
                        border: "none",
                        textAlign: "left",
                      }}
                      onClick={() => toggleRoot(rootName)}
                    >
                      <span aria-hidden style={{ fontSize: 12 }}>
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <span style={{ color: rootFolderColor(rootName) ?? ROOT_ROW_STYLE.color }}>
                        {rootName}
                      </span>
                    </button>
                    {isExpanded &&
                      categories.map((cat) => {
                        const hasChildren = hasLevel2(cat);
                        const isSelected =
                          hoveredRootSection === rootName && hoveredCategory === cat.category;
                        return (
                          <div
                            key={cat.category}
                            role="menuitem"
                            className="cascading-screen-menu-item"
                            style={{
                              ...PARENT_ROW_STYLE,
                              paddingLeft: 28,
                              backgroundColor: isSelected ? "#e2e8f0" : "#0f172a08",
                            }}
                            onMouseEnter={() => {
                              setHoveredRootSection(rootName);
                              setHoveredCategory(cat.category);
                              setHoveredFolder(null);
                            }}
                          >
                            <span>{cat.category}</span>
                            {hasChildren && (
                              <span aria-hidden style={{ fontSize: 14, opacity: 0.7 }}>
                                ›
                              </span>
                            )}
                          </div>
                        );
                      })}
=======
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
>>>>>>> c529cf0 (Clean version)
                  </div>
                );
              })}
            </div>

<<<<<<< HEAD
            {/* Column 2: Files & subfolders for selected category */}
            {categoryObj && hoveredRootSection && (
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
                    onClick={() => navigate(hoveredRootSection, hoveredCategory!, fileName)}
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
                      {hasChildren && (
                        <span aria-hidden style={{ fontSize: 14, opacity: 0.7 }}>
                          ›
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Column 3: Files in selected folder */}
            {hoveredFolder && folderObj && folderObj.length > 0 && hoveredRootSection && (
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
                    onClick={() =>
                      navigate(hoveredRootSection, hoveredCategory!, hoveredFolder, fileName)
                    }
                  >
                    {fileName}
                  </div>
                ))}
              </div>
            )}
=======
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
>>>>>>> c529cf0 (Clean version)
          </div>
        </div>
      )}
    </div>
  );
}
