"use client";
/* Stub molecule — registry placeholder. Replace with full implementation. */
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import { resolveParams } from "@/engine/core/palette-resolver";

export type NavigationCompoundProps = {
  params?: { surface?: any };
  content?: Record<string, unknown>;
  children?: React.ReactNode;
};

(NavigationCompound as any).slots = { items: "item" };

export default function NavigationCompound({
  params = {},
  children,
}: NavigationCompoundProps) {
  return (
    <SurfaceAtom params={resolveParams(params.surface)} role="navigation">
      {children}
    </SurfaceAtom>
  );
}
