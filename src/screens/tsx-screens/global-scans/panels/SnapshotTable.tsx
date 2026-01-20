import { Scan } from "../types";


export default function SnapshotTable({ events }: { events: Scan[] }) {
  return (
    <>
      <h3>Snapshot</h3>
      <table width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Keyword</th>
            <th>Score</th>
            <th>Momentum</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {events.map((s, i) => (
            <tr key={i} style={{ borderTop: "1px solid #333" }}>
              <td>{new Date(s.timestamp).toLocaleTimeString()}</td>
              <td>{s.keyword}</td>
              <td align="center">{s.score}</td>
              <td align="center">{s.momentum}</td>
              <td align="center">{s.trend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
