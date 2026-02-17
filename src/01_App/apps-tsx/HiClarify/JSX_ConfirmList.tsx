"use client";

import React, { useState, useEffect } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import type { ParserStagingRow } from "@/logic/actions/structure.actions";

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
    padding: "var(--spacing-lg)",
    maxWidth: 560,
    margin: "0 auto",
  },
  title: {
    fontSize: "var(--font-size-lg)",
    fontWeight: "var(--font-weight-semibold)",
    marginBottom: "var(--spacing-md)",
  },
  input: {
    width: "100%",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-sm) var(--spacing-md)",
    fontSize: "var(--font-size-sm)",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    marginBottom: "var(--spacing-sm)",
  },
  btn: {
    padding: "var(--spacing-sm) var(--spacing-md)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
    marginRight: "var(--spacing-sm)",
    marginBottom: "var(--spacing-sm)",
  },
  btnPrimary: {
    background: "var(--color-primary)",
    color: "var(--color-on-primary)",
    border: "none",
  },
  row: {
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-md)",
    marginBottom: "var(--spacing-sm)",
    background: "var(--color-bg-secondary)",
  },
  rowTitle: {
    fontWeight: "var(--font-weight-medium)",
    marginBottom: "var(--spacing-xs)",
  },
  rowMeta: {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    marginBottom: "var(--spacing-sm)",
  },
  rowActions: {
    display: "flex",
    gap: "var(--spacing-sm)",
    flexWrap: "wrap",
  },
};

function getParserStaging(): ParserStagingRow[] {
  const s = getState()?.values?.structure;
  return (s?.parserStaging ?? []) as ParserStagingRow[];
}

export default function JSX_ConfirmList() {
  const [rows, setRows] = useState<ParserStagingRow[]>(getParserStaging);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const unsub = subscribeState(() => setRows(getParserStaging()));
    return unsub;
  }, []);

  const parseToStaging = () => {
    if (!draft.trim()) return;
    runAction({ name: "structure:parseToStaging", text: draft.trim() }, getState() ?? {});
    setDraft("");
  };

  const setStatus = (id: string, status: ParserStagingRow["status"]) => {
    runAction({ name: "structure:updateStagingRow", id, status }, getState() ?? {});
  };

  const confirmStaging = () => {
    runAction({ name: "structure:confirmStaging" }, getState() ?? {});
  };

  const toConfirm = rows.filter((r) => r.status === "use" || r.status === "add_use").length;

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>Task Matcher — Confirm list</h1>
      <input
        type="text"
        placeholder="Paste or type tasks (e.g. Call mom tomorrow. Review docs.)"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && parseToStaging()}
        style={styles.input}
      />
      <button type="button" style={styles.btn} onClick={parseToStaging}>
        Parse to staging
      </button>

      {rows.length > 0 && (
        <>
          <h2 style={{ fontSize: "var(--font-size-base)", marginTop: "var(--spacing-lg)", marginBottom: "var(--spacing-sm)" }}>
            Candidates ({rows.length})
          </h2>
          {rows.map((r) => (
            <div key={r.id} style={styles.row}>
              <div style={styles.rowTitle}>{r.title}</div>
              <div style={styles.rowMeta}>
                {r.dueDate ?? "No date"} · {r.categoryId} {r.status !== "pending" && `· ${r.status}`}
              </div>
              <div style={styles.rowActions}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...(r.status === "use" ? styles.btnPrimary : {}) }}
                  onClick={() => setStatus(r.id, "use")}
                >
                  Use
                </button>
                <button
                  type="button"
                  style={{ ...styles.btn, ...(r.status === "add_use" ? styles.btnPrimary : {}) }}
                  onClick={() => setStatus(r.id, "add_use")}
                >
                  Add+Use
                </button>
                <button
                  type="button"
                  style={styles.btn}
                  onClick={() => setStatus(r.id, "pending")}
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnPrimary, marginTop: "var(--spacing-md)" }}
            onClick={confirmStaging}
            disabled={toConfirm === 0}
          >
            Confirm ({toConfirm} selected)
          </button>
        </>
      )}
    </div>
  );
}
