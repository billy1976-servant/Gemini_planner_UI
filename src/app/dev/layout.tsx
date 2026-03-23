"use client";

import React, { useEffect } from "react";
import { enableDevInlineEditing } from "@/07_Dev_Tools/dev-inline-edit";
import { ThemeProvider } from "../../components/ui/ThemeProvider";

/**
 * Dev route layout. Rail and RightSidebar are rendered by root layout (EditorRoot)
 * with embedded=true. ThemeProvider is duplicated here (root also wraps) so /dev always
 * has a provider even if the app shell tree changes.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    enableDevInlineEditing();
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
