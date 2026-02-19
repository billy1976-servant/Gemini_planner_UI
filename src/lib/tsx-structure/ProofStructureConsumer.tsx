/**
 * Minimal proof skeleton: TSX consumer that displays resolved structure config.
 * Proves JSON → resolver → TSX without any per-screen registry.
 */

import React from "react";
import { resolveAppStructure } from "./resolver";
import type { TimelineStructureConfig } from "./types";

const ProofStructureConsumer: React.FC = () => {
  const resolved = resolveAppStructure("ProofStructureConsumer", {
    structure: {
      type: "timeline",
      templateId: "default",
      overrides: { slotMinutes: 30, dayStart: 360, dayEnd: 1320 },
    },
  });

  const config = resolved.template as unknown as TimelineStructureConfig;

  return (
    <div data-testid="proof-structure-consumer" style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h3>TSX App Structure Engine — Proof</h3>
      <p>
        <strong>Structure type:</strong> {resolved.structureType}
      </p>
      <p>
        <strong>Timeline config (from JSON):</strong> slotMinutes={config.slotMinutes}, dayStart=
        {config.dayStart}, dayEnd={config.dayEnd}, density={config.density}, defaultView=
        {config.defaultView}
      </p>
      <p>
        <strong>Schema version:</strong> {resolved.schemaVersion}
      </p>
      <p style={{ marginTop: 24, color: "#666" }}>
        Changing overrides (e.g. slotMinutes) in the metadata passed to resolveAppStructure updates
        this display. No registry was edited to add this screen.
      </p>
    </div>
  );
};

export default ProofStructureConsumer;
