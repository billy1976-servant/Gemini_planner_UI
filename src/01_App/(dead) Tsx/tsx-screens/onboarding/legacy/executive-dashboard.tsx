"use client";


export default function ExecutiveDashboard() {
  return (
    <div
      style={{
        padding: 40,
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "Inter, system-ui",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>
        Decision Overview
      </h1>


      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {["Signal Strength", "Risk Exposure", "Clarity Index"].map((label) => (
          <div
            key={label}
            style={{
              background: "#020617",
              border: "1px solid #334155",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <strong>{label}</strong>
            <div style={{ marginTop: 8, opacity: 0.7 }}>Pending</div>
          </div>
        ))}
      </div>
    </div>
  );
}
