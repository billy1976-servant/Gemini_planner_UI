"use client";

import React, { useEffect } from "react";
import { enableDevInlineEditing } from "@/07_Dev_Tools/dev-inline-edit";

/**
 * Dev route layout. Rail and RightSidebar are rendered by root layout (EditorRoot)
 * with embedded=true. This layout only enables inline editing and passes children through.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    enableDevInlineEditing();
  }, []);

  return <>{children}</>;
}
