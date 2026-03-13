"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  return /^Business\//i.test(n) || /^Christian\//i.test(n) || /^Container_Creations\/ContainerCreationsWebsite$/i.test(n);
}

/** Full path for accessibility/title (e.g. "File: (dead) Tsx/Gibson Guitars/blueprint.tsx") */
function formatScreenPillLabel(screen: string): string {
  if (!screen.trim()) return "";
  const normalized = screen.replace(/^tsx-screens\/|^tsx:/i, "").trim();
  const hasExt = /\.(tsx|json)$/i.test(normalized);
  const useTsxExt = /^tsx:/i.test(screen) || isKnownTsxPath(normalized);
  const ext = useTsxExt ? ".tsx" : ".json";
  const path = hasExt ? normalized : `${normalized}${ext}`;
  return `File: ${path}`;
}

/** Last path segment only for compact pill display (e.g. "blueprint.tsx") */
function getScreenPillDisplayName(screen: string): string {
  if (!screen.trim()) return "";
  const normalized = screen.replace(/^tsx-screens\/|^tsx:/i, "").trim();
  const hasExt = /\.(tsx|json)$/i.test(normalized);
  const useTsxExt = /^tsx:/i.test(screen) || isKnownTsxPath(normalized);
  const ext = useTsxExt ? ".tsx" : ".json";
  const path = hasExt ? normalized : `${normalized}${ext}`;
  const segments = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1]! : path;
}

/** Root folder color: (dead) = red, (live) / domain = green; only for 01_App roots. */
function rootFolderColor(rootName: string): string | undefined {
  if (rootName.includes("(dead)")) return "#b91c1c";
  if (rootName.includes("(live)")) return "#15803d";
  if (["Business", "Christian", "Plan", "Protect", "Research", "Learn"].includes(rootName)) return "#15803d";
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
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const safeIndex = Array.isArray(index) ? index : [];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [hoveredRootSection, setHoveredRootSection] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPanelPosition({ top: rect.bottom + 4, left: rect.left });
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const base = pathname?.startsWith("/dev") ? "/dev" : "/";

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
  };

  /** Build path and navigate; (dead) Tsx and (live)* use tsx: prefix so loader resolves TSX. */
  const navigate = (rootSection: string, category: string, folder: string, file?: string) => {
    const useTsx =
      rootSection === "(dead) Tsx" ||
      rootSection.includes("(live)") ||
      rootSection === "Business" ||
      rootSection === "Christian" ||
      rootSection === "tsx-organisms" ||
      rootSection === "tsx-organs";
    const prefix = useTsx
      ? rootSection.includes("(live)") || rootSection === "Business" || rootSection === "Christian" || rootSection === "tsx-organisms" || rootSection === "tsx-organs"
        ? `tsx:${rootSection}/`
        : "tsx:"
      : "";
    const screenPath =
      file === undefined
        ? `${prefix}${category}/${folder}`
        : `${prefix}${category}/${folder}/${file}`;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("screen", screenPath);
    router.replace(`${base}?${params.toString()}`);
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
    if (typeof navigator !== "undefined") setIsOffline(!navigator.onLine);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) closeMenu();
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
      ? safeIndex.find(
          (x) => x.rootSection === hoveredRootSection && x.category === hoveredCategory
        )
      : null;
  const directFiles = categoryObj?.directFiles ?? [];
  const subfolderNames = Object.keys(categoryObj?.folders ?? {});
  const folderObj = hoveredFolder && categoryObj ? categoryObj.folders[hoveredFolder] : null;

  const hasLevel2 = (cat: ScreensIndex) =>
    (cat.directFiles?.length ?? 0) > 0 || Object.keys(cat.folders ?? {}).length > 0;

  const byRoot = groupByRootSection(safeIndex);
  const rootNames = Array.from(byRoot.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const pillDisplayName = currentScreen ? getScreenPillDisplayName(currentScreen) : "";
  const pillFullPathTitle = currentScreen ? formatScreenPillLabel(currentScreen) : "";
  const triggerText = pillDisplayName ? `${pillDisplayName} ▾` : "Screens ▾";

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
        ref={triggerRef}
        type="button"
        className="cascading-screen-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={pillFullPathTitle || "Select screen"}
        style={{
          minWidth: pillDisplayName ? 120 : undefined,
          maxWidth: 320,
          overflow: "visible",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--chrome-text, #1f2937)",
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: "var(--radius-md)",
          paddingLeft: "var(--spacing-2)",
          paddingRight: "var(--spacing-3)",
        }}
      >
        {triggerText}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={(el) => { panelRef.current = el; }}
            className="cascading-screen-menu-panels"
            role="menu"
            style={{
              position: "fixed",
              zIndex: 10001,
              top: panelPosition.top,
              left: panelPosition.left,
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
          <div
            className="cascading-screen-menu-breadcrumb"
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
              flexShrink: 0,
              minHeight: 36,
            }}
          >
            {hoveredRootSection && hoveredCategory && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {hoveredRootSection} → {hoveredCategory}
                {hoveredFolder ? ` → ${hoveredFolder}` : ""}
              </div>
            )}
          </div>

          {safeIndex.length === 0 ? (
            <div style={{ padding: "16px 20px", fontSize: 14, color: "#64748b" }}>
              {isOffline ? "Offline — screens unavailable" : "Loading screens…"}
            </div>
          ) : (
          <div
            className="cascading-screen-menu-panels-inner"
            style={{ display: "flex", flex: 1, minHeight: 0 }}
          >
            {/* Column 1: Root sections only — accordion, expand inline in same column */}
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
                  </div>
                );
              })}
            </div>

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
          </div>
          )}
        </div>,
          document.body
        )}
    </div>
  );
}
