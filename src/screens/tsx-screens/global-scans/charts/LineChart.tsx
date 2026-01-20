// src/screens/tsx-screens/global-scans/charts/LineChart.tsx


export default function LineChart({
    values,
    width = 300,
    height = 80,
    color = "#4caf50",
  }: {
    values: number[];
    width?: number;
    height?: number;
    color?: string;
  }) {
    if (values.length < 2) {
      return <div style={{ opacity: 0.4 }}>No data</div>;
    }
  
  
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
  
  
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    });
  
  
    return (
      <svg width={width} height={height}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points.join(" ")}
        />
      </svg>
    );
  }
  