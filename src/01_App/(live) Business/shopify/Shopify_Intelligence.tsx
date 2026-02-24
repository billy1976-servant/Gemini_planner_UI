"use client";

/**
 * Shopify Intelligence — TSX template (Template V2).
 * Content from local content.ts; no hardcoded strings. Uses CSS vars and Director primitives when available.
 */
import React, { useEffect, useState } from "react";
import content from "./content";
import { useDirector } from "@/lib/director/DirectorContext";
import type {
  ShopifyControlState,
  ShopifyIntelligenceApiError,
  ShopifyIntelligenceApiResponse,
  ShopifySignal,
} from "@/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/types";

function useShopParam(): string | undefined {
  const [shop, setShop] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShop(params.get("shop")?.trim() ?? undefined);
  }, []);
  return shop;
}

export default function ShopifyIntelligence() {
  const director = useDirector();
  const shop = useShopParam();
  const [signal, setSignal] = useState<ShopifySignal | null>(null);
  const [controlState, setControlState] = useState<ShopifyControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm, 1rem)",
    marginBottom: "var(--spacing-xs, 0.5rem)",
    color: "var(--color-text-muted, #666)",
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setInstallUrl(null);
      try {
        const store = shop ?? content.fallbackShop;
        const url = `${content.apiPath}?shop=${encodeURIComponent(store)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          const err = data as ShopifyIntelligenceApiError;
          if (err.installUrl) setInstallUrl(err.installUrl);
          setError(err.error || `HTTP ${res.status}`);
          return;
        }

        if (!cancelled) {
          const body = data as ShopifyIntelligenceApiResponse;
          setSignal(body.signal ?? null);
          setControlState(body.controlState ?? null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : content.labels.failedToLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-lg, 2rem)", fontFamily: "system-ui, sans-serif" }}>
        <h1>{content.title}</h1>
        <p>{content.labels.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--spacing-lg, 2rem)", fontFamily: "system-ui, sans-serif" }}>
        <h1>{content.title}</h1>
        <p style={{ color: "var(--color-error, #c00)" }}>{error}</p>
        {installUrl && (
          <p style={{ marginTop: "var(--spacing-md, 1rem)" }}>
            <a href={installUrl}>{content.labels.installAuthorize}</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "var(--spacing-lg, 2rem)",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        ...(director?.directorProps?.layoutDensity === "tight" ? { padding: "var(--spacing-md, 1rem)" } : {}),
      }}
    >
      <h1 style={{ marginBottom: "var(--spacing-md, 1.5rem)", color: "var(--color-text-primary)" }}>
        {content.title}
      </h1>

      <section style={{ marginBottom: "var(--spacing-md, 1.5rem)" }}>
        <h2 style={sectionHeadingStyle}>{content.labels.totalRevenue}</h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {signal ? `$${signal.totalRevenue.toFixed(2)}` : "—"}
        </p>
      </section>

      <section style={{ marginBottom: "var(--spacing-md, 1.5rem)" }}>
        <h2 style={sectionHeadingStyle}>{content.labels.revenueVelocity}</h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {signal ? `$${signal.revenueVelocity.toFixed(2)}` : "—"}
        </p>
      </section>

      <section style={{ marginBottom: "var(--spacing-md, 1.5rem)" }}>
        <h2 style={sectionHeadingStyle}>{content.labels.topSKUs}</h2>
        {signal?.topSKUs?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-outline, #ddd)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "var(--spacing-xs, 0.5rem)" }}>{content.labels.sku}</th>
                <th style={{ padding: "var(--spacing-xs, 0.5rem)" }}>{content.labels.revenue}</th>
                <th style={{ padding: "var(--spacing-xs, 0.5rem)" }}>{content.labels.units}</th>
              </tr>
            </thead>
            <tbody>
              {signal.topSKUs.map((row) => (
                <tr
                  key={row.sku}
                  style={{ borderBottom: "1px solid var(--color-outline-muted, #eee)" }}
                >
                  <td style={{ padding: "var(--spacing-xs, 0.5rem)" }}>{row.sku}</td>
                  <td style={{ padding: "var(--spacing-xs, 0.5rem)" }}>${row.revenue.toFixed(2)}</td>
                  <td style={{ padding: "var(--spacing-xs, 0.5rem)" }}>{row.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "var(--color-text-muted)" }}>{content.labels.noSkuData}</p>
        )}
      </section>

      <section style={{ marginBottom: "var(--spacing-md, 1.5rem)" }}>
        <h2 style={sectionHeadingStyle}>{content.labels.healthScore}</h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {controlState != null ? `${controlState.healthScore} / 100` : "—"}
        </p>
      </section>

      <section>
        <h2 style={sectionHeadingStyle}>{content.labels.suggestedAction}</h2>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {controlState?.suggestedAction ?? "—"}
        </p>
      </section>
    </div>
  );
}
