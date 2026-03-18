/**
 * Central app icon wrapper — Lucide icons only.
 * Standardizes size, stroke, color. No pastel fills, no emoji.
 * Use for header, sidebar, and chrome only.
 */

"use client";

import React from "react";
import {
  Home,
  FolderOpen,
  FileJson,
  Settings,
  LayoutTemplate,
  LayoutGrid,
  BarChart3,
  Users,
  Search,
  Database,
  Shield,
  Zap,
  Globe,
  Palette,
  Sparkles,
  Briefcase,
  Maximize2,
  Code2,
  List,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Folder: FolderOpen,
  File: FileJson,
  Settings,
  Layout: LayoutTemplate,
  LayoutGrid,
  BarChart: BarChart3,
  Users,
  Search,
  Database,
  Shield,
  Zap,
  Globe,
  Palette,
  LayoutTemplate,
  Sparkles,
  Briefcase,
  Maximize2,
  Code2,
  List,
};

export type AppIconName = keyof typeof ICON_MAP;

const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 1.6;

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  /** For chrome/header: use chrome text color and hover */
  chrome?: boolean;
};

export default function AppIcon({
  name,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE,
  color,
  className,
  style,
  chrome = false,
}: AppIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;

  const resolvedColor = color ?? (chrome ? "var(--chrome-text)" : "currentColor");

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: resolvedColor,
        ...style,
      }}
      data-app-icon
    >
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        color={resolvedColor}
        style={{ flexShrink: 0 }}
        aria-hidden
      />
    </span>
  );
}

/** Panel id → Lucide icon name for sidebar/control dock (no fallback; each tool has one icon) */
export const DOCK_ICON_NAMES: Record<string, AppIconName> = {
  experience: "Globe",
  mode: "Settings",
  palette: "Palette",
  layout: "LayoutTemplate",
  styling: "Sparkles",
  behavior: "Zap",
  template: "LayoutGrid",
  newInterface: "Briefcase", // business blueprint/compiler flow
  tsx: "Code2",
  nodes: "List",
  expand: "Maximize2",
};

export function getAppIconNameForPanel(panelId: string): AppIconName | undefined {
  return DOCK_ICON_NAMES[panelId];
}
