"use client";
import React, { useEffect, useMemo, useState } from "react";
import Cleanup25xDemo from "@/apps-tsx/tsx-screens/calculators/calculator-1";
import EducationFlow from "@/apps-tsx/tsx-screens/calculators/Education-flow";


/* ======================================================
   TYPES — WRAPPER OWNS SHAPE ONLY
====================================================== */
type Flow = "chooser" | "education" | "calculator";


type Event = {
  event: string;
  at: number;
};


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
    flow: "chooser",
    events: [],
    education: {
      startedAt: Date.now(),
      completed: false,
      learned: [
        "Cleanup time quietly drains profit daily.",
        "Clean sites reduce safety risk and improve trust.",
        "Appearance influences bids, referrals, and closeouts.",
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
    flow:
      raw.flow === "chooser" ||
      raw.flow === "education" ||
      raw.flow === "calculator"
        ? raw.flow
        : d.flow,
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


  function go(flow: Flow) {
    track(`nav.${session.flow}_to_${flow}`);
    setSession((s) => ({ ...s, flow }));
  }


  /* ======================================================
     READ-ONLY STATUS (NO MATH)
  ====================================================== */
  const status = useMemo(() => {
    return {
      flow: session.flow,
      educationComplete: session.education.completed === true,
      calculatorStep: session.calculator.step ?? "—",
      calculatorDone: session.calculator.completed === true,
      totalLoss: session.calculator.totalLoss,
    };
  }, [session]);


  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
        padding: 16,
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* MAIN */}
      <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        {/* ===== CHOOSER ===== */}
        {session.flow === "chooser" && (
          <div style={{ display: "grid", gap: 24 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800 }}>
              Find Your Real Cleanup Cost
            </h1>


            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              <ChoiceCard
                title="Calculate Your Actual Costs"
                body="Answer a few questions to uncover how much cleanup time is quietly draining every month."
                action="Start Calculator →"
                onClick={() => go("calculator")}
              />


              <ChoiceCard
                title="Learn Why This Matters"
                body="Understand why cleanup is ignored, how it affects safety, bids, and OSHA exposure."
                action="View Education →"
                onClick={() => go("education")}
              />
            </div>
          </div>
        )}


        {/* ===== EDUCATION ===== */}
        {session.flow === "education" && (
          <EducationFlow
            session={session}
            setSession={setSession}
            track={track}
            goCalculator={() => go("calculator")}
          />
        )}


        {/* ===== CALCULATOR ===== */}
        {session.flow === "calculator" && (
          <Cleanup25xDemo
            session={session}
            setSession={setSession}
            track={track}
            goEducation={() => go("education")}
          />
        )}
      </div>


      {/* STATUS / NAV */}
      <aside
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 16,
          height: "fit-content",
          position: "sticky",
          top: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Started: {new Date(session.startedAt).toLocaleTimeString()}
        </div>


        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Flow:</strong> {status.flow}
        </div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>Education:</strong>{" "}
          {status.educationComplete ? "Completed" : "In progress"}
        </div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>Calculator step:</strong> {status.calculatorStep}
        </div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>Total:</strong>{" "}
          {status.totalLoss != null
            ? `$${Math.round(status.totalLoss).toLocaleString()}/mo`
            : "—"}
        </div>


        <hr style={{ margin: "14px 0", opacity: 0.2 }} />


        <button style={btn} onClick={() => go("chooser")}>
          ⬅ Back to choices
        </button>
        <button style={btn} onClick={() => go("education")}>
          📘 Education
        </button>
        <button style={btn} onClick={() => go("calculator")}>
          🔢 Calculator
        </button>


        <hr style={{ margin: "14px 0", opacity: 0.2 }} />


        <div style={{ fontSize: 12, fontWeight: 700 }}>Interaction Log</div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.75,
            marginTop: 8,
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: 10,
            padding: 10,
          }}
        >
          {session.events.length === 0 ? (
            <div>No events yet.</div>
          ) : (
            session.events
              .slice(-50)
              .reverse()
              .map((e, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  {new Date(e.at).toLocaleTimeString()} — {e.event}
                </div>
              ))
          )}
        </div>
      </aside>
    </div>
  );
}


/* ======================================================
   CHOICE CARD
====================================================== */
function ChoiceCard({
  title,
  body,
  action,
  onClick,
}: {
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: 28,
        borderRadius: 16,
        border: "1px solid #334155",
        background: "rgba(2,6,23,0.8)",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h2>
      <p style={{ opacity: 0.85, marginTop: 10 }}>{body}</p>
      <div style={{ marginTop: 18, fontWeight: 600 }}>{action}</div>
    </div>
  );
}


/* ======================================================
   STYLES
====================================================== */
const btn: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
};


