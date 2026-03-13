"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getGuidedPrayers, type GuidedPrayer } from "../api/prayer-api";

export interface GuidedSectionProps {
  groupSlug?: string | null;
}

const CATEGORIES = [
  "Government",
  "Persecuted Church",
  "Family",
  "Church",
  "Community",
  "Global Missions",
  "General",
];

export function GuidedSection({ groupSlug }: GuidedSectionProps) {
  const [guides, setGuides] = useState<GuidedPrayer[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGuidedPrayers(category ?? undefined)
      .then(setGuides)
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  }, [category]);

  const base = groupSlug ? `/prayer/${groupSlug}` : "/prayer";

  return (
    <div className="prayer-guided-section" style={{ marginTop: "1rem" }}>
      <h2 className="prayer-section-title">Guided Prayer</h2>
      <p className="prayer-section-description" style={{ marginBottom: "1rem" }}>
        Structured prayer prompts with scripture and focus points.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setCategory(null)}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: 8,
            border: `1px solid ${category === null ? "var(--prayer-play-bg)" : "var(--prayer-card-border)"}`,
            background: category === null ? "var(--prayer-play-bg)" : "transparent",
            color: category === null ? "#fff" : "var(--prayer-text)",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: `1px solid ${category === cat ? "var(--prayer-play-bg)" : "var(--prayer-card-border)"}`,
              background: category === cat ? "var(--prayer-play-bg)" : "transparent",
              color: category === cat ? "#fff" : "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="prayer-section-muted">Loading…</p>
      ) : guides.length === 0 ? (
        <p className="prayer-section-muted">No guided prayers yet. Admins can create them from the Admin page.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guides.map((g) => (
            <li
              key={g.id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
                background: "rgba(24,22,36,0.4)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div className="prayer-title" style={{ fontSize: "1rem" }}>{g.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)" }}>{g.category}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    border: "1px solid var(--prayer-play-bg)",
                    background: "var(--prayer-play-bg)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  {expandedId === g.id ? "Hide" : "Start Guided Prayer"}
                </button>
              </div>
              {expandedId === g.id && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--prayer-card-border)" }}>
                  {g.scripture && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", marginBottom: "0.25rem" }}>Scripture</div>
                      <div style={{ fontSize: "0.9375rem", whiteSpace: "pre-wrap" }}>{g.scripture}</div>
                    </div>
                  )}
                  {g.focus && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", marginBottom: "0.25rem" }}>Focus</div>
                      <div style={{ fontSize: "0.9375rem", whiteSpace: "pre-wrap" }}>{g.focus}</div>
                    </div>
                  )}
                  <Link
                    href="/prayer/admin"
                    className="prayer-share-link"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Record response prayer →
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link href={base} className="prayer-share-link">
          ← Back to Prayer
        </Link>
      </div>
    </div>
  );
}
