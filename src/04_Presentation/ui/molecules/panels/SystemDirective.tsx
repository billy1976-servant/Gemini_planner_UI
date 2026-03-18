export default function SystemDirective({
    directive,
  }: {
    directive: "SCALE" | "HOLD" | "PAUSE";
  }) {
    const color =
      directive === "SCALE"
        ? "limegreen"
        : directive === "PAUSE"
        ? "crimson"
        : "gold";
  
  
    return (
      <>
        <h4>System Directive</h4>
        <div style={{ fontSize: 24, fontWeight: "bold", color }}>
          {directive}
        </div>
      </>
    );
  }
  