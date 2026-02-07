import LineChart from "../charts/LineChart";


export default function ScoreTimeline({ scores }: { scores: number[] }) {
  return (
    <>
      <h4>Score Timeline</h4>
      <LineChart values={scores} color="#4caf50" />
    </>
  );
}
