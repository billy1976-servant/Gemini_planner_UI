"use client";

import React from "react";
import { getIndicator } from "@/logic/business/ui/indicator-map";
import indicatorStyles from "../workspace-indicators.module.css";

interface CpaTrendChartProps {
  cpa: number;
  trendSlope: number;
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

export function CpaTrendChart({ cpa, trendSlope, className = "" }: CpaTrendChartProps) {
  const ind = getIndicator(cpa, trendSlope, { metric: "cpa" });
  return (
    <div className={className}>
      <span className={indicatorClass(ind.color)}>
        ${cpa.toFixed(2)} {ind.arrow}
      </span>
      <span style={{ marginLeft: "0.5rem", fontSize: "0.8125rem", color: "#6b7280" }}>
        CPA · trend {trendSlope > 0 ? "up" : trendSlope < 0 ? "down" : "flat"}
      </span>
    </div>
  );
}
