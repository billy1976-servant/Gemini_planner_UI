"use client";
import React, { useState } from "react";


/* ======================================================
   TYPES
====================================================== */
type AnswerLine = {
  text: string;
  good: boolean;
};


type Question = {
  id: string;
  text: string;
  yes: AnswerLine;
  no: AnswerLine;
  value?: number; // optional $ impact for calculator
};


/* ======================================================
   QUESTIONS (INLINE, EDIT THESE)
====================================================== */


// Calculator questions (real math)
const CALC_QUESTIONS: Question[] = [
  {
    id: "cleanup_end",
    text: "Do crews clean at the end of every job?",
    yes: { text: "Crews clean consistently", good: true },
    no: { text: "Cleanup inconsistency costs time", good: false },
    value: 500,
  },
  {
    id: "cleanup_delay",
    text: "Does cleanup delay the next task?",
    yes: { text: "Cleanup delays downstream work", good: false },
    no: { text: "Cleanup does not delay workflow", good: true },
    value: 1000,
  },
];


// Education / Why questions (no math)
const WHY_QUESTIONS: Question[] = [
  {
    id: "safety",
    text: "Does cleanup affect jobsite safety?",
    yes: { text: "Poor cleanup increases safety risk", good: false },
    no: { text: "Safety impact is minimal", good: true },
  },
  {
    id: "trust",
    text: "Does appearance affect client trust?",
    yes: { text: "Appearance directly affects trust", good: false },
    no: { text: "Appearance has little impact", good: true },
  },
];


/* ======================================================
   COMPONENT
====================================================== */
export default function SimpleOnboarding() {
  // Calculator card state
  const [calcIndex, setCalcIndex] = useState(0);
  const [calcLines, setCalcLines] = useState<AnswerLine[]>([]);
  const [totalLoss, setTotalLoss] = useState(0);


  // Education card state
  const [whyIndex, setWhyIndex] = useState(0);
  const [whyLines, setWhyLines] = useState<AnswerLine[]>([]);


  function answerCalc(yes: boolean) {
    const q = CALC_QUESTIONS[calcIndex];
    const line = yes ? q.yes : q.no;


    setCalcLines((l) => [line, ...l]);
    if (!line.good && q.value) {
      setTotalLoss((t) => t + q.value);
    }
    setCalcIndex((i) => i + 1);
  }


  function answerWhy(yes: boolean) {
    const q = WHY_QUESTIONS[whyIndex];
    const line = yes ? q.yes : q.no;


    setWhyLines((l) => [line, ...l]);
    setWhyIndex((i) => i + 1);
  }


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: 32,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>
        Find Your Real Cleanup Cost
      </h1>


      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* ================= CALCULATOR CARD ================= */}
        <Card title="Calculate Your Actual Costs">
          <ResultList lines={calcLines} />


          {calcIndex < CALC_QUESTIONS.length ? (
            <QuestionBox
              question={CALC_QUESTIONS[calcIndex].text}
              onYes={() => answerCalc(true)}
              onNo={() => answerCalc(false)}
            />
          ) : (
            <div style={{ marginTop: 16, fontWeight: 700 }}>
              Estimated loss: ${totalLoss.toLocaleString()}/month
            </div>
          )}
        </Card>


        {/* ================= WHY CARD ================= */}
        <Card title="Why This Is Costing You">
          <ResultList lines={whyLines} />


          {whyIndex < WHY_QUESTIONS.length ? (
            <QuestionBox
              question={WHY_QUESTIONS[whyIndex].text}
              onYes={() => answerWhy(true)}
              onNo={() => answerWhy(false)}
            />
          ) : (
            <div style={{ marginTop: 16, fontWeight: 700 }}>
              All insights collected
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


/* ======================================================
   SMALL UI PIECES
====================================================== */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 16,
        padding: 24,
        background: "#020617",
      }}
    >
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}


function ResultList({ lines }: { lines: AnswerLine[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
          {l.good ? "✓" : "✗"} {l.text}
        </div>
      ))}
    </div>
  );
}


function QuestionBox({
  question,
  onYes,
  onNo,
}: {
  question: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 10 }}>{question}</div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onYes}>Yes</button>
        <button onClick={onNo}>No</button>
      </div>
    </div>
  );
}


