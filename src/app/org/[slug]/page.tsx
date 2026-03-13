"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { OrganizationRecord } from "@/lib/universal-identity/types";

export default function OrgSlugPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const [org, setOrg] = useState<OrganizationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/org/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Organization not found");
        return res.json();
      })
      .then((data: OrganizationRecord) => {
        setOrg(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!org?.palette) return;
    const root = document.documentElement;
    const { palette } = org;
    if (palette?.accent) root.style.setProperty("--org-accent", palette.accent);
    if (typeof palette?.primary === "string") root.style.setProperty("--org-primary", palette.primary);
    return () => {
      root.style.removeProperty("--org-accent");
      root.style.removeProperty("--org-primary");
    };
  }, [org]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading…
      </div>
    );
  }
  if (error || !org) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {error ?? "Organization not found"}
      </div>
    );
  }

  return (
    <div data-org-id={org.id} data-org-slug={org.slug}>
      <h1 style={{ marginBottom: "0.5rem" }}>{org.name}</h1>
      <p style={{ fontSize: "0.875rem", color: "var(--org-accent, #666)" }}>
        Organization: {org.slug}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <a href="/prayer" style={{ textDecoration: "none", color: "var(--org-accent, #7c3aed)" }}>
          Go to Prayer
        </a>
        <a
          href={`/prayer?organizationId=${encodeURIComponent(org.id)}`}
          style={{ textDecoration: "none", color: "var(--org-accent, #7c3aed)" }}
        >
          Prayer for this org
        </a>
      </div>
    </div>
  );
}
