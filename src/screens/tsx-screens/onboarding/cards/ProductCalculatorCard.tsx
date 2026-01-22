/**
 * ProductCalculatorCard - Calculator with sliders for product cost analysis
 * 
 * Features:
 * - 2-4 sliders (config-driven per category)
 * - Output deltas with simple charts
 * - "Why" section with sources for input assumptions
 * - Writes results to EngineState.calcOutputs
 */

"use client";
import React, { useState, useEffect } from "react";
import { writeEngineState, readEngineState } from "@/logic/runtime/engine-bridge";
import { calculateProductCosts } from "@/logic/calcs/product-calculator";
import type { Product } from "@/logic/products/product-types";

type ProductCalculatorCardProps = {
  products: Product[];
  selectedProductIds: string[];
  category?: string;
  onComplete?: (result: any) => void;
};

type SliderConfig = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
};

// Category-specific slider configurations
const SLIDER_CONFIGS: Record<string, SliderConfig[]> = {
  default: [
    {
      id: "yearsOwned",
      label: "Years Owned",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
      unit: "years",
    },
    {
      id: "usageFrequency",
      label: "Usage Frequency",
      min: 1,
      max: 30,
      step: 1,
      defaultValue: 10,
      unit: "times/month",
    },
  ],
  tools: [
    {
      id: "yearsOwned",
      label: "Years Owned",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
      unit: "years",
    },
    {
      id: "usageFrequency",
      label: "Usage Frequency",
      min: 1,
      max: 30,
      step: 1,
      defaultValue: 10,
      unit: "times/month",
    },
    {
      id: "budgetRange",
      label: "Budget Range",
      min: 0,
      max: 2,
      step: 1,
      defaultValue: 1,
      unit: "", // Will be mapped to "low" | "medium" | "high"
    },
  ],
};

