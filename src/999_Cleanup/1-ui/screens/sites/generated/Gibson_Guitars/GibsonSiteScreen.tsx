"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { CompiledSiteModel } from "@/lib/siteCompiler/types";

const ScreenRenderer = dynamic(() => import("@/apps-tsx/core/ScreenRenderer"), { ssr: false });

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
