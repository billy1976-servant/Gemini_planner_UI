/**
 * SitesDirectoryScreen
 * 
 * Displays a list of all compiled sites and links to their onboarding flows.
 * Reads from src/content/sites/_index/sites.json
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SiteEntry = {
  domain: string;
  title: string;
};

export default function SitesDirectoryScreen() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sites/list")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load sites: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Handle both array response and {sites: []} response format
        const sitesList = Array.isArray(data) ? data : (data?.sites || []);
        setSites(sitesList);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("[SitesDirectoryScreen] Error loading sites:", err);
        setError(err.message || "Failed to load sites");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--font-size-lg)",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading sites...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-8)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            marginBottom: "var(--spacing-4)",
            color: "var(--color-text-primary)",
          }}
        >
          Error Loading Sites
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-secondary)",
          }}
        >
          {error}
        </p>
        <p
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
            marginTop: "var(--spacing-4)",
          }}
        >
          Run 'npm run website' to generate sites.json
        </p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-8)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            marginBottom: "var(--spacing-4)",
            color: "var(--color-text-primary)",
          }}
        >
          No Sites Found
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-secondary)",
          }}
        >
          No compiled sites found. Run 'npm run compile' and 'npm run website' to build sites.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "var(--spacing-8)",
        background: "var(--color-bg-primary, #f9fafb)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "var(--font-size-3xl, 32px)",
            fontWeight: "var(--font-weight-bold, 700)",
            marginBottom: "var(--spacing-6, 24px)",
            color: "var(--color-text-primary, #1a1a1a)",
          }}
        >
          Sites Directory
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--spacing-4, 16px)",
          }}
        >
          {sites.map((site) => (
            <Link
              key={site.domain}
              href={`/?screen=tsx:SiteOnboardingScreen&domain=${site.domain}`}
              style={{
                display: "block",
                padding: "var(--spacing-6, 24px)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "var(--radius-lg, 12px)",
                background: "var(--color-bg-secondary, #ffffff)",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h2
                style={{
                  fontSize: "var(--font-size-xl, 20px)",
                  fontWeight: "var(--font-weight-semibold, 600)",
                  marginBottom: "var(--spacing-2, 8px)",
                  color: "var(--color-text-primary, #1a1a1a)",
                }}
              >
                {site.title}
              </h2>
              <p
                style={{
                  fontSize: "var(--font-size-sm, 14px)",
                  color: "var(--color-text-secondary, #6b7280)",
                  margin: 0,
                }}
              >
                {site.domain}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
