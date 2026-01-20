"use client";
import React, { useEffect, useState } from "react";

type CardResult = {
  cardId: string;
  completed: boolean;
  output?: Record<string, any>;
};

type CardState = {
  step: number;
  completed: boolean;
  data?: Record<string, any>;
};

type CardProps = {
  onAdvance: (step: number) => void;
  onComplete: (result: CardResult) => void;
  restoreState: CardState | null;
};

export function EducationCard({ onAdvance, onComplete, restoreState }: CardProps) {
  const [step, setStep] = useState(restoreState?.step ?? 0);
  const [learned, setLearned] = useState<string[]>(
    restoreState?.data?.learned ?? []
  );

  useEffect(() => {
    if (restoreState) {
      setStep(restoreState.step ?? 0);
      setLearned(restoreState.data?.learned ?? []);
    }
  }, [restoreState]);

  const points = [
    "Cleanup time quietly drains profit daily.",
    "Clean sites reduce safety risk and improve trust.",
    "Appearance influences bids, referrals, and closeouts.",
  ];

  function next() {
    if (step < points.length) {
      const updated = [...learned, points[step]];
      setLearned(updated);
      const nextStep = step + 1;
      setStep(nextStep);
      onAdvance(nextStep);

      if (nextStep >= points.length) {
        onComplete({
          cardId: "education",
          completed: true,
          output: { learned: updated },
        });
      }
    }
  }

  return (
    <div>
      <h3>Why This Matters</h3>
      <ul style={{ marginTop: 12, paddingLeft: 20 }}>
        {learned.map((p, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            ✓ {p}
          </li>
        ))}
      </ul>

      {step < points.length ? (
        <button onClick={next} style={primaryBtn}>
          Next Point →
        </button>
      ) : (
        <div style={{ marginTop: 12, color: "#10b981" }}>
          ✓ Education Complete
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  marginTop: 12,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
};

