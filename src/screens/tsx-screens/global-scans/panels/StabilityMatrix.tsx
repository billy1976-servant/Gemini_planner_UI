export default function StabilityMatrix({
    volatility,
    consistency,
  }: {
    volatility: number;
    consistency: number;
  }) {
    return (
      <>
        <h4>Stability Metrics</h4>
        <div>Volatility: {volatility.toFixed(2)}</div>
        <div>Direction consistency: {(consistency * 100).toFixed(0)}%</div>
      </>
    );
  }
  