/**
 * SiteOnboardingScreen
 * 
 * Thin wrapper screen that loads onboarding flow JSON from API
 * and passes it to the JSON-driven OnboardingFlowRenderer.
 * No hard-coded cards, no hard-coded text, no flow logic.
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingFlowRenderer } from "@/engine/onboarding/OnboardingFlowRenderer";

export default function SiteOnboardingScreen() {
  const searchParams = useSearchParams();
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const domain = searchParams.get("domain");
    
    if (!domain) {
      setError("Domain parameter is required. Add ?domain=containercreations.com to the URL.");
      setLoading(false);
      return;
    }

    console.log(`[SiteOnboardingScreen] Loading onboarding flow for domain: ${domain}`);
    
    fetch(`/api/sites/${domain}/onboarding`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.error || errData.message || `Failed to load onboarding: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log(`[SiteOnboardingScreen] ✓ Onboarding flow loaded from /api/sites/${domain}/onboarding`, data);
        setFlow(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("[SiteOnboardingScreen] Error loading onboarding:", err);
        setError(err.message || `Failed to load onboarding for domain: ${domain}`);
        setLoading(false);
      });
  }, [searchParams]);

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
        Loading onboarding flow...
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
          Onboarding Flow Not Found
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-secondary)",
            marginBottom: "var(--spacing-4)",
          }}
        >
          {error}
        </p>
        {error.includes("not found") && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              fontFamily: "monospace",
              backgroundColor: "var(--color-bg-secondary)",
              padding: "var(--spacing-4)",
              borderRadius: "var(--radius-md)",
              maxWidth: "600px",
            }}
          >
            Run 'npm run website' for this domain to generate onboarding.flow.json
          </p>
        )}
      </div>
    );
  }

  if (!flow) {
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
        No flow data available
      </div>
    );
  }

  const domain = searchParams.get("domain") ?? undefined;
  return <OnboardingFlowRenderer flow={flow} domain={domain} />;
}
