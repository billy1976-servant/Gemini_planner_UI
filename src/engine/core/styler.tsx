"use client";
import React, { createContext, useContext } from "react";
import palette from "@/registry/palettes.json";
import atomsCatalog from "@/registry/atoms.json";
import molecules from "@/registry/molecules.json";
import { USE_BLOCKS_AS_PRIMARY } from "@/blocks/blocks-runtime-config";
import { getAtomDefinition } from "@/blocks/atom-defs-adapter";

/* Atom definition: when USE_BLOCKS_AS_PRIMARY, manifest first then fallback to definitions JSON; else catalog only. */
const atoms: Record<string, unknown> = {};
for (const id of Object.keys(atomsCatalog as Record<string, unknown>)) {
  const entry = (atomsCatalog as Record<string, unknown>)[id] as Record<string, unknown>;
  atoms[id] = USE_BLOCKS_AS_PRIMARY
    ? { ...entry, ...getAtomDefinition(id) }
    : { ...entry };
}

/* -------------------------------------------------------
   CONTEXT
------------------------------------------------------- */
const StyleContext = createContext({
  palette,
  atoms,
  molecules,
  resolve: (token: string) => token,
});




/* -------------------------------------------------------
   TOKEN RESOLVER
------------------------------------------------------- */
function resolveToken(token: string, palette: any) {
  if (!token) return token;
  if (!token.includes(".")) return token;




  const parts = token.split(".");
  let current: any = palette;




  for (const p of parts) {
    current = current?.[p];
    if (!current) return token;
  }
  return current;
}




/* -------------------------------------------------------
   APPLY PARAMETERS TO A COMPONENT
------------------------------------------------------- */
export function useStyler() {
  const ctx = useContext(StyleContext);




  function apply(component: string, params: any = {}) {
    const def =
      ctx.molecules[component] ||
      ctx.atoms[component] ||
      null;




    if (!def) return params;




    const out: any = { ...params };




    // inject defaults
    if (def.defaults) {
      for (const k in def.defaults) {
        if (out[k] === undefined) out[k] = def.defaults[k];
      }
    }




    // resolve tokens
    for (const key in out) {
      const value = out[key];
      if (typeof value === "string") {
        out[key] = resolveToken(value, ctx.palette);
      }
    }




    return out;
  }




  return { apply, palette: ctx.palette };
}




/* -------------------------------------------------------
   PROVIDER
------------------------------------------------------- */
export default function Styler({ children }: { children: React.ReactNode }) {
  return (
    <StyleContext.Provider
      value={{
        palette,
        atoms,
        molecules,
        resolve: (token: string) => resolveToken(token, palette),
      }}
    >
      {children}
    </StyleContext.Provider>
  );
}




/* -------------------------------------------------------
   SIMPLE LAYOUT WRAPPER
------------------------------------------------------- */
export function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}










