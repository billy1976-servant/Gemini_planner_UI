"use client";

import React, { createContext, useContext, useMemo } from "react";

export type OriginTrace = {
  screenId?: string;
  layoutId?: string;
  sectionId?: string;
  moleculeId?: string;
  atomId?: string;
  jsonPath?: string;
};

const defaultTrace: OriginTrace = {};

const OriginTraceContext = createContext<OriginTrace>(defaultTrace);

export function useOriginTrace(): OriginTrace {
  return useContext(OriginTraceContext);
}

type OriginTraceProviderProps = {
  value: Partial<OriginTrace>;
  children: React.ReactNode;
};

export function OriginTraceProvider({ value, children }: OriginTraceProviderProps) {
  const parent = useOriginTrace();
  const merged = useMemo(() => {
    const next = { ...parent };
    if (value.screenId !== undefined) next.screenId = value.screenId;
    if (value.layoutId !== undefined) next.layoutId = value.layoutId;
    if (value.sectionId !== undefined) next.sectionId = value.sectionId;
    if (value.moleculeId !== undefined) next.moleculeId = value.moleculeId;
    if (value.atomId !== undefined) next.atomId = value.atomId;
    if (value.jsonPath !== undefined) next.jsonPath = value.jsonPath;
    return next;
  }, [parent, value.screenId, value.layoutId, value.sectionId, value.moleculeId, value.atomId, value.jsonPath]);
  return (
    <OriginTraceContext.Provider value={merged}>
      {children}
    </OriginTraceContext.Provider>
  );
}

function getDataProps(trace: OriginTrace & { atomId: string }): Record<string, string> {
  return {
    "data-screen": trace.screenId ?? "",
    "data-layout": trace.layoutId ?? "",
    "data-section": trace.sectionId ?? "",
    "data-molecule": trace.moleculeId ?? "",
    "data-atom": trace.atomId ?? "",
    "data-json-path": trace.jsonPath ?? "",
  };
}

export function withOriginTraceStamp<P extends object>(
  Component: React.ComponentType<P>,
  atomId: string
): React.ComponentType<P> {
  function StampedAtom(props: P) {
    const trace = useOriginTrace();
    const merged = useMemo(() => ({ ...trace, atomId }), [trace.screenId, trace.layoutId, trace.sectionId, trace.moleculeId, trace.jsonPath, atomId]);
    const dataProps = getDataProps(merged as OriginTrace & { atomId: string });
    const element = React.createElement(Component, props);
    if (React.isValidElement(element) && typeof element.type !== "string") {
      const child = element as React.ReactElement<Record<string, unknown> & { style?: React.CSSProperties }>;
      const existingProps = child.props ?? {};
      return React.cloneElement(child, {
        ...existingProps,
        ...dataProps,
      } as Partial<Record<string, unknown>>);
    }
    return React.createElement("span", { ...dataProps }, element);
  }
  StampedAtom.displayName = `OriginTraceStamp(${Component.displayName ?? Component.name ?? "Atom"})`;
  return StampedAtom;
}
