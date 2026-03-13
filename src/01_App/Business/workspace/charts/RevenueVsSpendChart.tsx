"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RevenueVsSpendChartProps {
  revenue: number;
  spend: number;
  height?: number;
}

export function RevenueVsSpendChart({ revenue, spend, height = 220 }: RevenueVsSpendChartProps) {
  const data = [
    { name: "Revenue", value: revenue, fill: "#22c55e" },
    { name: "Spend", value: spend, fill: "#3b82f6" },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number) => [`$${Number(value).toLocaleString()}`, ""]}
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
