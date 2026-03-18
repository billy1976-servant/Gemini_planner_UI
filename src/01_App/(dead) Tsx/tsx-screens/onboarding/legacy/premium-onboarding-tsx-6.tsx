"use client";
import React, { useEffect, useMemo, useState } from "react";


/* ======================================================
   TYPES — DO NOT CHANGE
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
   DEFAULT SESSION
====================================================== */
function createDefaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    flow: "chooser",
    events: [],
    education: {
      startedAt: Date.now(),
      completed: false,
      learned: [],
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
  function track(event: string) {
    setSession((s) => ({
      ...s,
      events: [...s.events, { event, at: Date.now() }],
    }));
  }


  /* ======================================================
     STATUS
  ====================================================== */
  const status = useMemo(() => {
    return {
      step: session.calculator.step ?? 1,
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
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 24 }}>
          Find Your Real Cleanup Cost
        </h1>


        {/* =======================
            INLINE CARD SECTION
            (THIS IS THE ONLY PART
             YOU WILL EDIT LATER)
        ======================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <InlineCardFlow
            title="Calculate Your Actual Costs"
            questions={[
              "Do crews clean at the end of every job?",
              "Does cleanup delay the next task?",
              "Do supervisors redo missed cleanup?",
            ]}
            onAnswer={(text, value) => {
              track(`calculator.answer:${text}:${value}`);
              setSession((s) => ({
                ...s,
                calculator: {
                  ...s.calculator,
                  step: (s.calculator.step ?? 1) + 1,
                },
              }));
            }}
          />


          <InlineCardFlow
            title="Why This Is Costing You"
            questions={[
              "Does cleanup affect jobsite safety?",
              "Does appearance impact client trust?",
              "Do messy sites increase OSHA risk?",
            ]}
            onAnswer={(text, value) => {
              track(`education.answer:${text}:${value}`);
            }}
          />
        </div>
      </div>


      {/* STATUS / LOG */}
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
          <strong>Step:</strong> {status.step}
        </div>


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
   INLINE CARD FLOW (ISOLATED)
====================================================== */
function InlineCardFlow({
  title,
  questions,
  onAnswer,
}: {
  title: string;
  questions: string[];
  onAnswer: (q: string, value: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<
    { text: string; value: boolean }[]
  >([]);


  const current = questions[index];


  function answer(value: boolean) {
    const text = current;
    setResults((r) => [...r, { text, value }]);
    onAnswer(text, value);
    setIndex((i) => i + 1);
  }


  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 14,
        padding: 20,
        background: "rgba(2,6,23,0.8)",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>


      {/* RESULTS */}
      <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
        {results.map((r, i) => (
          <div key={i} style={{ fontSize: 13 }}>
            {r.value ? "✓" : "✕"} {r.text}
          </div>
        ))}
      </div>


      {/* QUESTION */}
      {current && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>{current}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={smallBtn} onClick={() => answer(true)}>
              Yes
            </button>
            <button style={smallBtn} onClick={() => answer(false)}>
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ======================================================
   STYLES
====================================================== */
const smallBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
};


