"use client";

import { useSearchParams } from "next/navigation";
import ScreenRenderer from "@/runtime/screens/ScreenRenderer";
import type { CompiledSiteModel } from "@/lib/siteCompiler/types";

export default function GibsonSiteScreen({ site }: { site: CompiledSiteModel }) {
  const searchParams = useSearchParams();
  const pagePath = searchParams.get("page") || "/";

  return (
    <ScreenRenderer
      screenId="compiled-site"
      context={{
        compiledSite: site,
        pagePath,
      }}
    />
  );
}
