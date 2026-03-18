type SourceStats = {
    source: string;
    count: number;
    avgScore: number;
    avgMomentum: number;
    volatility: number;
  };
  
  
  export default function SourceBreakdown({
    rows,
  }: {
    rows: SourceStats[];
  }) {
    return (
      <>
        <h3>Source Breakdown</h3>
        <table width="100%" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th align="left">Source</th>
              <th>Points</th>
              <th>Avg Score</th>
              <th>Avg Momentum</th>
              <th>Volatility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.source} style={{ borderTop: "1px solid #333" }}>
                <td>{r.source}</td>
                <td align="center">{r.count}</td>
                <td align="center">{r.avgScore.toFixed(1)}</td>
                <td align="center">{r.avgMomentum.toFixed(1)}</td>
                <td align="center">{r.volatility.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  
  
  