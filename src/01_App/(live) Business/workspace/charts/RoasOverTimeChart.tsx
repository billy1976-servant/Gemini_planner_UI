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
} from "recharts";
import type { ProjectionSnapshot } from "../types";

interface RoasOverTimeChartProps {
  snapshots: ProjectionSnapshot[];
  height?: number;
}

export function RoasOverTimeChart({ snapshots, height = 220 }: RoasOverTimeChartProps) {
  const sorted = [...snapshots].sort(
    (a, b) => (a.createdAt ?? a.timestamp) - (b.createdAt ?? b.timestamp)
  );
  const data = sorted.map((s) => ({
    date: new Date(s.createdAt ?? s.timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    roas: s.projectedROAS,
    full: new Date(s.createdAt ?? s.timestamp).toISOString(),
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <Tooltip
          formatter={(value: number) => [value.toFixed(2), "ROAS"]}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.full
              ? new Date(payload[0].payload.full).toLocaleString()
              : ""
          }
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="roas"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
