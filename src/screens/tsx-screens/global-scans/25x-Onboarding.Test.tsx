"use client";


import { useState } from "react";
import { run25X } from "@/logic/engines/25x.engine";


export default function Onboarding25XWorking() {
  const [monthlyAdSpend, setMonthlyAdSpend] = useState("");
  const [result, setResult] = useState<any>(null);


  const config = {
    calculators: [
      { type: "adLift", multiplier: 1.15 }
    ],
    questions: [],
    flow: {
      thresholds: { scale: 70, pause: 30 }
    }
  };


  function run() {
    const res = run25X(config, {
      monthlyAdSpend: Number(monthlyAdSpend)
    });
    setResult(res);
  }


  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>25X Marketing Simulator</h2>


      <div style={{ marginBottom: 12 }}>
        <label>Monthly ad spend</label><br />
        <input
          type="number"
          value={monthlyAdSpend}
          onChange={e => setMonthlyAdSpend(e.target.value)}
        />
      </div>


      <button onClick={run}>Run 25X</button>


      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
