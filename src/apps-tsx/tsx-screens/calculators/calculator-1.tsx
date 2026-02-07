"use client";
import React from "react";


type Answers = {
  q1?: boolean;
  q2?: boolean;
  q3?: boolean;
  q4?: boolean;
  q5?: boolean;
};


type Props = {
  session: any;
  setSession: (fn: any) => void;
  track: (event: string, payload?: any) => void;
  goEducation: () => void;
};


export default function Cleanup25xDemo({
  session,
  setSession,
  track,
  goEducation,
}: Props) {
  // 🔒 CRASH-PROOF SESSION ACCESS
  const p =
    session &&
    typeof session === "object" &&
    typeof session.calc25x === "object"
      ? session.calc25x
      : {
          step: 1,
          answers: {},
          crewSize: 5,
          minutes: 45,
          wage: 20,
        };


  const step: number = typeof p.step === "number" ? p.step : 1;
  const answers: Answers = typeof p.answers === "object" ? p.answers : {};
  const crewSize: number = typeof p.crewSize === "number" ? p.crewSize : 5;
  const minutes: number = typeof p.minutes === "number" ? p.minutes : 45;
  const wage: number = typeof p.wage === "number" ? p.wage : 20;


  const wageMultiplier = 1.5;
  const workDays = 22;


  const moraleCost =
    (answers.q3 === false ? 200 : 0) +
    (answers.q4 === true ? 200 : 0) +
    (answers.q2 === true ? 200 : 0);


  const laborLoss =
    crewSize * (minutes / 60) * wage * wageMultiplier * workDays;


  const totalLoss = Math.round(laborLoss + moraleCost);


  function save(partial: any) {
    setSession((s: any) => ({
      ...(s ?? {}),
      calc25x: {
        ...((s && s.calc25x) || {}),
        ...partial,
      },
    }));
  }


  function answer(question: keyof Answers, value: boolean) {
    track("calc.answer", { question, value });
    save({
      answers: { ...answers, [question]: value },
      step: step + 1,
    });
  }


  function setNumber(
    key: "crewSize" | "minutes" | "wage",
    val: number
  ) {
    track("calc.input", { key, val });
    save({ [key]: val });
  }


  function finish() {
    track("calc.complete", { totalLoss });
    save({ totalLoss, completed: true, step: 8 });
  }


  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>
          25× Reality Check
        </h1>
        <button
          onClick={() => {
            track("calc.jump.education");
            goEducation();
          }}
          style={{
            height: 40,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#020617",
            color: "#93c5fd",
            cursor: "pointer",
          }}
        >
          ↩ Education
        </button>
      </div>


      {step === 1 && (
        <>
          <p style={{ opacity: 0.85 }}>
            Answer fast. You can leave and come back anytime — your progress
            stays.
          </p>
          <button
            onClick={() => {
              track("calc.start");
              save({ step: 2 });
            }}
            style={primaryBtn}
          >
            Start 5-Question Scan
          </button>
        </>
      )}


      {step === 2 && (
        <>
          <h3>Do crews spend time cleaning daily?</h3>
          <p style={{ opacity: 0.85 }}>
            Typical: 30–60 minutes per tech per day.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answer("q1", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answer("q1", false)}>
              No
            </button>
          </div>
        </>
      )}


      {step === 3 && (
        <>
          <h3>Have you lost client confidence from a messy site?</h3>
          <p style={{ opacity: 0.85 }}>
            Reminder: appearance + confusion can cost trust fast.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answer("q2", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answer("q2", false)}>
              No
            </button>
          </div>
        </>
      )}


      {step === 4 && (
        <>
          <h3>Is cleanup a recurring point of tension?</h3>
          <p style={{ opacity: 0.85 }}>
            Reminder: unclear cleanup roles create friction and delays.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answer("q3", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answer("q3", false)}>
              No
            </button>
          </div>
        </>
      )}


      {step === 5 && (
        <>
          <h3>Would morale improve with clear cleanup support?</h3>
          <p style={{ opacity: 0.85 }}>
            Reminder: fairness in cleanup strongly affects morale.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answer("q4", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answer("q4", false)}>
              No
            </button>
          </div>
        </>
      )}


      {step === 6 && (
        <>
          <h3>Do clean sites help safety and referrals?</h3>
          <p style={{ opacity: 0.85 }}>
            Reminder: clean sites reduce hazards and improve perception.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={choiceBtn} onClick={() => answer("q5", true)}>
              Yes
            </button>
            <button style={choiceBtn} onClick={() => answer("q5", false)}>
              No
            </button>
          </div>
        </>
      )}


      {step === 7 && (
        <>
          <h2 style={{ marginTop: 18 }}>
            Calculate Monthly Cleanup Cost
          </h2>
          <div style={card}>
            <label style={lbl}>
              Crew Size
              <input
                style={input}
                type="number"
                value={crewSize}
                onChange={(e) =>
                  setNumber("crewSize", Number(e.target.value))
                }
              />
            </label>
            <label style={lbl}>
              Cleanup Minutes / Day
              <input
                style={input}
                type="number"
                value={minutes}
                onChange={(e) =>
                  setNumber("minutes", Number(e.target.value))
                }
              />
            </label>
            <label style={lbl}>
              Hourly Wage
              <input
                style={input}
                type="number"
                value={wage}
                onChange={(e) =>
                  setNumber("wage", Number(e.target.value))
                }
              />
            </label>
          </div>


          <div style={{ marginTop: 14, opacity: 0.95 }}>
            <div>
              <strong>Labor Cost / Month:</strong>{" "}
              ${Math.round(laborLoss).toLocaleString()}
            </div>
            <div>
              <strong>Morale & Rework Cost:</strong>{" "}
              ${moraleCost.toLocaleString()}
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}
            >
              Total Estimated Loss: $
              {totalLoss.toLocaleString()} / month
            </div>
          </div>


          <button
            onClick={finish}
            style={{ ...primaryBtn, marginTop: 14 }}
          >
            Save Total + Continue
          </button>
        </>
      )}


      {step >= 8 && (
        <>
          <h2 style={{ marginTop: 16 }}>Saved.</h2>
          <p style={{ opacity: 0.85 }}>
            Your current estimate is{" "}
            <strong>
              ${(p.totalLoss ?? totalLoss).toLocaleString()}/mo
            </strong>
            .
          </p>
          <button
            onClick={() => track("calc.next_deeper")}
            style={primaryBtn}
          >
            Continue → Next Deepest Cost
          </button>
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


