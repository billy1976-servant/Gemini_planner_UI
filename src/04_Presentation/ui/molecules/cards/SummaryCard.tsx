"use client";
import React from "react";

type CardState = {
  step: number;
  completed: boolean;
  data?: Record<string, any>;
};

type CardProps = {
  onAdvance: (step: number) => void;
  onComplete: (result: any) => void;
  restoreState: CardState | null;
};

export function SummaryCard({ restoreState }: CardProps) {
  const outputs = restoreState?.data?.outputs ?? {};
  const calculator = outputs.calculator;
  const education = outputs.education;

  return (
    <div>
      <h3>Summary &amp; Next Step</h3>

      {calculator?.totalLoss != null ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#0f172a",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
            Estimated Monthly Loss
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#ef4444" }}>
            ${calculator.totalLoss.toLocaleString()}
          </div>
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: 12 }}>
          Complete the calculator card to see your monthly loss here.
        </p>
      )}

      {education?.learned && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            What You Learned
          </div>
          <ul style={{ margin: 0, opacity: 0.95 }}>
            {education.learned.map((x: string, i: number) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}

      {calculator?.totalLoss != null && (
        <button style={ctaBtn}>
          Try 2 Pros Once → Lock In Cleanup Support
        </button>
      )}
    </div>
  );
}

const ctaBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  marginTop: 16,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#1e40af",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
};

