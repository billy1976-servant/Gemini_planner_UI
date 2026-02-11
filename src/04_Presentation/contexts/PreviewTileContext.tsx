"use client";

import React, { createContext, useContext } from "react";

export type PreviewTileContextValue = {
  isPreviewTile: boolean;
};

const PreviewTileContext = createContext<PreviewTileContextValue>({ isPreviewTile: false });

export function PreviewTileProvider({
  children,
  value = { isPreviewTile: true },
}: {
  children: React.ReactNode;
  value?: PreviewTileContextValue;
}) {
  return (
    <PreviewTileContext.Provider value={value}>
      {children}
    </PreviewTileContext.Provider>
  );
}

export function usePreviewTile(): PreviewTileContextValue {
  return useContext(PreviewTileContext);
}

export default PreviewTileContext;
