"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteSkin from "@/lib/site-skin/SiteSkin";
import type { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import { buildSiteSkinDataBag } from "@/logic/bridges/engineToSkin.bridge";

export default function SiteSkinPreviewScreen() {
  const sp = useSearchParams();
  const domain = sp.get("domain") || "containercreations.com";
  const pageId = sp.get("pageId") || "home";
  const note = sp.get("note") || "";
  const debugRegions = sp.get("debugRegions") === "1";

  const [siteData, setSiteData] = useState<NormalizedSite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSiteData(null);

    fetch(`/api/sites/${encodeURIComponent(domain)}/normalized`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || data?.message || `Failed to load normalized site (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSiteData(data as NormalizedSite);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading normalized site data…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <b>SiteSkin preview failed</b>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </div>
    );
  }

  if (!siteData) {
    return <div style={{ padding: 24 }}>No site data</div>;
  }

  const dataBag = buildSiteSkinDataBag({ siteData });
  return (
    <>
      {!!note && (
        <div style={{ padding: 12, marginBottom: 12, border: "1px solid var(--color-border)" }}>
          <b>Note:</b> {note}
        </div>
      )}
      <SiteSkin domain={domain} pageId={pageId} data={dataBag} debugRegions={debugRegions} />
    </>
  );
}

