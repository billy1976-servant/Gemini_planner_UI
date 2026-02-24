/**
 * Indicator Map — JSON-driven thresholds for color, arrow, severity.
 * getIndicator(metric, slope) returns { color, arrow, severity }.
 * No hard-coded red/green in UI; UI consumes these tokens.
 */

export interface IndicatorThresholds {
  roas: { strong: number; moderate: number };
  trendSlope: { strongUp: number; strongDown: number; moderateUp: number; moderateDown: number };
  /** 0–1; above high = saturated (negative), below low = healthy */
  saturationScore: { low: number; high: number };
  /** 0–100; above high = strong headroom, below low = constrained */
  scalingHeadroomPercent: { low: number; high: number };
  /** 0–1; above high = stable, below low = unstable */
  stabilityScore: { low: number; high: number };
  /** 0–1; above high = confident, below low = low confidence */
  demandConfidenceScore: { low: number; high: number };
}

export interface IndicatorColors {
  strongPositive: string;
  moderatePositive: string;
  neutral: string;
  moderateNegative: string;
  strongNegative: string;
}

export interface IndicatorArrows {
  up: string;
  down: string;
  flat: string;
}

export const DEFAULT_THRESHOLDS: IndicatorThresholds = {
  roas: { strong: 10, moderate: 5 },
  trendSlope: { strongUp: 0.15, strongDown: -0.15, moderateUp: 0.05, moderateDown: -0.05 },
  saturationScore: { low: 0.3, high: 0.7 },
  scalingHeadroomPercent: { low: 20, high: 60 },
  stabilityScore: { low: 0.4, high: 0.8 },
  demandConfidenceScore: { low: 0.4, high: 0.8 },
};

export const DEFAULT_COLORS: IndicatorColors = {
  strongPositive: "green",
  moderatePositive: "light-green",
  neutral: "gray",
  moderateNegative: "light-red",
  strongNegative: "red",
};

export const DEFAULT_ARROWS: IndicatorArrows = {
  up: "↑",
  down: "↓",
  flat: "→",
};

export type IndicatorSeverity = "strong" | "moderate" | "weak";

export interface IndicatorResult {
  color: string;
  arrow: string;
  severity: IndicatorSeverity;
}

/**
 * Get indicator for a metric value (e.g. ROAS) and optional trend slope.
 * Deterministic; thresholds from config.
 */
export function getIndicator(
  metricValue: number,
  trendSlope: number,
  options?: {
    thresholds?: Partial<IndicatorThresholds>;
    colors?: Partial<IndicatorColors>;
    arrows?: Partial<IndicatorArrows>;
    metric?: "roas" | "cpa" | "generic";
  }
): IndicatorResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options?.thresholds };
  const colors = { ...DEFAULT_COLORS, ...options?.colors };
  const arrows = { ...DEFAULT_ARROWS, ...options?.arrows };
  const metric = options?.metric ?? "generic";

  let severity: IndicatorSeverity = "weak";
  let color = colors.neutral;
  let arrow = arrows.flat;

  if (metric === "roas") {
    if (metricValue >= thresholds.roas.strong) {
      severity = "strong";
      color = colors.strongPositive;
    } else if (metricValue >= thresholds.roas.moderate) {
      severity = "moderate";
      color = colors.moderatePositive;
    } else if (metricValue < thresholds.roas.moderate && metricValue > 0) {
      severity = "weak";
      color = colors.neutral;
    } else {
      color = colors.moderateNegative;
      severity = "weak";
    }
  }

  if (metric === "cpa") {
    // Lower CPA is better
    if (metricValue <= 0) {
      color = colors.strongPositive;
      severity = "strong";
    } else {
      color = colors.neutral;
      severity = "weak";
    }
  }

  if (trendSlope >= thresholds.trendSlope.strongUp) {
    arrow = arrows.up;
    if (severity === "weak") severity = "moderate";
  } else if (trendSlope <= thresholds.trendSlope.strongDown) {
    arrow = arrows.down;
    color = color === colors.neutral ? colors.moderateNegative : color;
  } else if (trendSlope >= thresholds.trendSlope.moderateUp) {
    arrow = arrows.up;
  } else if (trendSlope <= thresholds.trendSlope.moderateDown) {
    arrow = arrows.down;
  }

  return { color, arrow, severity };
}

/**
 * Get indicator for extended metrics (saturation, headroom, stability, demand confidence).
 * JSON config only; metric name selects threshold set.
 */
export function getIndicatorForMetric(
  metricName: "saturationScore" | "scalingHeadroomPercent" | "stabilityScore" | "demandConfidenceScore",
  value: number,
  options?: {
    thresholds?: Partial<IndicatorThresholds>;
    colors?: Partial<IndicatorColors>;
  }
): IndicatorResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options?.thresholds };
  const colors = { ...DEFAULT_COLORS, ...options?.colors };
  let severity: IndicatorSeverity = "weak";
  let color = colors.neutral;

  switch (metricName) {
    case "saturationScore":
      if (thresholds.saturationScore != null) {
        if (value >= thresholds.saturationScore.high) {
          color = colors.strongNegative;
          severity = "strong";
        } else if (value >= thresholds.saturationScore.low) {
          color = colors.moderateNegative;
          severity = "moderate";
        } else {
          color = colors.moderatePositive;
          severity = "weak";
        }
      }
      break;
    case "scalingHeadroomPercent":
      if (thresholds.scalingHeadroomPercent != null) {
        if (value >= thresholds.scalingHeadroomPercent.high) {
          color = colors.strongPositive;
          severity = "strong";
        } else if (value >= thresholds.scalingHeadroomPercent.low) {
          color = colors.moderatePositive;
          severity = "moderate";
        } else {
          color = colors.moderateNegative;
          severity = "weak";
        }
      }
      break;
    case "stabilityScore":
    case "demandConfidenceScore":
      if (
        (metricName === "stabilityScore" && thresholds.stabilityScore != null) ||
        (metricName === "demandConfidenceScore" && thresholds.demandConfidenceScore != null)
      ) {
        const t = metricName === "stabilityScore" ? thresholds.stabilityScore! : thresholds.demandConfidenceScore!;
        if (value >= t.high) {
          color = colors.strongPositive;
          severity = "strong";
        } else if (value >= t.low) {
          color = colors.moderatePositive;
          severity = "moderate";
        } else {
          color = colors.moderateNegative;
          severity = "weak";
        }
      }
      break;
  }

  return { color, arrow: DEFAULT_ARROWS.flat, severity };
}
