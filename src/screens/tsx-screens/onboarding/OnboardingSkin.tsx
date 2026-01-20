"use client";
import React from "react";
import OnboardingEngine from "./OnboardingEngine";


export default function OnboardingSkin() {
  const engine = OnboardingEngine();
  const { state, activeQuestion, answer } = engine;


  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        padding: 24,
        fontFamily: "system-ui",
        background: "#020617",
        minHeight: "100vh",
        color: "#e5e7eb",
      }}
    >
      {/* ========= CARD 1: CALCULATOR ========= */}
      <Card title="Cleanup Cost Signals">
        {state.answers.map((a, i) => (
          <Line key={i} good={a.good} text={a.text} />
        ))}


        {activeQuestion && (
          <QuestionBox
            prompt={activeQuestion.prompt}
            onYes={() => answer(true)}
            onNo={() => answer(false)}
            step={state.step + 1}
            total={3}
          />
        )}
      </Card>


      {/* ========= CARD 2: EDUCATION ========= */}
      <Card title="What This Means">
        {state.answers.length === 0 && (
          <Muted>Answer questions to see insights appear.</Muted>
        )}


        {state.answers.map((a, i) => (
          <SmallInsight key={i} text={a.text} />
        ))}
      </Card>


      {/* ========= EVENT LOG ========= */}
      <div style={{ gridColumn: "1 / -1", marginTop: 16 }}>
        <h4 style={{ opacity: 0.7 }}>Interaction Log</h4>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          {state.events.map((e, i) => (
            <div key={i}>
              {new Date(e.at).toLocaleTimeString()} — {e.event}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ================================
   UI PRIMITIVES
================================ */
function Card({ title, children }: any) {
  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 14,
        padding: 20,
        background: "rgba(2,6,23,0.9)",
      }}
    >
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}


function Line({ good, text }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ color: good ? "#22c55e" : "#ef4444", marginRight: 8 }}>
        {good ? "✔" : "✖"}
      </span>
      {text}
    </div>
  );
}


function QuestionBox({ prompt, onYes, onNo, step, total }: any) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8, opacity: 0.7 }}>
        Step {step} of {total}
      </div>
      <div style={{ fontSize: 18, marginBottom: 12 }}>{prompt}</div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onYes}>Yes</button>
        <button onClick={onNo}>No</button>
      </div>
    </div>
  );
}


function SmallInsight({ text }: any) {
  return <div style={{ opacity: 0.8, marginBottom: 6 }}>{text}</div>;
}


function Muted({ children }: any) {
  return <div style={{ opacity: 0.5 }}>{children}</div>;
}
