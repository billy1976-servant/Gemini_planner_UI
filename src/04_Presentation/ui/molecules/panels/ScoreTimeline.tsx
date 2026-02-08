import LineChart from "@/ui/molecules/charts/LineChart";


export default function ScoreTimeline({ scores }: { scores: number[] }) {
  return (
    <>
      <h4>Score Timeline</h4>
      <LineChart values={scores} color="#4caf50" />
    </>
  );
}
