"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export interface VariancePoint {
  snapshotId: string;
  date: string;
  dateMs: number;
  accuracyScore: number;
  varianceROAS: number;
  varianceCPA: number;
}

interface ProjectionVarianceChartProps {
  data: VariancePoint[];
  height?: number;
}

export function ProjectionVarianceChart({ data, height = 220 }: ProjectionVarianceChartProps) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.dateMs - b.dateMs);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={sorted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          domain={[0, 1]}
          tickFormatter={(v) => (v * 100).toFixed(0) + "%"}
        />
        <ReferenceLine y={1} stroke="#e5e7eb" strokeDasharray="3 3" />
        <Tooltip
          formatter={(value: number) => [(value * 100).toFixed(1) + "%", "Accuracy"]}
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="accuracyScore"
          name="Accuracy"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
