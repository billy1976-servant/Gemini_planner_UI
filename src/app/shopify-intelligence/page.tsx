"use client";

import { useEffect, useState } from "react";
import type { ShopifyControlState, ShopifySignal } from "@/shopify/types";

export default function ShopifyIntelligencePage() {
  const [signal, setSignal] = useState<ShopifySignal | null>(null);
  const [controlState, setControlState] = useState<ShopifyControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shopify-intelligence");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || `HTTP ${res.status}`);
          return;
        }

        if (!cancelled) {
          setSignal(data.signal ?? null);
          setControlState(data.controlState ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Shopify Intelligence</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Shopify Intelligence</h1>
        <p style={{ color: "#c00" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Shopify Intelligence</h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
          Total Revenue (30 days)
        </h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {signal ? `$${signal.totalRevenue.toFixed(2)}` : "—"}
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
          Revenue Velocity (daily avg)
        </h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {signal ? `$${signal.revenueVelocity.toFixed(2)}` : "—"}
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
          Top 5 SKUs
        </h2>
        {signal?.topSKUs?.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>SKU</th>
                <th style={{ padding: "0.5rem" }}>Revenue</th>
                <th style={{ padding: "0.5rem" }}>Units</th>
              </tr>
            </thead>
            <tbody>
              {signal.topSKUs.map((row) => (
                <tr key={row.sku} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{row.sku}</td>
                  <td style={{ padding: "0.5rem" }}>${row.revenue.toFixed(2)}</td>
                  <td style={{ padding: "0.5rem" }}>{row.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No SKU data</p>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
          Health Score
        </h2>
        <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {controlState != null ? `${controlState.healthScore} / 100` : "—"}
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
          Suggested Action
        </h2>
        <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          {controlState?.suggestedAction ?? "—"}
        </p>
      </section>
    </div>
  );
}
