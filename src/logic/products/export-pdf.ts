/**
 * PDF Export Builder - Generate PDF reports from product data
 * 
 * Builds a user "Decision Ledger" containing:
 * - Selected products
 * - Comparison matrix summary
 * - Calculator inputs/outputs
 * - Key sources (url + snippet)
 * 
 * PDF renders stable even without images (fallback to links)
 */

import type {
  Product,
  ComparisonMatrix,
  ProductSelection,
} from "./product-types";
import type { EngineState } from "../runtime/engine-state";
import type { ProductCalculatorResult } from "../engines/calculator/calcs/product-calculator";

export type DecisionLedger = {
  title: string;
  generatedAt: string;
  selectedProducts: Product[];
  comparison?: ComparisonMatrix;
  calculatorResults?: ProductCalculatorResult;
  sources: Array<{
    label: string;
    url: string;
    snippet: string;
  }>;
  summary: {
    totalProducts: number;
    totalCost: number;
    monthlySavings: number;
    roi: number;
  };
};

/**
 * Build Decision Ledger from EngineState and product data
 */
export function buildDecisionLedger(
  engineState: EngineState,
  products: Product[],
  selectedProductIds: string[],
  comparison?: ComparisonMatrix,
  calculatorResults?: ProductCalculatorResult
): DecisionLedger {
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  // Aggregate all sources
  const sources: Array<{ label: string; url: string; snippet: string }> = [];

  // Product sources
  selectedProducts.forEach((product) => {
    product.sources.forEach((source) => {
      sources.push({
        label: source.label,
        url: source.url,
        snippet: source.snippet,
      });
    });
  });

  // Calculator assumption sources
  if (calculatorResults?.assumptions.sources) {
    calculatorResults.assumptions.sources.forEach((source) => {
      sources.push({
        label: source.label,
        url: source.url,
        snippet: source.snippet,
      });
    });
  }

  // Comparison sources
  if (comparison) {
    comparison.similarities.forEach((sim) => {
      sim.sources.forEach((source) => {
        sources.push({
          label: `Similarity: ${sim.attributeKey}`,
          url: source.url,
          snippet: source.snippet,
        });
      });
    });
    comparison.differences.forEach((diff) => {
      diff.sources.forEach((source) => {
        sources.push({
          label: `Difference: ${diff.attributeKey}`,
          url: source.url,
          snippet: source.snippet,
        });
      });
    });
  }

  // Deduplicate sources by URL
  const uniqueSources = [
    ...new Map(sources.map((s) => [s.url, s])).values(),
  ];

  // Build summary
  const totalCost = calculatorResults?.totalCost || 0;
  const monthlySavings = calculatorResults?.monthlySavings || 0;
  const roi = calculatorResults?.roi || 0;

  return {
    title: "Product Decision Ledger",
    generatedAt: new Date().toISOString(),
    selectedProducts,
    comparison,
    calculatorResults,
    sources: uniqueSources,
    summary: {
      totalProducts: selectedProducts.length,
      totalCost,
      monthlySavings,
      roi,
    },
  };
}

/**
 * Generate PDF content as HTML (for browser print-to-PDF)
 * This is a simple HTML template that can be printed to PDF
 */
