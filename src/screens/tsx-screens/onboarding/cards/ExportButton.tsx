/**
 * ExportButton - Always-available PDF download button
 * 
 * Features:
 * - Available at all times (not hidden)
 * - Generates Decision Ledger from current state
 * - Downloads PDF via browser print dialog
 */

"use client";
import React from "react";
import { readEngineState } from "@/logic/runtime/engine-bridge";
import { buildDecisionLedger, downloadPdf } from "@/logic/products/export-pdf";
import type { Product } from "@/logic/products/product-types";
import type { ComparisonMatrix } from "@/logic/products/product-types";
import type { ProductCalculatorResult } from "@/logic/engines/calculator/calcs/product-calculator";

type ExportButtonProps = {
  products: Product[];
  selectedProductIds: string[];
  comparison?: ComparisonMatrix;
  calculatorResults?: ProductCalculatorResult;
  disabled?: boolean;
};

export function ExportButton({
  products,
  selectedProductIds,
  comparison,
  calculatorResults,
  disabled = false,
}: ExportButtonProps) {
  const handleExport = () => {
    try {
      const engineState = readEngineState();
      if (!engineState) {
        console.error("[ExportButton] No engine state available");
        return;
      }

      // Build decision ledger
      const ledger = buildDecisionLedger(
        engineState,
        products,
        selectedProductIds,
        comparison,
        calculatorResults
      );

      // Download PDF
      downloadPdf(ledger);
    } catch (error) {
      console.error("[ExportButton] Failed to export PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || selectedProductIds.length === 0}
      style={{
        ...button,
        ...(disabled || selectedProductIds.length === 0 ? buttonDisabled : {}),
      }}
      title={
        selectedProductIds.length === 0
          ? "Select products to enable export"
          : "Download PDF report"
      }
    >
      📄 Download PDF
    </button>
  );
}

// Styles
const button: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#3b82f6",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "all 0.2s ease",
};

const buttonDisabled: React.CSSProperties = {
  background: "#475569",
  cursor: "not-allowed",
  opacity: 0.6,
};
