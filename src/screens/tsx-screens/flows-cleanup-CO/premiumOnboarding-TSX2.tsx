"use client";
import React, { useEffect, useMemo, useState } from "react";
import Calculator from "@/screens/tsx-screens/flows-cleanup-CO/calculator";
import Education from "@/screens/tsx-screens/flows-cleanup-CO/education";


type FlowId = "education" | "calculator";


type Event = {
  event: string;
  at: number;
  payload?: any;
};


type SessionState = {
  startedAt: number;
  activeFlow: FlowId;
  events: Event[];
  flows: {
    education: {
      step: number;
      completed: boolean;
      learned: string[];
    };
    calculator: {
      step: number;
      completed: boolean;
      answers: Record<string, boolean>;
      totalLoss?: number;
    };
  };
};


const STORAGE_KEY = "onboarding-session-stable-v3";


function defaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    activeFlow: "education",
    events: [],
    flows: {
      education: {
        step: 1,
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
        answers: {},
        totalLoss: undefined,
      },
    },
  };
}


function coerceSession(raw: any): SessionState {
  const d = defaultSession();
  const s = raw && typeof raw === "object" ? raw : {};


  const flows = s.flows && typeof s.flows === "object" ? s.flows : {};
  const edu = flows.education && typeof flows.education === "object" ? flows.education : {};
  const calc = flows.calculator && typeof flows.calculator === "object" ? flows.calculator : {};


  return {
    startedAt: typeof s.startedAt === "number" ? s.startedAt : d.startedAt,
    activeFlow: s.activeFlow === "education" || s.activeFlow === "calculator" ? s.activeFlow : d.activeFlow,
    events: Array.isArray(s.events) ? s.events : d.events,
    flows: {
      education: {
        step: typeof edu.step === "number" ? edu.step : d.flows.education.step,
        completed: typeof edu.completed === "boolean" ? edu.completed : d.flows.education.completed,
        learned: Array.isArray(edu.learned) ? edu.learned : d.flows.education.learned,
      },
      calculator: {
        step: typeof calc.step === "number" ? calc.step : d.flows.calculator.step,
        completed: typeof calc.completed === "boolean" ? calc.completed : d.flows.calculator.completed,
        answers: calc.answers && typeof calc.answers === "object" ? calc.answers : d.flows.calculator.answers,
        totalLoss: typeof calc.totalLoss === "number" ? calc.totalLoss : d.flows.calculator.totalLoss,
      },
    },
  };
}


export default function PremiumOnboarding() {
  const [session, setSession] = useState<SessionState>(defaultSession);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(coerceSession(JSON.parse(raw)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);


  function track(event: string, payload?: any) {
    setSession((s) => ({
      ...s,
      events: [...s.events, { event, payload, at: Date.now() }],
    }));
  }


  function go(flow: FlowId) {
    track("nav.to_flow", { from: session.activeFlow, to: flow });
    setSession((s) => ({ ...s, activeFlow: flow }));
  }


  const sidebar = useMemo(() => {
    const e = session.flows.education;
    const c = session.flows.calculator;
    return {
      education: {
        step: e.step,
        label: e.completed ? "Review education" : "Continue education",
      },
      calculator: {
        step: c.step,
        label: c.completed ? "Review calculator" : "Continue calculator",
      },
    };
  }, [session.flows.education, session.flows.calculator]);


  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, padding: 16 }}>
      <div>
        {session.activeFlow === "education" && (
          <Education session={session} setSession={setSession} track={track} goCalculator={() => go("calculator")} />
        )}


        {session.activeFlow === "calculator" && (
          <Calculator session={session} setSession={setSession} track={track} goEducation={() => go("education")} />
        )}
      </div>


      <aside style={{ border: "1px solid #334155", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Started: {new Date(session.startedAt).toLocaleTimeString()}
        </div>


        <div
          onClick={() => go("education")}
          style={{ cursor: "pointer", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}
        >
          <div style={{ fontWeight: 700 }}>Education</div>
          <div>Step {sidebar.education.step}</div>
          <div style={{ opacity: 0.85 }}>{sidebar.education.label}</div>
        </div>


        <div
          onClick={() => go("calculator")}
          style={{ cursor: "pointer", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 14 }}
        >
          <div style={{ fontWeight: 700 }}>Calculator</div>
          <div>Step {sidebar.calculator.step}</div>
          <div style={{ opacity: 0.85 }}>{sidebar.calculator.label}</div>
        </div>


        <div style={{ fontSize: 12, fontWeight: 700 }}>Interaction Log</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            opacity: 0.85,
            maxHeight: 260,
            overflowY: "auto",
            border: "1px solid rgba(51,65,85,0.6)",
            borderRadius: 10,
            padding: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {session.events.length === 0 ? (
            <div>No events yet.</div>
          ) : (
            session.events
              .slice(-80)
              .reverse()
              .map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {new Date(e.at).toLocaleTimeString()} — {e.event}
                  {e.payload ? `\n${JSON.stringify(e.payload, null, 0)}` : ""}
                </div>
              ))
          )}
        </div>


        <button
          style={{ width: "100%", marginTop: 12, padding: 10, cursor: "pointer" }}
          onClick={() => {
            track("session.reset");
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            location.reload();
          }}
        >
          Reset Session
        </button>
      </aside>
    </div>
  );
}