export function generatePdfHtml(ledger: DecisionLedger): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${ledger.title}</title>
  <style>
    @media print {
      @page {
        margin: 1in;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #333;
    }
    h3 {
      font-size: 14px;
      margin-top: 16px;
      margin-bottom: 8px;
      color: #555;
    }
    .meta {
      font-size: 12px;
      color: #666;
      margin-bottom: 24px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 24px 0;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .product {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }
    .product-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .product-brand {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
    }
    .product-attributes {
      margin-top: 12px;
      font-size: 12px;
    }
    .attribute {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .attribute-key {
      color: #666;
    }
    .attribute-value {
      font-weight: 600;
    }
    .product-url {
      margin-top: 8px;
      font-size: 11px;
      color: #3b82f6;
      word-break: break-all;
    }
    .comparison {
      margin: 24px 0;
      page-break-inside: avoid;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 12px;
    }
    .comparison-table th,
    .comparison-table td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    .comparison-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .calculator {
      margin: 24px 0;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .calculator-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 16px 0;
    }
    .calculator-metric {
      text-align: center;
      padding: 12px;
      background: white;
      border-radius: 6px;
    }
    .calculator-metric-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }
    .calculator-metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
    }
    .sources {
      margin: 24px 0;
      page-break-inside: avoid;
    }
    .source {
      margin: 12px 0;
      padding: 12px;
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
    }
    .source-label {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .source-url {
      font-size: 11px;
      color: #3b82f6;
      word-break: break-all;
      margin: 4px 0;
    }
    .source-snippet {
      font-size: 11px;
      color: #666;
      font-style: italic;
      margin-top: 4px;
    }
    .image-placeholder {
      width: 100%;
      height: 150px;
      background: #f0f0f0;
      border: 1px dashed #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <h1>${ledger.title}</h1>
  <div class="meta">
    Generated: ${new Date(ledger.generatedAt).toLocaleString()}
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Products</div>
      <div class="summary-value">${ledger.summary.totalProducts}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Cost</div>
      <div class="summary-value">$${ledger.summary.totalCost.toLocaleString()}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Monthly Savings</div>
      <div class="summary-value">$${ledger.summary.monthlySavings.toLocaleString()}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">ROI</div>
      <div class="summary-value">${ledger.summary.roi.toFixed(1)}%</div>
    </div>
  </div>

  <!-- Selected Products -->
  <h2>Selected Products (${ledger.selectedProducts.length})</h2>
  ${ledger.selectedProducts
    .map(
      (product) => `
    <div class="product">
      <div class="product-header">
        <div>
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-brand">${escapeHtml(product.brand)}</div>
        </div>
        <div class="product-price">
          ${product.price.currency} ${product.price.amount.toLocaleString()}
        </div>
      </div>
      ${product.images.length > 0 ? `<div class="image-placeholder">Image: ${escapeHtml(product.images[0].url)}</div>` : ""}
      ${Object.keys(product.attributes).length > 0 ? `
        <div class="product-attributes">
          ${Object.entries(product.attributes)
            .slice(0, 5)
            .map(
              ([key, attr]) => `
            <div class="attribute">
              <span class="attribute-key">${escapeHtml(key.replace(/_/g, " "))}:</span>
              <span class="attribute-value">${escapeHtml(String(attr.value))}${attr.unit ? ` ${attr.unit}` : ""}</span>
            </div>
          `
            )
            .join("")}
        </div>
      ` : ""}
      <div class="product-url">${escapeHtml(product.url)}</div>
    </div>
  `
    )
    .join("")}

  <!-- Comparison Matrix -->
  ${ledger.comparison ? `
    <h2>Product Comparison</h2>
    <div class="comparison">
      <h3>Top Similarities (${ledger.comparison.similarities.length})</h3>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Attribute</th>
            ${ledger.comparison.products.map((p) => `<th>${escapeHtml(p.name)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${ledger.comparison.similarities
            .slice(0, 5)
            .map(
              (sim) => `
            <tr>
              <td>${escapeHtml(sim.attributeKey.replace(/_/g, " "))}</td>
              ${ledger.comparison!.products
                .map((p) => {
                  const value = sim.values.find((v) => v.productId === p.id);
                  return `<td>${value ? escapeHtml(String(value.value.value)) : "—"}</td>`;
                })
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h3>Top Differences (${ledger.comparison.differences.length})</h3>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Attribute</th>
            ${ledger.comparison.products.map((p) => `<th>${escapeHtml(p.name)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${ledger.comparison.differences
            .slice(0, 5)
            .map(
              (diff) => `
            <tr>
              <td>${escapeHtml(diff.attributeKey.replace(/_/g, " "))}</td>
              ${ledger.comparison!.products
                .map((p) => {
                  const value = diff.values.find((v) => v.productId === p.id);
                  return `<td>${value ? escapeHtml(String(value.value.value)) : "—"}</td>`;
                })
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  ` : ""}

  <!-- Calculator Results -->
  ${ledger.calculatorResults ? `
    <h2>Cost Calculator Results</h2>
    <div class="calculator">
      <div class="calculator-metrics">
        <div class="calculator-metric">
          <div class="calculator-metric-label">Total Cost</div>
          <div class="calculator-metric-value">$${ledger.calculatorResults.totalCost.toLocaleString()}</div>
        </div>
        <div class="calculator-metric">
          <div class="calculator-metric-label">Monthly Savings</div>
          <div class="calculator-metric-value">$${ledger.calculatorResults.monthlySavings.toLocaleString()}</div>
        </div>
        <div class="calculator-metric">
          <div class="calculator-metric-label">ROI</div>
          <div class="calculator-metric-value">${ledger.calculatorResults.roi.toFixed(1)}%</div>
        </div>
      </div>
      <h3>Assumptions</h3>
      <ul>
        <li>Years Owned: ${ledger.calculatorResults.assumptions.yearsOwned}</li>
        <li>Usage Frequency: ${ledger.calculatorResults.assumptions.usageFrequency} times/month</li>
        <li>Budget Range: ${ledger.calculatorResults.assumptions.budgetRange}</li>
        <li>Scenario: ${ledger.calculatorResults.assumptions.scenarioType}</li>
      </ul>
      <h3>Breakdown</h3>
      <ul>
        <li>Initial Cost: $${ledger.calculatorResults.breakdown.initialCost.toLocaleString()}</li>
        <li>Monthly Cost: $${ledger.calculatorResults.breakdown.monthlyCost.toLocaleString()}</li>
        <li>Annual Cost: $${ledger.calculatorResults.breakdown.annualCost.toLocaleString()}</li>
        <li>Baseline Cost: $${ledger.calculatorResults.breakdown.baselineCost.toLocaleString()}</li>
        <li>Total Savings: $${ledger.calculatorResults.breakdown.savings.toLocaleString()}</li>
      </ul>
    </div>
  ` : ""}

  <!-- Sources -->
  <h2>Sources (${ledger.sources.length})</h2>
  <div class="sources">
    ${ledger.sources
      .map(
        (source) => `
      <div class="source">
        <div class="source-label">${escapeHtml(source.label)}</div>
        <div class="source-url">${escapeHtml(source.url)}</div>
        ${source.snippet ? `<div class="source-snippet">"${escapeHtml(source.snippet)}"</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    text = String(text);
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Download PDF by opening print dialog
 * Uses browser's native print-to-PDF functionality
 */
export function downloadPdf(ledger: DecisionLedger): void {
  const html = generatePdfHtml(ledger);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  
  // Open in new window and trigger print
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    // Fallback: create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-ledger-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Clean up URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
