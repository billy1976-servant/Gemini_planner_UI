"use client";


type Props = {
  session: any;
  setSession: (fn: any) => void;
  track: (event: string, payload?: any) => void;
  goCalculator: () => void;
};


export default function EducationFlow({ session, setSession, track, goCalculator }: Props) {
  const learned =
    session.education?.learned ??
    [
      "Cleanup time quietly drains profit daily.",
      "Clean sites reduce safety risk and improve trust.",
      "Appearance influences bids, referrals, and closeouts.",
    ];


  function completeEducation() {
    track("education.complete");
    setSession((s: any) => ({
      ...s,
      education: {
        ...(s.education ?? {}),
        startedAt: s.education?.startedAt ?? Date.now(),
        completed: true,
        learned,
      },
    }));
    goCalculator();
  }


  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 8px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>
        Why Cleanup Quietly Costs More Than You Think
      </h1>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        This section is meant to “teach once” and stay available as a reminder while you calculate.
      </p>


      <div
        style={{
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 16,
          background: "rgba(2,6,23,0.6)",
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>What you learned</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.95 }}>
          {learned.map((x: string, i: number) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {x}
            </li>
          ))}
        </ul>
      </div>


      <button
        onClick={() => {
          track("education.to_calculator_click");
          completeEducation();
        }}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 12,
          border: "1px solid #334155",
          background: "#020617",
          color: "#e5e7eb",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        Continue → Calculate My Numbers
      </button>
    </div>
  );
}


