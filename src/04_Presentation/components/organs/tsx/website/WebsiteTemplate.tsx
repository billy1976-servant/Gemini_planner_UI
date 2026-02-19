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

  return (
    <div
      data-tsx-website="true"
      data-tsx-screen-path={screenPath}
      data-tsx-experience={experience ?? "website"}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        width: "100%",
      }}
    >
      {orderedNodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </div>
  );
}
