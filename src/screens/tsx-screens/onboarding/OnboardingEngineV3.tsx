"use client";
import React, { useState } from "react";


/* ======================================================
   GLOBAL SESSION + TRACKING (PURE, STABLE)
====================================================== */
type Event = { event: string; at: number };


function useSession() {
  const [events, setEvents] = useState<Event[]>([]);
  function track(event: string) {
    setEvents((e) => [...e, { event, at: Date.now() }]);
  }
  return { events, track };
}


/* ======================================================
   CARD 1 — CLEANUP COST CALCULATOR (REAL MATH)
====================================================== */
function CleanupCalculator({ track }: { track: (e: string) => void }) {
  const [employees, setEmployees] = useState(2);
  const [wage, setWage] = useState(30);
  const [hours, setHours] = useState(1);
  const [loss, setLoss] = useState<number | null>(null);


  function calculate() {
    const monthly = employees * wage * hours * 22;
    setLoss(monthly);
    track(`calc.loss:${monthly}`);
  }


  return (
    <div style={card}>
      <h2>Cleanup Cost Calculator</h2>


      <label>Employees</label>
      <input type="number" value={employees} onChange={(e) => setEmployees(+e.target.value)} />


      <label>Hourly Wage ($)</label>
      <input type="number" value={wage} onChange={(e) => setWage(+e.target.value)} />


      <label>Cleanup Hours / Day</label>
      <input type="number" value={hours} onChange={(e) => setHours(+e.target.value)} />


      <button onClick={calculate}>Calculate</button>


      {loss !== null && (
        <div style={{ marginTop: 12 }}>
          <strong>Estimated Monthly Loss:</strong>
          <div style={{ fontSize: 24 }}>${loss.toLocaleString()}</div>
          <div style={{ opacity: 0.7 }}>
            Average contractors lose this quietly every month.
          </div>
        </div>
      )}
    </div>
  );
}


/* ======================================================
   CARD 2 — EDUCATION / DIAGNOSIS (INDEPENDENT)
====================================================== */
function EducationCard({ track }: { track: (e: string) => void }) {
  const points = [
    "Cleanup time silently drains profit",
    "Mess increases safety risk",
    "Appearance affects bids and referrals",
    "Delays compound downstream costs",
  ];
  const [step, setStep] = useState(0);


  function next() {
    track(`edu.step:${step}`);
    setStep(step + 1);
  }


  return (
    <div style={card}>
      <h2>Why This Matters</h2>


      <ul>
        {points.slice(0, step).map((p, i) => (
          <li key={i}>✔ {p}</li>
        ))}
      </ul>


      {step < points.length ? (
        <button onClick={next}>Next</button>
      ) : (
        <strong>✔ Education Complete</strong>
      )}
    </div>
  );
}


/* ======================================================
   SIDEBAR — GLOBAL STATE VISIBILITY
====================================================== */
function Sidebar({ events }: { events: Event[] }) {
  return (
    <div style={sidebar}>
      <h3>Interaction Log</h3>
      {events.length === 0 && <div>No activity yet</div>}
      {events.slice().reverse().map((e, i) => (
        <div key={i} style={{ fontSize: 12 }}>
          {new Date(e.at).toLocaleTimeString()} — {e.event}
        </div>
      ))}
    </div>
  );
}


/* ======================================================
   ROOT COMPOSITION — SAFE, EDITABLE
====================================================== */
export default function CleanupCostDemo() {
  const { events, track } = useSession();


  return (
    <div style={layout}>
      <div>
        {/* DELETE OR EDIT ANY CARD HERE — NO COLLAPSE */}
        <CleanupCalculator track={track} />
        <EducationCard track={track} />
      </div>
      <Sidebar events={events} />
    </div>
  );
}


/* ======================================================
   STYLES — PURE PRESENTATION
====================================================== */
const layout: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 24,
  padding: 24,
  fontFamily: "system-ui",
};


const card: React.CSSProperties = {
  padding: 20,
  marginBottom: 20,
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#ffffff",
};


const sidebar: React.CSSProperties = {
  padding: 20,
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#f8fafc",
};


