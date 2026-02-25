"use client";

import React from "react";
import styles from "./WorkspaceLayout.module.css";

export function SettingsTab() {
  return (
    <div className={styles.settingsPage}>
      <h2 className={styles.settingsPageTitle}>Settings</h2>
      <p className={styles.settingsPageDesc}>
        Date range and preferences — coming soon.
      </p>
    </div>
  );
}
