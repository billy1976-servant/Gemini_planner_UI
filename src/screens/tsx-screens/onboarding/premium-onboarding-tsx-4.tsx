"use client";
import React, { useEffect, useState } from "react";


/* ======================================================
   CONFIG — EDIT HERE ONLY
====================================================== */


const STEPS = [
  {
    id: "employees",
    question: "Do your crews spend time cleaning job sites daily?",
    yesOutcome: {
      status: "bad",
      text: "Daily cleanup by skilled crews quietly drains paid labor time.",
    },
    noOutcome: {
      status: "good",
      text: "You’ve already reduced unnecessary labor drain.",
    },
  },
  {
    id: "confusion",
    question: "Does cleanup responsibility cause confusion or delays?",
    yesOutcome: {
      status: "bad",
      text: "Unclear cleanup roles slow close-out and increase rework risk.",
    },
    noOutcome: {
      status: "good",
      text: "Clear responsibility keeps jobs moving on schedule.",
    },
  },
  {
    id: "appearance",
    question: "Have messy sites ever hurt client trust or bids?",
    yesOutcome: {
      status: "bad",
      text: "Site appearance directly affects confidence, referrals, and bids.",
    },
    noOutcome: {
      status: "good",
      text: "Your presentation protects trust and perceived professionalism.",
    },
  },
  {
    id: "safety",
    question: "Do cluttered sites increase safety or OSHA exposure?",
    yesOutcome: {
      status: "bad",
      text: "Clutter raises accident risk and compliance exposure.",
    },
    noOutcome: {
      status: "good",
      text: "Clean sites reduce liability and safety incidents.",
    },
  },
  {
    id: "morale",
    question: "Does cleanup negatively affect crew morale?",
    yesOutcome: {
      status: "bad",
      text: "Morale drops when skilled workers feel misused.",
    },
    noOutcome: {
      status: "good",
      text: "Your crews stay focused on high-value work.",
    },
  },
];


/* ======================================================
   TYPES
====================================================== */


type Answer = "yes" | "no";


type StepResult = {
  answer?: Answer;
};


type SessionState = {
  stepIndex: number;
  results: Record<string, StepResult>;
};


const STORAGE_KEY = "cleanup-onboarding-progress-v1";


/* ======================================================
   COMPONENT
====================================================== */


export default function PremiumOnboarding() {
  const [session, setSession] = useState<SessionState>({
    stepIndex: 0,
    results: {},
  });


  /* ---------- LOAD ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);


  /* ---------- SAVE ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);


  function answerStep(id: string, answer: Answer) {
    setSession((s) => ({
      ...s,
      results: {
        ...s.results,
        [id]: { answer },
      },
    }));
  }


  function continueNext() {
    setSession((s) => ({
      ...s,
      stepIndex: Math.min(s.stepIndex + 1, STEPS.length),
    }));
  }


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
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>
          Understand Your Hidden Cleanup Costs
        </h1>
        <p style={{ opacity: 0.85, marginTop: 8 }}>
          Each step reveals what’s quietly costing time, money, or risk.
        </p>


        {/* ================== STEPS ================== */}
        {STEPS.slice(0, session.stepIndex + 1).map((step, i) => {
          const result = session.results[step.id];
          const outcome =
            result?.answer === "yes"
              ? step.yesOutcome
              : result?.answer === "no"
              ? step.noOutcome
              : null;


          return (
            <div
              key={step.id}
              style={{
                marginTop: 28,
                padding: 24,
                borderRadius: 16,
                border: "1px solid #334155",
                background: "rgba(2,6,23,0.75)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                Step {i + 1} of {STEPS.length}
              </div>


              <h2 style={{ fontSize: 22, marginTop: 8 }}>
                {step.question}
              </h2>


              {!result && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    style={choiceBtn}
                    onClick={() => answerStep(step.id, "yes")}
                  >
                    Yes
                  </button>
                  <button
                    style={choiceBtn}
                    onClick={() => answerStep(step.id, "no")}
                  >
                    No
                  </button>
                </div>
              )}


              {outcome && (
                <>
                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 22 }}>
                      {outcome.status === "good" ? "✅" : "❌"}
                    </div>
                    <div style={{ fontSize: 15 }}>{outcome.text}</div>
                  </div>


                  {i === session.stepIndex && (
                    <button
                      onClick={continueNext}
                      style={{ ...primaryBtn, marginTop: 18 }}
                    >
                      Continue →
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}


        {/* ================== END ================== */}
        {session.stepIndex >= STEPS.length && (
          <div
            style={{
              marginTop: 32,
              padding: 28,
              borderRadius: 18,
              border: "1px solid #16a34a",
              background: "rgba(2,6,23,0.85)",
            }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>
              You’re Ready for the Numbers
            </h2>
            <p style={{ marginTop: 10, opacity: 0.85 }}>
              Now that you see where time, money, and risk leak out, the next
              step is calculating real monthly impact.
            </p>
            <button style={{ ...primaryBtn, marginTop: 18 }}>
              Calculate My Actual Costs →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ======================================================
   STYLES
====================================================== */


const choiceBtn: React.CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
};


const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid #16a34a",
  background: "#020617",
  color: "#bbf7d0",
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 700,
};


