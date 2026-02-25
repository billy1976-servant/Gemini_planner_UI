"use client";

import React from "react";
import styles from "./WorkspaceLayout.module.css";

const REPORT_BASE = "/api/reports/google-ads-summary";

export function ReportsTab({ businessId }: { businessId: string }) {
  const reportUrl = businessId
    ? `${REPORT_BASE}?businessId=${encodeURIComponent(businessId)}`
    : REPORT_BASE;
  return (
    <div className={styles.reportsPage}>
      <h2 className={styles.reportsPageTitle}>Reports</h2>
      <p className={styles.reportsPageDesc}>
        Generate an HTML summary report. Open it in a new tab and use your browser&apos;s Print
        function to save as PDF.
      </p>
      <div className={styles.reportActions}>
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.reportButton}
        >
          Open HTML Report
        </a>
        <button
          type="button"
          className={styles.reportButton}
          onClick={() => window.open(reportUrl, "_blank")}
        >
          Print to PDF
        </button>
      </div>
    </div>
  );
}
