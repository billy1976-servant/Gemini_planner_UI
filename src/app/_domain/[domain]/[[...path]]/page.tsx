"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFolderForSubdomain } from "@/lib/domain-config";

/** Lazy loaders for domain modules so Next.js can statically bundle them. Key: "domain" or "domain/segment". */
const DOMAIN_MODULE_LOADERS: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  Christian: () => import("@/01_App/Christian/ChristianApp"),
  "Christian/prayer": () => import("@/01_App/Christian/Prayer/PrayerApp").then((m) => ({ default: m.PrayerApp })),
  "Christian/discipleship": () => import("@/01_App/Christian/Discipleship/GospelDiscipleship"),
  Business: () => import("@/01_App/Business/BusinessApp"),
  Plan: () => import("@/01_App/Plan/PlanApp"),
  Protect: () => import("@/01_App/Protect/ProtectApp"),
  Research: () => import("@/01_App/Research/ResearchApp"),
  Learn: () => import("@/01_App/Learn/LearnApp"),
};

function getModuleKey(domainFolder: string, pathSegments: string[]): string | null {
  if (pathSegments.length === 0) return domainFolder;
  const first = pathSegments[0].toLowerCase();
  return `${domainFolder}/${first}`;
}

async function resolveDomainModule(
  domainFolder: string,
  pathSegments: string[]
): Promise<React.ComponentType<any> | null> {
  const key = getModuleKey(domainFolder, pathSegments);
  const loader = key ? DOMAIN_MODULE_LOADERS[key] : null;
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return null;
  }
}

export default function DomainPage() {
  const params = useParams();
  const domain = (params?.domain as string) ?? "";
  const pathArray = params?.path as string[] | undefined;
  const pathSegments = Array.isArray(pathArray) ? pathArray : pathArray ? [pathArray] : [];
  const folder = getFolderForSubdomain(domain);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folder) {
      setError("Unknown domain");
      return;
    }
    resolveDomainModule(folder, pathSegments)
      .then((Comp) => {
        if (Comp) setComponent(() => Comp);
        else setError("Module not found");
      })
      .catch(() => setError("Module not found"));
  }, [folder, pathSegments.join("/")]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        {error}
      </div>
    );
  }
  if (!Component) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>
    );
  }
  return <Component />;
}
