"use client";

import React, { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "prayer-org-onboarding-dismissed";

type Variant = "owner" | "member";

export interface OrgOnboardingBannerProps {
  variant: Variant;
  orgSlug?: string;
  hasGroups?: boolean;
  className?: string;
  /** Base path for prayer app (domain-agnostic: "/prayer"). */
  prayerBase?: string;
}

export function OrgOnboardingBanner({
  variant,
  orgSlug,
  hasGroups = false,
  className = "",
  prayerBase: prayerBaseProp,
}: OrgOnboardingBannerProps) {
  const prayerBase = prayerBaseProp ?? "/prayer";
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;
  if (variant === "member" && hasGroups) return null;

  if (variant === "owner") {
    return (
      <div
        className={className}
        style={{
          padding: "0.75rem 1rem",
          background: "var(--org-accent, #7c3aed)",
          color: "#fff",
          borderRadius: 8,
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.875rem" }}>
          Get started: create a group and start your first live prayer session.
        </span>
        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link
            href={`${prayerBase}/admin/groups`}
            style={{ color: "#fff", textDecoration: "underline", fontSize: "0.875rem" }}
          >
            Create group
          </Link>
          <span style={{ opacity: 0.8 }}>·</span>
          <Link
            href={`${prayerBase}/live`}
            style={{ color: "#fff", textDecoration: "underline", fontSize: "0.875rem" }}
          >
            Start live session
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.9)",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0 0.25rem",
            }}
          >
            ×
          </button>
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: "0.75rem 1rem",
        background: "rgba(124, 58, 237, 0.15)",
        border: "1px solid var(--org-accent, #7c3aed)",
        borderRadius: 8,
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <span style={{ fontSize: "0.875rem", color: "var(--prayer-text, #333)" }}>
        Join a group to pray with others.
      </span>
      <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Link
          href={orgSlug ? `${prayerBase}?groupId=${orgSlug}` : prayerBase}
          style={{
            color: "var(--org-accent, #7c3aed)",
            textDecoration: "underline",
            fontSize: "0.875rem",
          }}
        >
          Browse groups
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            color: "#666",
            cursor: "pointer",
            fontSize: "1rem",
            padding: "0 0.25rem",
          }}
        >
          ×
        </button>
      </span>
    </div>
  );
}
