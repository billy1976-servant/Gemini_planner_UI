// src/compounds/ui/ContentCompound.tsx
"use client";


import React from "react";
import BaseCompound from "./BaseCompound";


/**
 * ContentCompound
 *
 * Purpose:
 * - Thin pass-through layer for renderer output
 * - No logic, no decisions
 * - Renderer decides shape, this just forwards
 */
export default function ContentCompound(node: any) {
  return <BaseCompound {...node} />;
}
