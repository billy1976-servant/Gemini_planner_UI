export default function AutoTestScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "1rem 1.5rem",
          background: "#1a1a2e",
          color: "#eee",
          borderBottom: "1px solid #333",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
          Auto Test Screen
        </h1>
      </header>

      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          background: "#16213e",
          color: "#e0e0e0",
        }}
      >
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "1.5rem",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem", color: "#a0c4ff" }}>
            Content block
          </h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            This is a simple demo screen with a header, content area, and footer.
            No metadata or registration — just plain TSX.
          </p>
        </section>
      </main>

      <footer
        style={{
          padding: "0.75rem 1.5rem",
          background: "#0f0f1a",
          color: "#888",
          fontSize: "0.875rem",
          borderTop: "1px solid #333",
        }}
      >
        AutoTestScreen · Demo
      </footer>
    </div>
  );
}
