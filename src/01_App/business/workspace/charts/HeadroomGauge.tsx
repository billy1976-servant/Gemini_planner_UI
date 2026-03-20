"use client";

import React from "react";
import { getIndicatorForMetric } from "@/logic/business/ui/indicator-map";
import indicatorStyles from "../workspace-indicators.module.css";

interface HeadroomGaugeProps {
  percent: number;
  className?: string;
}

function indicatorClass(colorToken: string): string {
  const map: Record<string, string> = {
    green: indicatorStyles.indicatorGreen,
    "light-green": indicatorStyles.indicatorLightGreen,
    gray: indicatorStyles.indicatorGray,
    "light-red": indicatorStyles.indicatorLightRed,
    red: indicatorStyles.indicatorRed,
    strongPositive: indicatorStyles.indicatorGreen,
    moderatePositive: indicatorStyles.indicatorLightGreen,
    neutral: indicatorStyles.indicatorGray,
    moderateNegative: indicatorStyles.indicatorLightRed,
    strongNegative: indicatorStyles.indicatorRed,
  };
  return map[colorToken] ?? indicatorStyles.indicatorGray;
}

export function HeadroomGauge({ percent, className = "" }: HeadroomGaugeProps) {
  const ind = getIndicatorForMetric("scalingHeadroomPercent", percent);
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className={className}>
      <div
        style={{
          width: "100%",
          maxWidth: 200,
          height: 12,
          background: "#e5e7eb",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background:
              ind.color === "green" || ind.color === "strongPositive"
                ? "#22c55e"
                : ind.color === "light-green" || ind.color === "moderatePositive"
                  ? "#86efac"
                  : ind.color === "red" || ind.color === "strongNegative"
                    ? "#ef4444"
                    : ind.color === "light-red" || ind.color === "moderateNegative"
                      ? "#fca5a5"
                      : "#9ca3af",
            transition: "width 0.2s ease",
          }}
        />
      </div>
      <span className={indicatorClass(ind.color)} style={{ fontSize: "0.875rem", marginLeft: 8 }}>
        {pct.toFixed(0)}% headroom
      </span>
    </div>
  );
}
