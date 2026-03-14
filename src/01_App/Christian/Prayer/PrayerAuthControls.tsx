"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export interface PrayerAuthControlsProps {
  /** Base path for prayer app (domain-agnostic: "/prayer") for sign-in callback fallback. */
  prayerBase?: string;
}

export function PrayerAuthControls({ prayerBase = "/prayer" }: PrayerAuthControlsProps = {}) {
  const { data: session, status } = useSession();
  // Fixed callbackUrl to avoid redirect loops; always return to /prayer after sign-in.
  const callbackUrl = "/prayer";

  if (status === "loading") {
    return (
      <span className="prayer-auth-loading" style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted, #94a3b8)" }}>
        …
      </span>
    );
  }

  if (session?.user) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            width={24}
            height={24}
            style={{ borderRadius: "50%", verticalAlign: "middle" }}
          />
        )}
        <span style={{ color: "var(--prayer-text-muted, #94a3b8)" }}>
          {session.user.name ?? session.user.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="prayer-admin-link"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          Sign out
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Temporarily disabled for testing — all features are available without signing in"
        style={{
          padding: "0.35rem 0.75rem",
          borderRadius: 8,
          border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.3))",
          background: "var(--prayer-card-border, rgba(148,163,184,0.2))",
          color: "var(--prayer-text-muted, #94a3b8)",
          cursor: "not-allowed",
          fontSize: "0.875rem",
          opacity: 0.9,
        }}
      >
        Sign in with Google
      </button>
      <span style={{ color: "var(--prayer-text-muted, #94a3b8)", fontSize: "0.75rem" }}>
        (disabled for testing)
      </span>
    </span>
  );
}
