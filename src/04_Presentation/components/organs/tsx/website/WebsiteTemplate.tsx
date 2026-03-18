"use client";

/**
 * WebsiteTemplate — TSX website screen content.
 * Uses global palette system (envelope applies palette from state/palette-store).
 * Layout style comes from envelope/profile (layoutStyle prop), not from experience branching.
 */
import React from "react";
import { useAutoStructure } from "@/lib/tsx-structure";
import { useNodeOrder } from "./useNodeOrder";
import { NodeRenderer } from "./NodeRenderer";
import type { TsxWebsiteContract } from "./types";
import { registerTemplate } from "@/system/registry/templateRegistry";

const DEFAULT_LAYOUT_STYLE: React.CSSProperties = {
  maxWidth: "100%",
  padding: "0",
};

export function WebsiteTemplate({
  contract,
  screenPath,
  experience,
  layoutStyle,
}: {
  contract: TsxWebsiteContract;
  screenPath: string;
  /** For data-tsx-experience and class only; layout decisions come from envelope. */
  experience?: string;
  /** From envelope/profile; content-area layout (maxWidth, padding). */
  layoutStyle?: React.CSSProperties;
}) {
  useAutoStructure();
  const orderedNodes = useNodeOrder(contract.nodes, contract.nodeOrder, screenPath);
  const exp = (experience ?? "website").toLowerCase();
  const style = layoutStyle ?? DEFAULT_LAYOUT_STYLE;

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
        ...style,
      }}
    >
      {orderedNodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </div>
  );
}

registerTemplate({
  name: "WebsiteTemplate",
  structureType: "list",
  requiredStateKeys: [],
  supportedEngines: [],
  description: "Website presentation template (layout from envelope/profile)",
});
