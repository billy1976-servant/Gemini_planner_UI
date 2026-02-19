// screens/tsx-screens/flows-cleanup-CO/Calculator.tsx
"use client";
import React from "react";


type Props = {
  session: any;
  setSession: (fn: any) => void;
  track: (event: string, payload?: any) => void;
  goEducation: () => void;
};


export default function Calculator({
  session,
  setSession,
  track,
  goEducation,
}: Props) {
  /* =========================
     EDITABLE CONFIG SECTION
  ========================= */
  const QUESTIONS = [
    { id: "q1", text: "Do crews spend time cleaning daily?" },
    { id: "q2", text: "Have you lost client confidence from a messy site?" },
    { id: "q3", text: "Is cleanup a recurring point of tension?" },
    { id: "q4", text: "Would morale improve with clear cleanup support?" },
    { id: "q5", text: "Do clean sites help safety and referrals?" },
  ];


  const DEFAULTS = {
    crewSize: 5,
    minutes: 45,
    wage: 20,
  };


  /* =========================
     STATE ACCESS (DO NOT EDIT)
  ========================= */
  const p = session.calculator ?? {
    step: 1,
    answers: {},
    ...DEFAULTS,
  };


  const step = p.step ?? 1;
  const answers = p.answers ?? {};
  const crewSize = p.crewSize ?? DEFAULTS.crewSize;
  const minutes = p.minutes ?? DEFAULTS.minutes;
  const wage = p.wage ?? DEFAULTS.wage;


  /* =========================
     CALCULATION (EDITABLE)
  ========================= */
  const wageMultiplier = 1.5;
  const workDays = 22;
  const laborLoss =
    crewSize * (minutes / 60) * wage * wageMultiplier * workDays;
  const totalLoss = Math.round(laborLoss);


  /* =========================
     HELPERS (DO NOT EDIT)
  ========================= */
  function save(partial: any) {
    setSession((s: any) => ({
      ...s,
      calculator: { ...(s.calculator ?? {}), ...partial },
    }));
  }


  function answer(id: string, value: boolean) {
    track("calculator.answer", { id, value });
    const nextStep = step + 1;
    save({
      answers: { ...answers, [id]: value },
      step:
        nextStep > QUESTIONS.length + 1
          ? QUESTIONS.length + 2
          : nextStep,
    });
  }


  function finish() {
    track("calculator.complete", { totalLoss });
    save({ totalLoss, completed: true, step: QUESTIONS.length + 2 });
  }


  /* =========================
     RENDER
  ========================= */
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>Calculator</h1>


      {step === 1 && (
        <button onClick={() => save({ step: 2 })}>
          Start Scan
        </button>
      )}


      {QUESTIONS.map((q, i) => {
        const qStep = i + 2;
        if (step !== qStep) return null;
        return (
          <div key={q.id}>
            <h3>{q.text}</h3>
            <button onClick={() => answer(q.id, true)}>Yes</button>
            <button onClick={() => answer(q.id, false)}>No</button>
          </div>
        );
      })}


      {step === QUESTIONS.length + 2 && (
        <div>
          <h2>Total Estimated Loss</h2>
          <div>${totalLoss.toLocaleString()} / month</div>
          <button onClick={finish}>Save + Continue</button>
        </div>
      )}


      {step > QUESTIONS.length + 2 && (
        <div>
          <h2>Saved</h2>
          <button onClick={goEducation}>Back to Education</button>
        </div>
      )}
    </div>
  );
}


