"use client";
import React, { useEffect, useState } from "react";
import { runAction } from "@/logic/runtime/action-runner";
import { readEngineState, writeEngineState } from "@/logic/runtime/engine-bridge";

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

export function CalculatorCard({ onAdvance, onComplete, restoreState }: CardProps) {
  const [step, setStep] = useState(restoreState?.step ?? 1);
  const [answers, setAnswers] = useState<Record<string, boolean>>(
    restoreState?.data?.answers ?? {}
  );
  const [inputs, setInputs] = useState({
    crewSize: restoreState?.data?.crewSize ?? 5,
    minutes: restoreState?.data?.minutes ?? 45,
    wage: restoreState?.data?.wage ?? 20,
  });
  const [result, setResult] = useState<{ totalLoss?: number } | null>(
    restoreState?.data?.result ?? null
  );

  useEffect(() => {
    if (restoreState) {
      setStep(restoreState.step ?? 1);
      setAnswers(restoreState.data?.answers ?? {});
      setInputs({
        crewSize: restoreState.data?.crewSize ?? 5,
        minutes: restoreState.data?.minutes ?? 45,
        wage: restoreState.data?.wage ?? 20,
      });
      setResult(restoreState.data?.result ?? null);
    }
  }, [restoreState]);

  function goToStep(next: number) {
    setStep(next);
    onAdvance(next);
  }

  function answerQuestion(key: string, value: boolean) {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    goToStep(step + 1);
  }

  function updateInput(key: keyof typeof inputs, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function runCalculator() {
    const baseState = readEngineState() || {};
    const nextState = {
      ...baseState,
      calculatorInput: {
        hours: inputs.minutes / 60,
        hourlyWage: inputs.wage,
        crewSize: inputs.crewSize,
      },
      answers,
    };

    // Persist inputs before running
    writeEngineState(nextState);

    // Use existing logic engine via action runner
    runAction({ name: "logic:run25x" }, nextState);

    // Persist results after running
    writeEngineState(nextState);

    const after = readEngineState();
    const calculatorResult = after?.calculatorResult;

    if (calculatorResult) {
      const totalLoss = calculatorResult.totalLoss;
      const next = step + 1;
      goToStep(next);
      const out = {
        totalLoss,
        hours: calculatorResult.hours,
        wage: calculatorResult.wage,
        answers,
      };
      setResult({ totalLoss });
      onComplete({
        cardId: "calculator",
        completed: true,
        output: out,
      });
    }
  }

  return (
    <div>
      {step === 1 && (
        <>
          <p style={{ opacity: 0.85, marginBottom: 16 }}>
            Answer fast. You can leave and come back anytime — your progress stays.
          </p>
          <button onClick={() => goToStep(2)} style={primaryBtn}>
            Start 5-Question Scan
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h3>Do crews spend time cleaning daily?</h3>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            Typical: 30–60 minutes per tech per day.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answerQuestion("q1", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answerQuestion("q1", false)}>
              No
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h3>Have you lost client confidence from a messy site?</h3>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            Reminder: appearance + confusion can cost trust fast.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answerQuestion("q2", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answerQuestion("q2", false)}>
              No
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Is cleanup a recurring point of tension?</h3>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            Reminder: unclear cleanup roles create friction and delays.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answerQuestion("q3", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answerQuestion("q3", false)}>
              No
            </button>
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <h3>Would morale improve with clear cleanup support?</h3>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            Reminder: fairness in cleanup strongly affects morale.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answerQuestion("q4", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answerQuestion("q4", false)}>
              No
            </button>
          </div>
        </>
      )}

      {step === 6 && (
        <>
          <h3>Do clean sites help safety and referrals?</h3>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            Reminder: clean sites reduce hazards and improve perception.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answerQuestion("q5", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answerQuestion("q5", false)}>
              No
            </button>
          </div>
        </>
      )}

      {step === 7 && (
        <>
          <h2 style={{ marginTop: 18 }}>Calculate Monthly Cleanup Cost</h2>
          <div style={card}>
            <label style={lbl}>
              Crew Size
              <input
                style={input}
                type="number"
                value={inputs.crewSize}
                onChange={(e) => updateInput("crewSize", Number(e.target.value))}
              />
            </label>
            <label style={lbl}>
              Cleanup Minutes / Day
              <input
                style={input}
                type="number"
                value={inputs.minutes}
                onChange={(e) => updateInput("minutes", Number(e.target.value))}
              />
            </label>
            <label style={lbl}>
              Hourly Wage
              <input
                style={input}
                type="number"
                value={inputs.wage}
                onChange={(e) => updateInput("wage", Number(e.target.value))}
              />
            </label>
          </div>

          <button onClick={runCalculator} style={{ ...primaryBtn, marginTop: 14 }}>
            Calculate & Save
          </button>
        </>
      )}

      {step >= 8 && (
        <>
          <h2 style={{ marginTop: 16 }}>✓ Calculator Complete</h2>
          {result?.totalLoss != null && (
            <p style={{ opacity: 0.85 }}>
              Your current estimate is{" "}
              <strong>${result.totalLoss.toLocaleString()}/mo</strong>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
};

const choiceBtn: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
};

const card: React.CSSProperties = {
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 14,
  background: "rgba(2,6,23,0.6)",
  display: "grid",
  gap: 12,
  marginTop: 12,
};

const lbl: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  opacity: 0.95,
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e5e7eb",
};