export function ProductCalculatorCard({
  products,
  selectedProductIds,
  category = "default",
  onComplete,
}: ProductCalculatorCardProps) {
  const config = SLIDER_CONFIGS[category] || SLIDER_CONFIGS.default;

  // Initialize slider values
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    config.forEach((slider) => {
      initial[slider.id] = slider.defaultValue;
    });
    return initial;
  });

  const [budgetRange, setBudgetRange] = useState<"low" | "medium" | "high">("medium");
  const [scenarioType, setScenarioType] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [result, setResult] = useState<any>(null);
  const [showWhy, setShowWhy] = useState(false);

  // Calculate results when inputs change
  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setResult(null);
      return;
    }

    const calculation = calculateProductCosts({
      selectedProductIds,
      products,
      yearsOwned: sliderValues.yearsOwned || 3,
      usageFrequency: sliderValues.usageFrequency || 10,
      budgetRange,
      scenarioType,
    });

    setResult(calculation);

    // Write to EngineState.calcOutputs
    const engineState = readEngineState() || {};
    writeEngineState({
      ...engineState,
      calcOutputs: {
        ...engineState.calcOutputs,
        "product-cost": calculation,
      },
    });

    // Call onComplete if provided
    if (onComplete) {
      onComplete(calculation);
    }
  }, [selectedProductIds, products, sliderValues, budgetRange, scenarioType, onComplete]);

  const updateSlider = (id: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [id]: value }));
  };

  if (selectedProductIds.length === 0) {
    return (
      <div style={emptyState}>
        <p>Select products to calculate costs</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <h2 style={title}>Product Cost Calculator</h2>

      {/* Sliders */}
      <div style={slidersContainer}>
        {config.map((slider) => {
          if (slider.id === "budgetRange") {
            // Special handling for budget range (dropdown)
            return (
              <div key={slider.id} style={sliderGroup}>
                <label style={sliderLabel}>
                  {slider.label}
                  <select
                    style={select}
                    value={budgetRange}
                    onChange={(e) =>
                      setBudgetRange(e.target.value as "low" | "medium" | "high")
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            );
          }

          return (
            <div key={slider.id} style={sliderGroup}>
              <label style={sliderLabel}>
                {slider.label}: {sliderValues[slider.id] || slider.defaultValue}
                {slider.unit && ` ${slider.unit}`}
              </label>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={sliderValues[slider.id] || slider.defaultValue}
                onChange={(e) => updateSlider(slider.id, Number(e.target.value))}
                style={sliderInput}
              />
              <div style={sliderRange}>
                <span>{slider.min}</span>
                <span>{slider.max}</span>
              </div>
            </div>
          );
        })}

        {/* Scenario Type Selector */}
        <div style={sliderGroup}>
          <label style={sliderLabel}>
            Scenario Type
            <select
              style={select}
              value={scenarioType}
              onChange={(e) =>
                setScenarioType(e.target.value as "conservative" | "moderate" | "aggressive")
              }
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={resultsContainer}>
          <h3 style={resultsTitle}>Calculation Results</h3>

          {/* Key Metrics */}
          <div style={metricsGrid}>
            <div style={metricCard}>
              <div style={metricLabel}>Total Cost</div>
              <div style={metricValue}>
                ${result.totalCost.toLocaleString()}
              </div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>Monthly Savings</div>
              <div style={metricValue}>
                ${result.monthlySavings.toLocaleString()}
              </div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>ROI</div>
              <div style={metricValue}>{result.roi.toFixed(1)}%</div>
            </div>
          </div>

          {/* Simple Chart - Cost Breakdown */}
          <div style={chartContainer}>
            <h4 style={chartTitle}>Cost Breakdown</h4>
            <div style={chart}>
              <div style={chartBar}>
                <div style={chartBarLabel}>Initial</div>
                <div style={chartBarContainer}>
                  <div
                    style={{
                      ...chartBarFill,
                      width: `${(result.breakdown.initialCost / result.breakdown.totalCost) * 100}%`,
                      background: "#3b82f6",
                    }}
                  />
                </div>
                <div style={chartBarValue}>
                  ${result.breakdown.initialCost.toLocaleString()}
                </div>
              </div>
              <div style={chartBar}>
                <div style={chartBarLabel}>Annual</div>
                <div style={chartBarContainer}>
                  <div
                    style={{
                      ...chartBarFill,
                      width: `${(result.breakdown.annualCost / result.breakdown.totalCost) * 100}%`,
                      background: "#10b981",
                    }}
                  />
                </div>
                <div style={chartBarValue}>
                  ${result.breakdown.annualCost.toLocaleString()}
                </div>
              </div>
              <div style={chartBar}>
                <div style={chartBarLabel}>Total</div>
                <div style={chartBarContainer}>
                  <div
                    style={{
                      ...chartBarFill,
                      width: "100%",
                      background: "#f59e0b",
                    }}
                  />
                </div>
                <div style={chartBarValue}>
                  ${result.breakdown.totalCost.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Why Section */}
          <div style={whySection}>
            <button
              style={whyButton}
              onClick={() => setShowWhy(!showWhy)}
            >
              {showWhy ? "▼" : "▶"} Why these numbers?
            </button>
            {showWhy && (
              <div style={whyContent}>
                <h4 style={whyTitle}>Input Assumptions</h4>
                <ul style={whyList}>
                  <li>
                    <strong>Years Owned:</strong> {result.assumptions.yearsOwned} years
                  </li>
                  <li>
                    <strong>Usage Frequency:</strong> {result.assumptions.usageFrequency} times/month
                  </li>
                  <li>
                    <strong>Budget Range:</strong> {result.assumptions.budgetRange}
                  </li>
                  <li>
                    <strong>Scenario:</strong> {result.assumptions.scenarioType}
                  </li>
                </ul>
                <h4 style={whyTitle}>Sources</h4>
                <div style={sourcesList}>
                  {result.assumptions.sources.map((source: any, idx: number) => (
                    <div key={idx} style={sourceItem}>
                      <div style={sourceLabel}>{source.label}</div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={sourceLink}
                      >
                        {source.url}
                      </a>
                      {source.snippet && (
                        <div style={sourceSnippet}>"{source.snippet}"</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const container: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 24,
  width: "100%",
};

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#f1f5f9",
  marginBottom: 24,
};

const slidersContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  marginBottom: 24,
};

const sliderGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const sliderLabel: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e5e7eb",
};

const sliderInput: React.CSSProperties = {
  width: "100%",
  height: 8,
  borderRadius: 4,
  background: "#334155",
  outline: "none",
  cursor: "pointer",
};

const sliderRange: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 11,
  color: "#94a3b8",
};

const select: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e5e7eb",
  fontSize: 14,
  marginTop: 8,
  cursor: "pointer",
};

const resultsContainer: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  background: "#0f172a",
  borderRadius: 8,
};

const resultsTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 16,
};

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  marginBottom: 24,
};

const metricCard: React.CSSProperties = {
  padding: 16,
  background: "#1e293b",
  borderRadius: 8,
  textAlign: "center",
};

const metricLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 8,
};

const metricValue: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#10b981",
};

const chartContainer: React.CSSProperties = {
  marginBottom: 24,
};

const chartTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 12,
};

const chart: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const chartBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const chartBarLabel: React.CSSProperties = {
  width: 60,
  fontSize: 12,
  color: "#94a3b8",
};

const chartBarContainer: React.CSSProperties = {
  flex: 1,
  height: 24,
  background: "#334155",
  borderRadius: 4,
  overflow: "hidden",
};

const chartBarFill: React.CSSProperties = {
  height: "100%",
  transition: "width 0.3s ease",
};

const chartBarValue: React.CSSProperties = {
  width: 100,
  fontSize: 12,
  color: "#e5e7eb",
  textAlign: "right",
};

const whySection: React.CSSProperties = {
  marginTop: 24,
  padding: 16,
  background: "#1e293b",
  borderRadius: 8,
};

const whyButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const whyContent: React.CSSProperties = {
  marginTop: 16,
};

const whyTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 8,
};

const whyList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: "#cbd5e1",
  fontSize: 13,
  marginBottom: 16,
};

const sourcesList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const sourceItem: React.CSSProperties = {
  padding: 12,
  background: "#0f172a",
  borderRadius: 6,
  fontSize: 12,
};

const sourceLabel: React.CSSProperties = {
  fontWeight: 600,
  color: "#cbd5e1",
  marginBottom: 4,
};

const sourceLink: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
  wordBreak: "break-all",
  display: "block",
  marginBottom: 4,
};

const sourceSnippet: React.CSSProperties = {
  color: "#94a3b8",
  fontStyle: "italic",
  marginTop: 4,
};

const emptyState: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
};
