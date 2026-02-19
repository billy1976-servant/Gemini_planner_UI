"use client";

/**
 * TSX Structure Layer — context so any TSX screen (or descendant) can read
 * the resolved structure config from the envelope without prop drilling.
 */

import React, { createContext, useContext } from "react";
import type { ResolvedAppStructure } from "./types";

const StructureConfigContext = createContext<ResolvedAppStructure | null>(null);

export type StructureConfigProviderProps = {
  value: ResolvedAppStructure;
  children: React.ReactNode;
};

export function StructureConfigProvider({ value, children }: StructureConfigProviderProps) {
  return (
    <StructureConfigContext.Provider value={value}>
      {children}
    </StructureConfigContext.Provider>
  );
}

/**
 * Returns the resolved app structure for the current TSX screen (from the envelope).
 * Use inside any component rendered under TSXScreenWithEnvelope.
 */
export function useStructureConfig(): ResolvedAppStructure | null {
  return useContext(StructureConfigContext);
}
