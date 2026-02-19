"use client";
import React, { useEffect, useMemo, useState } from "react";
import Cleanup25xDemo from "@/apps-tsx/tsx-screens/calculators/calculator-1";
import EducationFlow from "@/apps-tsx/tsx-screens/calculators/Education-flow";


type Flow = "education" | "calculator";


type Event = { event: string; at: number };


type EducationProgress = {
  startedAt?: number;
  completed?: boolean;
  learned?: string[]; // “reminder of what you learned”
};


type Calculator25xProgress = {
  step?: number;
  answers?: Record<string, boolean>;
  crewSize?: number;
  minutes?: number;
  wage?: number;
  totalLoss?: number;
  completed?: boolean;
};


type SessionState = {
  startedAt: number;
  flow: Flow;
  events: Event[];
  education?: EducationProgress;
  calc25x?: Calculator25xProgress;
};


const STORAGE_KEY = "premium-onboarding-session-v1";


export default function PremiumOnboarding() {
  const [session, setSession] = useState<SessionState>({
    startedAt: Date.now(),
    flow: "education",
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
    calc25x: {
      step: 1,
      answers: {},
      crewSize: 5,
      minutes: 45,
      wage: 20,
      totalLoss: undefined,
      completed: false,
    },
  });


  /* ========= LOAD ========= */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionState;
        if (parsed?.startedAt && parsed?.flow && parsed?.events) {
          setSession(parsed);
        }
      }
    } catch {}
  }, []);


  /* ========= SAVE ========= */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);


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


  /* ========= STATIONARY CARD CONTENT ========= */
  const card = useMemo(() => {
    const learned = session.education?.learned ?? [];
    const total = session.calc25x?.totalLoss;


    const headline =
      total != null
        ? `Current estimate: $${Math.round(total).toLocaleString()}/mo`
        : "Current estimate: Not calculated yet";


    const reminder =
      learned.length > 0 ? learned.slice(0, 3) : ["No reminders captured yet."];


    const nextAction =
      total != null
        ? "Continue: Find your next deepest cost"
        : "Continue: Calculate your first number";


    return { headline, reminder, nextAction };
  }, [session.education?.learned, session.calc25x?.totalLoss]);


  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* MAIN */}
      <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
        {session.flow === "education" && (
          <EducationFlow
            session={session}
            setSession={setSession}
            track={track}
            goCalculator={() => go("calculator")}
          />
        )}


        {session.flow === "calculator" && (
          <Cleanup25xDemo
            session={session}
            setSession={setSession}
            track={track}
            goEducation={() => go("education")}
          />
        )}
      </div>


      {/* STATIONARY STATUS CARD */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 16,
          position: "sticky",
          top: 16,
          height: "fit-content",
        }}
      >
        <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 10 }}>
          Started: {new Date(session.startedAt).toLocaleTimeString()}
        </div>


        <div
          style={{
            padding: 14,
            borderRadius: 12,
            border: "1px solid #334155",
            background: "rgba(2,6,23,0.6)",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.85 }}>Status</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
            {card.headline}
          </div>


          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            Reminder
          </div>
          <ul style={{ marginTop: 8, paddingLeft: 18, opacity: 0.9 }}>
            {card.reminder.map((x, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>
                {x}
              </li>
            ))}
          </ul>


          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
            {card.nextAction}
          </div>
        </div>


        <button style={btn} onClick={() => go("education")}>
          ↩ Education (resume)
        </button>


        <button style={btn} onClick={() => go("calculator")}>
          🔢 Calculator (resume)
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
              .slice(-60)
              .reverse()
              .map((e, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  {new Date(e.at).toLocaleTimeString()} — {e.event}
                </div>
              ))
          )}
        </div>


        <button
          style={{ ...btn, marginTop: 12, opacity: 0.9 }}
          onClick={() => {
            track("session.reset");
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
          }}
        >
          Reset Session (test only)
        </button>
      </div>
    </div>
  );
}


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


