"use client";
import React, { createContext, useContext } from "react";

type EngineRuntimeContextValue = {
  flowId: string | null;
  engineId: string | null;
  experienceMode?: string;
  palette?: string;
};

const EngineRuntimeContext = createContext<EngineRuntimeContextValue>({
  flowId: null,
  engineId: null,
});

export function useEngineRuntime() {
  return useContext(EngineRuntimeContext);
}

type EngineRuntimeProviderProps = {
  flowId: string | null;
  engineId: string | null;
  experienceMode?: string;
  palette?: string;
  children: React.ReactNode;
};

export function EngineRuntimeProvider({
  flowId,
  engineId,
  experienceMode,
  palette,
  children,
}: EngineRuntimeProviderProps) {
  return (
    <EngineRuntimeContext.Provider
      value={{
        flowId,
        engineId,
        experienceMode,
        palette,
      }}
    >
      {children}
    </EngineRuntimeContext.Provider>
  );
}
