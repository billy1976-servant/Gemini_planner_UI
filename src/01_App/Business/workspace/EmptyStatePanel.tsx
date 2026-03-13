"use client";

import React from "react";
import styles from "./WorkspaceLayout.module.css";

export function EmptyStatePanel({ onGoToData }: { onGoToData: () => void }) {
  return (
    <div className={styles.emptyStatePanel}>
      <p className={styles.emptyStateMessage}>
        Upload data or connect Google Ads to begin analysis.
      </p>
      <button type="button" className={styles.emptyStateButton} onClick={onGoToData}>
        Go to Data
      </button>
    </div>
  );
}
