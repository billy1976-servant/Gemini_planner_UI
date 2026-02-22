"use client";

import React, { createContext, useContext } from "react";
import type { DirectorContextValue } from "./director-types";

const DirectorContext = createContext<DirectorContextValue | null>(null);

export function useDirector(): DirectorContextValue | null {
  return useContext(DirectorContext);
}

export function useDirectorProps() {
  const ctx = useDirector();
  return ctx?.directorProps ?? null;
}

export { DirectorContext };
