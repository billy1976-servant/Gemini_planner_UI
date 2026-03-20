"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { OrganizationRecord } from "@/lib/universal-identity/types";
import { OrgOnboardingBanner } from "@/01_App/hiclarify/christian/prayer/onboarding/orgonboardingbanner";

type MemberRow = { userId: string; role: string; email: string; displayName: string };
type GroupRow = Record<string, unknown>;

export default function OrgAdminPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const prayerBase = "/prayer";
  const [org, setOrg] = useState<OrganizationRecord | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    fetch(`/api/org/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((orgRes) => {
        if (!orgRes.ok) throw new Error("Org not found");
        return orgRes.json() as Promise<OrganizationRecord>;
      })
      .then((o) => {
        setOrg(o);
        return fetch(`/api/org/${encodeURIComponent(slug)}/members`, { cache: "no-store" });
      })
      .then((membersRes) => {
        if (membersRes.status === 403) {
          setAccessDenied(true);
          return { denied: true, members: [] as MemberRow[] };
        }
        if (!membersRes.ok) throw new Error("Failed to load members");
        return membersRes.json().then((d: { members: MemberRow[] }) => ({ denied: false, members: d.members }));
      })
      .then((membersResult) => {
        setMembers(membersResult.members);
        if (membersResult.denied) return null;
        return fetch(`/api/org/${encodeURIComponent(slug)}/groups`, { cache: "no-store" });
      })
      .then((groupsRes) => {
        if (groupsRes?.ok) return groupsRes.json() as Promise<{ groups: GroupRow[] }>;
        return null;
      })
      .then((groupsData) => {
        if (groupsData?.groups) setGroups(groupsData.groups);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading…
      </div>
    );
  }
  if (accessDenied) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Access denied. You need admin rights for this organization.</p>
        <Link href={slug ? `/org/${slug}` : "/"} style={{ marginTop: "1rem", display: "inline-block" }}>
          Back to organization
        </Link>
      </div>
    );
  }
  if (error || !org) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {error ?? "Organization not found"}
        <Link href="/" style={{ marginTop: "1rem", display: "block" }}>Home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <OrgOnboardingBanner variant="owner" orgSlug={org.slug} hasGroups={groups.length > 0} prayerBase={prayerBase} />
      <h1 style={{ marginBottom: "0.5rem" }}>{org.name} — Admin</h1>
      <p style={{ fontSize: "0.875rem", color: "var(--org-accent, #666)", marginBottom: "1.5rem" }}>
        {org.slug}
      </p>
      <nav style={{ marginBottom: "1.5rem" }}>
        <Link href={`/org/${org.slug}`} style={{ marginRight: "1rem" }}>Org home</Link>
        <Link href={prayerBase} style={{ marginRight: "1rem" }}>Prayer</Link>
      </nav>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Members</h2>
        {members.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#666" }}>No members yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {members.map((m) => (
              <li key={m.userId} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                {m.displayName || m.email || m.userId} — <strong>{m.role}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Groups</h2>
        {groups.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#666" }}>No groups in this org.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {groups.map((g) => (
              <li key={(g as { id?: string }).id ?? ""} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                <Link href={`${prayerBase}/${(g as { slug?: string }).slug ?? ""}`}>
                  {(g as { name?: string }).name ?? (g as { id?: string }).id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>Actions</h2>
        <Link
          href={`${prayerBase}/live`}
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: "var(--org-accent, #7c3aed)",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            marginRight: "0.5rem",
          }}
        >
          Create live session
        </Link>
      </section>
    </div>
  );
}
