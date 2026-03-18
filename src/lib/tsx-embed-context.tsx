"use client";

import React, { createContext, useContext } from "react";

export type TsxEmbedContextValue = {
  getComponent: (path: string) => React.ComponentType<any> | null;
};

const TsxEmbedContext = createContext<TsxEmbedContextValue | null>(null);

export function TsxEmbedProvider({
  value,
  children,
}: {
  value: TsxEmbedContextValue;
  children: React.ReactNode;
}) {
  return (
    <TsxEmbedContext.Provider value={value}>
      {children}
    </TsxEmbedContext.Provider>
  );
}

export function useTsxEmbed(): TsxEmbedContextValue | null {
  return useContext(TsxEmbedContext);
}
