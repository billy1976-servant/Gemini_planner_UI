//update later to move STATE into molecules// 

"use client";
import { useState } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";


type FieldAtomProps = {
  params?: any;
  children?: any;
};


export default function FieldAtom({ params = {}, children }: FieldAtomProps) {
  const [localValue, setLocalValue] = useState("");


  const value =
    params.value !== undefined ? params.value : localValue;


  const handleChange = (v: string) => {
    // 🔑 EMIT INPUT VALUE WITH FIELD ID (CRITICAL FIX)
    window.dispatchEvent(
      new CustomEvent("input-change", {
        detail: {
          value: v,
          fieldKey: params.fieldKey, // ← THIS IS THE ENTIRE FIX
        },
      })
    );


    if (params.onChange) {
      params.onChange(v); // system-controlled path
    } else {
      setLocalValue(v); // fallback typing path
    }
  };


  const style: React.CSSProperties = {
    background: resolveToken(params.background),
    borderColor: resolveToken(params.borderColor),
    borderWidth: params.borderWidth ?? 1,
    borderStyle: "solid",
    borderRadius: resolveToken(params.radius),
    ...(params.padding != null && { padding: resolveToken(params.padding) }),
  };


  return (
    <div style={style}>
      {children ?? (
        params.multiline ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={params.rows ?? 4}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
          />
        )
      )}
    </div>
  );
}


