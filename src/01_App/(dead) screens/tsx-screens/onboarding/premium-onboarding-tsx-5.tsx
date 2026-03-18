"use client";
import React, { useEffect, useMemo, useState } from "react";
import Cleanup25xDemo from "@/apps-tsx/tsx-screens/calculators/calculator-1";
import EducationFlow from "@/apps-tsx/tsx-screens/calculators/Education-flow";


/* ======================================================
   TYPES — WRAPPER OWNS SHAPE ONLY
====================================================== */
type Flow = "education" | "calculator";


type Event = { event: string; at: number };


type EducationProgress = {
  startedAt?: number;
  completed?: boolean;
  learned?: string[];
};


type CalculatorProgress = {
  step?: number;
  completed?: boolean;
  totalLoss?: number;
};


type SessionState = {
  startedAt: number;
  flow: Flow;
  events: Event[];
  education: EducationProgress;
  calculator: CalculatorProgress;
};


const STORAGE_KEY = "premium-onboarding-session-v1";


/* ======================================================
   DEFAULT SESSION (NO CALC LOGIC)
====================================================== */
function createDefaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    flow: "education",
    events: [],
    education: {
      startedAt: Date.now(),
      completed: false,
      learned: [
        "Cleanup time quietly drains paid labor.",
        "Messy sites increase safety and closeout risk.",
        "Appearance impacts trust, bids, and referrals.",
      ],
    },
    calculator: {
      step: 1,
      completed: false,
      totalLoss: undefined,
    },
  };
}


/* ======================================================
   SAFE HYDRATION
====================================================== */
function hydrateSession(raw: any): SessionState {
  const d = createDefaultSession();
  if (!raw || typeof raw !== "object") return d;


  return {
    startedAt: typeof raw.startedAt === "number" ? raw.startedAt : d.startedAt,
    flow: raw.flow === "education" || raw.flow === "calculator" ? raw.flow : d.flow,
    events: Array.isArray(raw.events) ? raw.events : d.events,
    education: { ...d.education, ...(raw.education || {}) },
    calculator: { ...d.calculator, ...(raw.calculator || {}) },
  };
}


/* ======================================================
   COMPONENT
====================================================== */
export default function PremiumOnboarding() {
  const [session, setSession] = useState<SessionState>(createDefaultSession);


  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(hydrateSession(JSON.parse(raw)));
    } catch {}
  }, []);


  /* ---------- SAVE ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);


  /* ---------- TRACKING ---------- */
  function track(event: string, payload?: any) {
    setSession((s) => ({
      ...s,
      events: [
        ...s.events,
        {
          event: payload ? `${event}:${JSON.stringify(payload)}` : event,
          at: Date.now(),
        },
      ],
    }));
  }


  /* ======================================================
     DERIVED DISPLAY (READ-ONLY)
  ====================================================== */
  const educationBullets = session.education.learned ?? [];


  const calculatorBullets = useMemo(() => {
    if (session.calculator.totalLoss != null) {
      return [
        `Estimated hidden cost: $${Math.round(
          session.calculator.totalLoss
        ).toLocaleString()}/mo`,
      ];
    }
    return [
      "Hidden labor waste not yet quantified.",
      "Cleanup cost likely underestimated.",
    ];
  }, [session.calculator.totalLoss]);


  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gap: 28 }}>
        <h1 style={{ fontSize: 38, fontWeight: 800 }}>
          Understand Your Hidden Cleanup Costs
        </h1>


        {/* ===== EDUCATION CARD ===== */}
        <FlowCard
          title="Why Cleanup Quietly Costs More Than You Think"
          stepLabel={`Education`}
          bullets={educationBullets.map((b) => ({ ok: false, text: b }))}
          progress={`1 / 2`}
        >
          <EducationFlow
            session={session}
            setSession={setSession}
            track={track}
            goCalculator={() =>
              setSession((s) => ({ ...s, flow: "calculator" }))
            }
          />
        </FlowCard>


        {/* ===== CALCULATOR CARD ===== */}
        <FlowCard
          title="Calculate Your Real Cleanup Cost"
          stepLabel={`Step ${session.calculator.step ?? 1}`}
          bullets={calculatorBullets.map((b) => ({
            ok: session.calculator.totalLoss != null,
            text: b,
          }))}
          progress={`${session.calculator.step ?? 1} / 5`}
        >
          <Cleanup25xDemo
            session={session}
            setSession={setSession}
            track={track}
            goEducation={() =>
              setSession((s) => ({ ...s, flow: "education" }))
            }
          />
        </FlowCard>
      </div>
    </div>
  );
}


/* ======================================================
   FLOW CARD (UI ONLY)
====================================================== */
function FlowCard({
  title,
  stepLabel,
  bullets,
  progress,
  children,
}: {
  title: string;
  stepLabel: string;
  bullets: { ok: boolean; text: string }[];
  progress: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 18,
        padding: 24,
        background: "rgba(2,6,23,0.85)",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h2>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{progress}</div>
      </div>


      <div style={{ fontSize: 13, opacity: 0.85 }}>{stepLabel}</div>


      <ul style={{ paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 10 }}>
            <span style={{ color: b.ok ? "#22c55e" : "#ef4444" }}>
              {b.ok ? "✔" : "✕"}
            </span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>


      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}


