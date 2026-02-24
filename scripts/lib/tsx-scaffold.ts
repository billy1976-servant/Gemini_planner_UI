/**
 * TSX scaffold — writes ScreenName.tsx, Wrapper.tsx, content.ts, index.ts.
 * Screen renders through wrapper only; no inline layout JSX.
 */

import fs from "node:fs";
import path from "node:path";

export type ScaffoldOptions = {
  targetDir: string;
  screenName: string;
  wrapperTemplateId: string;
};

function toPascal(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function scaffoldTsxScreen(opts: ScaffoldOptions): void {
  const { targetDir, screenName, wrapperTemplateId } = opts;
  const PascalName = toPascal(screenName.replace(/-/g, " "));

  const wrapperTsx = `"use client";

/**
 * Wrapper — renders via registry-selected template. No inline layout.
 */
import React from "react";
import { WebsiteTemplate } from "@/04_Presentation/components/organs/tsx/website/WebsiteTemplate";

export default function Wrapper({
  config,
  content,
}: {
  config: { nodes: { id: string; type: string; params?: Record<string, string>; verbs?: string[] }[]; nodeOrder: string[] };
  content: Record<string, unknown>;
}) {
  const contract = {
    nodes: config.nodes.map((n) => ({ id: n.id, type: n.type, props: n.params })),
    nodeOrder: config.nodeOrder,
  };
  return <WebsiteTemplate contract={contract} screenPath="" />;
}
`;

  const screenTsx = `"use client";

import Wrapper from "./Wrapper";
import structureConfig from "./tsx.structure.config.json";
import content from "./content";

export default function ${PascalName}() {
  return <Wrapper config={structureConfig} content={content} />;
}
`;

  const contentTs = `/**
 * Content — CONTENT_DERIVATION_CONTRACT. No hardcoded state keys in TSX.
 */
export const screen = {
  title: "",
  ctaLabel: "",
} as const;

export const content = { screen } as const;
export default content;
`;

  const indexTs = `export { default } from "./${PascalName}";
`;

  fs.writeFileSync(path.join(targetDir, "Wrapper.tsx"), wrapperTsx, "utf8");
  fs.writeFileSync(path.join(targetDir, `${PascalName}.tsx`), screenTsx, "utf8");
  fs.writeFileSync(path.join(targetDir, "content.ts"), contentTs, "utf8");
  fs.writeFileSync(path.join(targetDir, "index.ts"), indexTs, "utf8");
}
