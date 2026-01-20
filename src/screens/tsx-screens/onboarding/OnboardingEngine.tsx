"use client";
import React, { useEffect, useMemo, useState } from "react";


/* ======================================================
   FILE: PremiumOnboarding-OneFile.tsx
   GOAL:
   - One file
   - Two cards always visible (no navigation between screens)
   - Each card owns its own question flow
   - Only ONE question visible in each card at a time
   - Each answer appends ONE new line to that card’s list (✔ / ✖)
   - Global session state + click tracking on the right (sticky)
====================================================== */


/* ======================================================
   1) GLOBAL SESSION + TRACKING (keep stable)
====================================================== */
type Event = { event: string; at: number };


type SessionState = {
  startedAt: number;
  events: Event[];
  // Optional rollups (safe; not required for UI)
  calcA?: {
    monthlyLoss?: number;
    delayLoss?: number;
  };
};


const STORAGE_KEY = "premium-onboarding-onefile-v1";


function createDefaultSession(): SessionState {
  return {
    startedAt: Date.now(),
    events: [],
    calcA: {},
  };
}


function hydrateSession(raw: any): SessionState {
  const d = createDefaultSession();
  if (!raw || typeof raw !== "object") return d;
  return {
    startedAt: typeof raw.startedAt === "number" ? raw.startedAt : d.startedAt,
    events: Array.isArray(raw.events) ? raw.events : d.events,
    calcA: typeof raw.calcA === "object" && raw.calcA ? raw.calcA : d.calcA,
  };
}


