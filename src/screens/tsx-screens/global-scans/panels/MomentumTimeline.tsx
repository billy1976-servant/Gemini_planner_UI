import LineChart from "../charts/LineChart";


export default function MomentumTimeline({ values }: { values: number[] }) {
  return (
    <>
      <h4>Momentum Timeline</h4>
      <LineChart values={values} color="#ff9800" />
    </>
  );
}
