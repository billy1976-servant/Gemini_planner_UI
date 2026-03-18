/**
 * TokenProbeHost — offscreen probe element for DOM computed-style verification.
 * Exposes imperative runProbe({ keyPath, resolvedValue }) via ref.
 * No app screen changes.
 */

"use client";

import React, { useImperativeHandle, useRef, forwardRef } from "react";
import { getProbeSpecForToken } from "./paletteTokenInspector";

export type RunProbeArgs = {
  keyPath: string;
  resolvedValue: unknown;
};

export type TokenProbeHostRef = {
  runProbe: (args: RunProbeArgs) => Record<string, string>;
};

function valueToCss(keyPath: string, prop: string, value: unknown): string {
  if (value === undefined || value === null) return "";
  const family = keyPath.split(".")[0];
  if (prop === "fontWeight" || prop === "lineHeight") return String(value);
  if (prop === "fontSize" || prop === "padding" || prop === "gap" || prop === "letterSpacing") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n === 0 ? "0" : `${n}px`;
  }
  if (prop === "borderRadius") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n === 0 ? "0" : `${n}px`;
  }
  if (prop === "boxShadow" && family === "shadow" && typeof value === "string") return value;
  if (prop === "boxShadow" && family === "elevation" && typeof value === "string") return value;
  if ((prop === "color" || prop === "backgroundColor") && typeof value === "string") return value;
  if (prop === "fontFamily" && typeof value === "string") return value;
  return String(value);
}

const TokenProbeHostInner = forwardRef<TokenProbeHostRef>(function TokenProbeHostInner(_, ref) {
  const probeElRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      runProbe({ keyPath, resolvedValue }: RunProbeArgs): Record<string, string> {
        const el = probeElRef.current;
        if (!el) return {};

        const props = getProbeSpecForToken(keyPath);
        el.style.cssText = "";

        for (const prop of props) {
          const cssValue = valueToCss(keyPath, prop, resolvedValue);
          if (cssValue) (el.style as any)[prop] = cssValue;
        }

        const computed = getComputedStyle(el);
        const out: Record<string, string> = {};
        for (const prop of props) {
          const v = (computed as any)[prop];
          if (v != null && v !== "") out[prop] = String(v);
        }
        return out;
      },
    }),
    []
  );

  return (
    <div
      style={{
        position: "fixed",
        left: -99999,
        top: -99999,
        width: 1,
        height: 1,
        overflow: "hidden",
        pointerEvents: "none",
        visibility: "hidden",
      }}
      aria-hidden
    >
      <div ref={probeElRef} style={{ display: "inline-block" }} />
    </div>
  );
});

TokenProbeHostInner.displayName = "TokenProbeHost";
const TokenProbeHost = TokenProbeHostInner;
export default TokenProbeHost;