/* ======================================================
   2) ROOT (composition + layout)
====================================================== */
export default function PremiumOnboardingOneFile() {
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


  /* ---------- TRACK ---------- */
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


  /* ---------- OPTIONAL ROLLUP SETTERS (safe) ---------- */
  function setMonthlyLoss(monthlyLoss: number) {
    setSession((s) => ({
      ...s,
      calcA: { ...(s.calcA || {}), monthlyLoss },
    }));
  }


  function setDelayLoss(delayLoss: number) {
    setSession((s) => ({
      ...s,
      calcA: { ...(s.calcA || {}), delayLoss },
    }));
  }


  const status = useMemo(() => {
    const monthlyLoss = session.calcA?.monthlyLoss;
    const delayLoss = session.calcA?.delayLoss;
    const total =
      (typeof monthlyLoss === "number" ? monthlyLoss : 0) +
      (typeof delayLoss === "number" ? delayLoss : 0);


    return {
      started: session.startedAt,
      events: session.events,
      monthlyLoss,
      delayLoss,
      total: total > 0 ? total : undefined,
    };
  }, [session]);


  return (
    <div style={page}>
      <div style={main}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <h1 style={h1}>Find Your Real Cleanup Cost</h1>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              Two cards. One question per card at a time. Each answer adds one
              line and auto-advances.
            </div>
          </div>


          {/* TWO CARDS ALWAYS VISIBLE */}
          <div style={twoCards}>
            <CalculatorCard
              track={track}
              setMonthlyLoss={setMonthlyLoss}
              setDelayLoss={setDelayLoss}
            />
            <WalkthroughCard track={track} />
          </div>
        </div>
      </div>


      {/* RIGHT SIDEBAR (global tracking) */}
      <aside style={aside}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Started: {new Date(status.started).toLocaleTimeString()}
        </div>


        <div style={{ marginTop: 10, fontSize: 13 }}>
          <strong>Monthly loss:</strong>{" "}
          {typeof status.monthlyLoss === "number"
            ? `$${Math.round(status.monthlyLoss).toLocaleString()}/mo`
            : "—"}
        </div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>Delay loss:</strong>{" "}
          {typeof status.delayLoss === "number"
            ? `$${Math.round(status.delayLoss).toLocaleString()}/mo`
            : "—"}
        </div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>Total:</strong>{" "}
          {typeof status.total === "number"
            ? `$${Math.round(status.total).toLocaleString()}/mo`
            : "—"}
        </div>


        <hr style={hr} />


        <div style={{ fontSize: 12, fontWeight: 800 }}>Interaction Log</div>
        <div style={logBox}>
          {status.events.length === 0 ? (
            <div>No events yet.</div>
          ) : (
            status.events
              .slice(-80)
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
   3) CARD A — CALCULATOR CARD (real inputs + real math)
   Rules:
   - only one question visible
   - each answer adds one line
   - auto-advance
====================================================== */


type CalcLine = { kind: "ok" | "no"; text: string };


function CalculatorCard({
  track,
  setMonthlyLoss,
  setDelayLoss,
}: {
  track: (event: string, payload?: any) => void;
  setMonthlyLoss: (n: number) => void;
  setDelayLoss: (n: number) => void;
}) {
  // Flow state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lines, setLines] = useState<CalcLine[]>([]);


  // Inputs (defaults)
  const [crewSize, setCrewSize] = useState(5);
  const [wage, setWage] = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(45);


  const [employeesTouchingCleanup, setEmployeesTouchingCleanup] =
    useState<number>(2);
  const [cleanupHoursPerDay, setCleanupHoursPerDay] = useState<number>(1);


  function appendLine(kind: "ok" | "no", text: string) {
    setLines((l) => [...l, { kind, text }]);
  }


  function calcMonthlyLoss() {
    // Simple, understandable: employees doing cleanup * wage * hours/day * workdays/month
    const daysPerMonth = 22;
    const loss =
      employeesTouchingCleanup * wage * cleanupHoursPerDay * daysPerMonth;


    setMonthlyLoss(loss);
    track("calc.monthly_loss", {
      employeesTouchingCleanup,
      wage,
      cleanupHoursPerDay,
      daysPerMonth,
      loss,
    });


    appendLine(
      "no",
      `Estimated cleanup labor waste: $${Math.round(loss).toLocaleString()}/mo`
    );


    setStep(2);
  }


  function calcDelayLoss(answer: boolean) {
    // Delay loss based on minutes/day of downstream waiting * crew size * wage
    const daysPerMonth = 22;
    const hours = minutesPerDay / 60;
    const loss = crewSize * wage * hours * daysPerMonth;


    setDelayLoss(loss);
    track("calc.delay_loss", {
      answer,
      crewSize,
      wage,
      minutesPerDay,
      daysPerMonth,
      loss,
    });


    if (answer) {
      appendLine(
        "no",
        `Downstream delay cost: $${Math.round(loss).toLocaleString()}/mo`
      );
    } else {
      appendLine("ok", "No downstream delay cost reported.");
    }


    setStep(3);
  }


  return (
    <div style={card}>
      <div style={cardHeader}>
        <div>
          <div style={cardTitle}>Calculate Your Actual Costs</div>
          <div style={cardSub}>
            One question at a time. Each answer adds one line.
          </div>
        </div>
        <div style={pill}>Step {step} of 3</div>
      </div>


      {/* Results list grows by one line per answer */}
      <div style={{ marginTop: 10 }}>
        {lines.length === 0 ? (
          <div style={emptyHint}>No results yet — answer the first question.</div>
        ) : (
          <ul style={list}>
            {lines.map((l, i) => (
              <li key={i} style={lineItem}>
                <span style={l.kind === "ok" ? ok : no}>
                  {l.kind === "ok" ? "✔" : "✖"}
                </span>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>


      <hr style={{ ...hr, margin: "14px 0" }} />


      {/* ONE QUESTION VISIBLE */}
      {step === 1 && (
        <div style={qBox}>
          <div style={qTitle}>How much paid labor is spent on cleanup daily?</div>


          <div style={grid2}>
            <Field
              label="Employees touching cleanup"
              value={employeesTouchingCleanup}
              onChange={setEmployeesTouchingCleanup}
              min={0}
              step={1}
            />
            <Field
              label="Cleanup hours per day"
              value={cleanupHoursPerDay}
              onChange={setCleanupHoursPerDay}
              min={0}
              step={0.25}
            />
            <Field
              label="Hourly wage ($)"
              value={wage}
              onChange={setWage}
              min={0}
              step={1}
            />
            <div />
          </div>


          <button
            style={btnPrimary}
            onClick={() => {
              track("calc.step1_submit");
              calcMonthlyLoss();
            }}
          >
            Calculate →
          </button>
        </div>
      )}


      {step === 2 && (
        <div style={qBox}>
          <div style={qTitle}>
            Does cleanup delay the next task for the crew?
          </div>


          <div style={grid2}>
            <Field
              label="Crew size affected"
              value={crewSize}
              onChange={setCrewSize}
              min={0}
              step={1}
            />
            <Field
              label="Delay minutes per day"
              value={minutesPerDay}
              onChange={setMinutesPerDay}
              min={0}
              step={5}
            />
            <Field
              label="Hourly wage ($)"
              value={wage}
              onChange={setWage}
              min={0}
              step={1}
            />
            <div />
          </div>


          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={btnGhost}
              onClick={() => {
                track("calc.step2_answer", { value: true });
                calcDelayLoss(true);
              }}
            >
              Yes
            </button>
            <button
              style={btnGhost}
              onClick={() => {
                track("calc.step2_answer", { value: false });
                calcDelayLoss(false);
              }}
            >
              No
            </button>
          </div>
        </div>
      )}


      {step === 3 && (
        <div style={qBox}>
          <div style={qTitle}>Calculator complete.</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            You can keep going later (add more steps), but this proves the
            pattern: real inputs → real math → one new line → auto-advance.
          </div>
        </div>
      )}
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  step: number;
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={input}
      />
    </label>
  );
}


/* ======================================================
   4) CARD B — WALKTHROUGH (checks + Xs)
   - Two questions (per your request)
   - One visible at a time
   - Each answer adds one line
   - Auto-advance
====================================================== */


type EduLine = { kind: "ok" | "no"; text: string };


function WalkthroughCard({
  track,
}: {
  track: (event: string, payload?: any) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lines, setLines] = useState<EduLine[]>([]);


  function appendLine(kind: "ok" | "no", text: string) {
    setLines((l) => [...l, { kind, text }]);
  }


  function answer(qKey: string, yes: boolean) {
    track("edu.answer", { qKey, yes });


    // Each answer produces ONE concise line (✔/✖)
    if (qKey === "safety") {
      appendLine(
        yes ? "no" : "ok",
        yes
          ? "Safety risk exists when cleanup is inconsistent."
          : "You believe safety risk is minimal from cleanup."
      );
      setStep(2);
      return;
    }


    if (qKey === "trust") {
      appendLine(
        yes ? "no" : "ok",
        yes
          ? "Appearance impacts client trust and closeout perception."
          : "You believe appearance has minimal client impact."
      );
      setStep(3);
      return;
    }
  }


  return (
    <div style={card}>
      <div style={cardHeader}>
        <div>
          <div style={cardTitle}>Why This Is Costing You</div>
          <div style={cardSub}>
            Quick diagnosis. One question at a time.
          </div>
        </div>
        <div style={pill}>Step {step} of 3</div>
      </div>


      <div style={{ marginTop: 10 }}>
        {lines.length === 0 ? (
          <div style={emptyHint}>No insights yet — answer the first question.</div>
        ) : (
          <ul style={list}>
            {lines.map((l, i) => (
              <li key={i} style={lineItem}>
                <span style={l.kind === "ok" ? ok : no}>
                  {l.kind === "ok" ? "✔" : "✖"}
                </span>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>


      <hr style={{ ...hr, margin: "14px 0" }} />


      {step === 1 && (
        <div style={qBox}>
          <div style={qTitle}>Does cleanup affect jobsite safety?</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnGhost} onClick={() => answer("safety", true)}>
              Yes
            </button>
            <button style={btnGhost} onClick={() => answer("safety", false)}>
              No
            </button>
          </div>
        </div>
      )}


      {step === 2 && (
        <div style={qBox}>
          <div style={qTitle}>Does appearance impact client trust?</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnGhost} onClick={() => answer("trust", true)}>
              Yes
            </button>
            <button style={btnGhost} onClick={() => answer("trust", false)}>
              No
            </button>
          </div>
        </div>
      )}


      {step === 3 && (
        <div style={qBox}>
          <div style={qTitle}>All questions complete.</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Add more questions later by extending the same pattern.
          </div>
        </div>
      )}
    </div>
  );
}


/* ======================================================
   5) STYLES (safe, local)
====================================================== */


const page: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 24,
  padding: 16,
  background:
    "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
  color: "#e5e7eb",
  fontFamily: "system-ui, sans-serif",
};


const main: React.CSSProperties = {
  maxWidth: 980,
  width: "100%",
  margin: "0 auto",
};


const twoCards: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  alignItems: "start",
};


const aside: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: 14,
  padding: 16,
  height: "fit-content",
  position: "sticky",
  top: 16,
};


const card: React.CSSProperties = {
  background: "rgba(2,6,23,0.8)",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 16,
};


const cardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};


const cardTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: 0.2,
};


const cardSub: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  marginTop: 4,
};


const pill: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "rgba(2,6,23,0.9)",
  whiteSpace: "nowrap",
};


const h1: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 900,
  margin: 0,
};


const hr: React.CSSProperties = {
  margin: "12px 0",
  opacity: 0.2,
  border: "none",
  borderTop: "1px solid rgba(148,163,184,0.35)",
};


const list: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 8,
};


const lineItem: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  lineHeight: 1.25,
  fontSize: 13,
};


const ok: React.CSSProperties = {
  display: "inline-block",
  width: 18,
  opacity: 0.9,
};


const no: React.CSSProperties = {
  display: "inline-block",
  width: 18,
  opacity: 0.9,
};


const emptyHint: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.7,
};


const qBox: React.CSSProperties = {
  display: "grid",
  gap: 12,
};


const qTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  opacity: 0.95,
};


const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};


const input: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "#020617",
  color: "#e5e7eb",
  outline: "none",
};


const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "#0b1220",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 800,
  width: "fit-content",
};


const btnGhost: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 800,
};


const logBox: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.78,
  marginTop: 8,
  maxHeight: 360,
  overflowY: "auto",
  border: "1px solid rgba(51,65,85,0.5)",
  borderRadius: 10,
  padding: 10,
};


