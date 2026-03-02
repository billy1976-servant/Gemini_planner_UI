"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { Business } from "@/logic/business/business-model";
import { buildRawCsvPreview, type RawCsvPreview } from "@/logic/csv/rawCsvPreview";
import styles from "./WorkspaceLayout.module.css";

const PREVIEW_ROW_LIMIT = 50;
const RAW_FALLBACK_LENGTH = 2000;

export function DataTab({
  businessId,
  business,
  onRefresh,
}: {
  businessId: string;
  business: Business;
  onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filesByName, setFilesByName] = React.useState<Record<string, RawCsvPreview>>({});
  const [fileList, setFileList] = React.useState<string[]>([]);
  const [selectedFilename, setSelectedFilename] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [rawFallback, setRawFallback] = React.useState<string | null>(null);
  const [storedCount, setStoredCount] = React.useState<number>(0);
  const [ingestLoading, setIngestLoading] = React.useState(false);
  const [ingestError, setIngestError] = React.useState<string | null>(null);
  const [filesLoading, setFilesLoading] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const isCsvBusiness = business?.dataSourceType === "csv";
  const canUpload = Boolean(businessId && isCsvBusiness);

  const fetchStoredCount = useCallback(() => {
    if (!businessId) return;
    fetch(`/api/business/csv/signals?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((d: { count?: number }) => setStoredCount(d.count ?? 0))
      .catch(() => setStoredCount(0));
  }, [businessId]);

  const fetchFilesList = useCallback(() => {
    if (!businessId || !isCsvBusiness) return;
    setFilesLoading(true);
    fetch(`/api/business/csv/files?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; files?: { filename: string }[] }) => {
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df01c7" },
          body: JSON.stringify({
            sessionId: "df01c7",
            location: "DataTab.tsx:fetchFilesList",
            message: "Data tab: files API response for businessId",
            data: { businessId, ok: d.ok, fileNames: Array.isArray(d.files) ? d.files.map((f) => f.filename) : [] },
            timestamp: Date.now(),
            hypothesisId: "E",
          }),
        }).catch(() => {});
        // #endregion
        if (d.ok && Array.isArray(d.files)) {
          const names = d.files.map((f) => f.filename);
          setFileList(names);
          setSelectedFilename((current) => {
            if (names.length === 0) return null;
            if (current && names.includes(current)) return current;
            return names[names.length - 1];
          });
        }
      })
      .catch(() => setFileList([]))
      .finally(() => setFilesLoading(false));
  }, [businessId, isCsvBusiness]);

  useEffect(() => {
    fetchStoredCount();
  }, [fetchStoredCount]);

  useEffect(() => {
    fetchFilesList();
  }, [fetchFilesList]);

  useEffect(() => {
    if (!selectedFilename || !businessId || !isCsvBusiness || filesByName[selectedFilename]) return;
    setPreviewLoading(true);
    fetch(
      `/api/business/csv/preview?businessId=${encodeURIComponent(businessId)}&filename=${encodeURIComponent(selectedFilename)}`
    )
      .then((r) => r.json())
      .then((d: { ok?: boolean; filename?: string; headers?: string[]; rows?: string[][]; totalRows?: number }) => {
        if (d.ok && d.filename && Array.isArray(d.headers)) {
          const preview: RawCsvPreview = {
            filename: d.filename,
            size: 0,
            delimiter: "comma",
            headers: d.headers,
            rows: Array.isArray(d.rows) ? d.rows : [],
          };
          setFilesByName((prev) => ({ ...prev, [d.filename!]: preview }));
        }
      })
      .finally(() => setPreviewLoading(false));
  }, [businessId, isCsvBusiness, selectedFilename]);

  const currentPreview = selectedFilename ? filesByName[selectedFilename] ?? null : null;
  const previewRows = currentPreview ? currentPreview.rows.slice(0, PREVIEW_ROW_LIMIT) : [];
  const headerCount = currentPreview?.headers.length ?? 0;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canUpload) {
      setIngestError("Select CSV Upload in the header dropdown first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setParseError(null);
    setRawFallback(null);
    setIngestError(null);
    try {
      const text = await file.text();
      const preview = buildRawCsvPreview(text, file.name, file.size);
      setFilesByName((prev) => ({ ...prev, [file.name]: preview }));
      setFileList((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]));
      setSelectedFilename(file.name);

      setIngestLoading(true);
      const res = await fetch("/api/business/csv/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text, businessId, filename: file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const errMsg = data.error ?? data.reason ?? (typeof data === "object" ? JSON.stringify(data) : "Ingest failed");
        setIngestError(errMsg);
      } else {
        if (data.headers && Array.isArray(data.previewRows)) {
          setFilesByName((prev) => ({
            ...prev,
            [data.filename ?? file.name]: {
              filename: data.filename ?? file.name,
              size: file.size,
              delimiter: "comma",
              headers: data.headers,
              rows: data.previewRows ?? [],
            },
          }));
        }
        setFileList((prev) => (prev.includes(data.filename ?? file.name) ? prev : [...prev, data.filename ?? file.name]));
        setSelectedFilename(data.filename ?? file.name);
        fetchStoredCount();
        fetchFilesList();
        onRefresh();
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse failed");
      const text = await file.text().catch(() => "");
      setRawFallback(text.slice(0, RAW_FALLBACK_LENGTH));
      setSelectedFilename(null);
    } finally {
      setIngestLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteFile() {
    if (!businessId || !selectedFilename || !isCsvBusiness) return;
    if (!confirm(`Delete "${selectedFilename}"? This cannot be undone.`)) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/business/csv/files?businessId=${encodeURIComponent(businessId)}&filename=${encodeURIComponent(selectedFilename)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setFilesByName((prev) => {
          const next = { ...prev };
          delete next[selectedFilename!];
          return next;
        });
        setFileList((prev) => prev.filter((n) => n !== selectedFilename));
        setSelectedFilename(null);
        fetchStoredCount();
        onRefresh();
      } else {
        setIngestError(data.reason ?? "Delete failed");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className={styles.dataTabPanel}>
      <section className={styles.section}>
        <h3 className={styles.chartTitle}>Raw CSV viewer</h3>
        {!businessId && (
          <p style={{ fontSize: "0.875rem", marginBottom: 8, color: "#dc2626", fontWeight: 600 }}>
            No business selected. Choose a business in the header.
          </p>
        )}
        {businessId && !isCsvBusiness && (
          <p style={{ fontSize: "0.875rem", marginBottom: 8, color: "#dc2626", fontWeight: 600 }}>
            Select <strong>CSV Upload</strong> in the header dropdown to upload and view CSVs here.
          </p>
        )}
        {storedCount > 0 && (
          <p style={{ fontSize: "0.875rem", marginBottom: 8, color: "#059669" }}>
            Stored: {storedCount} signal{storedCount !== 1 ? "s" : ""} (used by Compare, Command, Reports, Ads)
          </p>
        )}
        {ingestLoading && (
          <p style={{ fontSize: "0.875rem", marginBottom: 8, color: "#64748b" }}>Saving to store…</p>
        )}
        {ingestError && (
          <p style={{ fontSize: "0.875rem", marginBottom: 8, color: "#dc2626" }}>Ingest: {ingestError}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-hidden
        />
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={!canUpload}
          aria-disabled={!canUpload}
        >
          Upload CSV
        </button>

        {filesLoading && <p style={{ fontSize: "0.875rem", marginTop: 8, color: "#64748b" }}>Loading file list…</p>}
        {fileList.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="data-files-dropdown" className={styles.chartTitle} style={{ display: "block", marginBottom: 4 }}>
              Files
            </label>
            <select
              id="data-files-dropdown"
              className={styles.select}
              value={selectedFilename ?? ""}
              onChange={(e) => setSelectedFilename(e.target.value || null)}
              aria-label="Select uploaded file"
              disabled={previewLoading}
            >
              <option value="">—</option>
              {fileList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {selectedFilename && (
              <button
                type="button"
                onClick={handleDeleteFile}
                disabled={deleteLoading}
                style={{
                  marginLeft: 8,
                  padding: "0.35rem 0.6rem",
                  fontSize: "0.8125rem",
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                }}
                aria-label={`Delete file ${selectedFilename}`}
              >
                {deleteLoading ? "Deleting…" : "Delete file"}
              </button>
            )}
            {previewLoading && selectedFilename && (
              <span style={{ fontSize: "0.8125rem", color: "#64748b", marginLeft: 8 }}>Loading preview…</span>
            )}
          </div>
        )}
      </section>

      {parseError && rawFallback !== null && (
        <section className={styles.section}>
          <p style={{ color: "#dc2626", marginBottom: 8 }}>Parse error: {parseError}</p>
          <p style={{ fontSize: "0.875rem", marginBottom: 4 }}>First {RAW_FALLBACK_LENGTH} characters:</p>
          <pre
            style={{
              padding: 12,
              background: "#f1f5f9",
              borderRadius: 6,
              fontSize: "0.75rem",
              overflow: "auto",
              maxHeight: 300,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {rawFallback}
          </pre>
        </section>
      )}

      {currentPreview && (
        <>
          <section className={styles.section}>
            <h3 className={styles.chartTitle}>Raw preview</h3>
            <p style={{ fontSize: "0.875rem", marginBottom: 4 }}>
              <strong>Filename:</strong> {currentPreview.filename}
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: 4 }}>
              <strong>File size:</strong> {(currentPreview.size / 1024).toFixed(2)} KB
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: 8 }}>
              <strong>Detected delimiter:</strong> {currentPreview.delimiter}
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: 4 }}>
              <strong>Headers (exact):</strong>
            </p>
            <ul style={{ fontSize: "0.8125rem", marginBottom: 12, paddingLeft: 20 }}>
              {currentPreview.headers.map((h, i) => (
                <li key={i}>{h || "(empty)"}</li>
              ))}
            </ul>

            <div style={{ overflow: "auto", maxHeight: 400, border: "1px solid #e5e7eb", borderRadius: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    {currentPreview.headers.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "6px 8px",
                          textAlign: "left",
                          borderBottom: "2px solid #e5e7eb",
                          background: "#f8fafc",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h || "(empty)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri}>
                      {currentPreview.headers.map((_, ci) => {
                        const cell = row[ci] ?? "";
                        return (
                          <td
                            key={ci}
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #e5e7eb",
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {currentPreview.rows.length > PREVIEW_ROW_LIMIT && (
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 8 }}>
                Showing first {PREVIEW_ROW_LIMIT} of {currentPreview.rows.length} rows.
              </p>
            )}
          </section>

          <section className={styles.section} style={{ marginTop: 16 }}>
            <h3 className={styles.chartTitle}>Debug</h3>
            <pre style={{ fontSize: "0.8125rem", margin: 0 }}>
              {[
                `total lines: ${currentPreview.headers.length + currentPreview.rows.length} (1 header + ${currentPreview.rows.length} data)`,
                `header count: ${headerCount}`,
                `preview row count: ${previewRows.length}`,
                `first header: ${JSON.stringify(currentPreview.headers[0] ?? "")}`,
                `last header: ${JSON.stringify(currentPreview.headers[currentPreview.headers.length - 1] ?? "")}`,
              ].join("\n")}
            </pre>
          </section>
        </>
      )}

      {!currentPreview && !parseError && fileList.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: 16 }}>
          Upload a CSV file to see raw preview (filename, size, delimiter, headers, first 50 rows).
        </p>
      )}
    </div>
  );
}
