"use client";

/**
 * WebsiteTemplate — TSX website screen content.
 * Uses global palette system (envelope applies palette from state/palette-store).
 * Does not apply palette locally; does not bypass global layout engine.
 * Rerenders when experience mode changes (consumes state via parent).
 */
import React from "react";
import { useAutoStructure } from "@/lib/tsx-structure";
import { useNodeOrder } from "./useNodeOrder";
import { NodeRenderer } from "./NodeRenderer";
import type { TsxWebsiteContract } from "./types";

const EXPERIENCE_LAYOUT: Record<string, React.CSSProperties> = {
  website: { maxWidth: "100%", padding: "0" },
  app: { maxWidth: "100%", padding: "0.5rem 1rem" },
  learning: { maxWidth: "min(800px, 100%)", margin: "0 auto", padding: "1.5rem 1rem" },
};

export function WebsiteTemplate({
  contract,
  screenPath,
  experience,
}: {
  contract: TsxWebsiteContract;
  screenPath: string;
  /** Current experience mode (website/app/learning) from global state; screen rerenders when it changes. */
  experience?: string;
}) {
  useAutoStructure();
  const orderedNodes = useNodeOrder(contract.nodes, contract.nodeOrder, screenPath);
  const exp = (experience ?? "website").toLowerCase();
  const experienceStyle = EXPERIENCE_LAYOUT[exp] ?? EXPERIENCE_LAYOUT.website;

  return (
    <div
      data-tsx-website="true"
      data-tsx-screen-path={screenPath}
      data-tsx-experience={exp}
      className={`tsx-website tsx-website--experience-${exp}`}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        width: "100%",
        ...experienceStyle,
      }}
    >
      {orderedNodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </div>
  );
}
