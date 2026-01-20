"use client";


export default function SystemXray() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "100vh",
        fontFamily: "monospace",
      }}
    >
      <div style={{ padding: 20, background: "#020617", color: "#e5e7eb" }}>
        <h3>Live State</h3>
        <pre>{JSON.stringify({ status: "active" }, null, 2)}</pre>
      </div>


      <div style={{ padding: 20, background: "#0f172a", color: "#93c5fd" }}>
        <h3>Behavior Trace</h3>
        <p>Waiting for events…</p>
      </div>
    </div>
  );
}
