"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteSkin from "@/lib/site-skin/SiteSkin";

type OnboardingFlow = {
  title?: string;
  cards?: Array<{ id: string; type?: string; title?: string }>;
};

function flowToStepperNode(flow: OnboardingFlow) {
  const cards = Array.isArray(flow.cards) ? flow.cards : [];
  return {
    id: "onboarding_stepper",
    type: "Stepper",
    steps: cards.map((c) => ({
      content: { label: c.title || c.id },
      // Intentionally omit behavior here; engines can supply it later.
    })),
  };
}

export default function OnboardingSkinPreviewScreen() {
  const sp = useSearchParams();
  const domain = sp.get("domain") || "containercreations.com";
  const pageId = sp.get("pageId") || "onboarding";
  const note = sp.get("note") || "";
  const debugRegions = sp.get("debugRegions") === "1";

  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFlow(null);

    fetch(`/api/sites/${encodeURIComponent(domain)}/onboarding`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || data?.message || `Failed to load onboarding flow (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFlow(data as OnboardingFlow);
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
    return <div style={{ padding: 24 }}>Loading onboarding flow…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <b>Onboarding SiteSkin preview failed</b>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </div>
    );
  }

  if (!flow) {
    return <div style={{ padding: 24 }}>No onboarding flow data</div>;
  }

  const dataBag = {
    onboarding: {
      stepper: [flowToStepperNode(flow)],
    },
    engine: {
      flow,
    },
  };

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

