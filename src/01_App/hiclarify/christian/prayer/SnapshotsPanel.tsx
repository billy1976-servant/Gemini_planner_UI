"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getDraftList, deleteDraft, type PrayerDraftMeta } from "./utils/prayerdraftstore";

export interface SnapshotsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEditDraft: (draftId: string) => void;
}

export function SnapshotsPanel({ isOpen, onClose, onEditDraft }: SnapshotsPanelProps) {
  const [drafts, setDrafts] = useState<PrayerDraftMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDraftList();
      setDrafts(list);
    } catch (e) {
      setError("Could not load snapshots.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Could not delete.");
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="My snapshots"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        className="prayer-snapshots-panel"
        style={{
          background: "var(--prayer-card-bg, #1e1b2e)",
          border: "1px solid var(--prayer-card-border)",
          borderRadius: 12,
          padding: "1.25rem",
          maxWidth: 420,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", margin: 0 }}>My snapshots</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--prayer-text-muted)",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            ├ù
          </button>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)", marginBottom: "0.75rem" }}>
          Re-open a snapshot to edit and publish or save again.
        </p>
        {loading && <p style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>LoadingΓÇª</p>}
        {error && <p style={{ fontSize: "0.875rem", color: "#f87171" }}>{error}</p>}
        {!loading && !error && drafts.length === 0 && (
          <p style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>No snapshots yet. Record and use ΓÇ£Save snapshotΓÇ¥ to add one.</p>
        )}
        {!loading && drafts.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {drafts.map((d) => (
              <li
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--prayer-card-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{d.title || "Untitled"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)" }}>
                    {d.mediaType} ┬╖ {d.hasBlob ? "has recording" : "no recording"} ┬╖ {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => { onEditDraft(d.id); onClose(); }}
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.8125rem",
                      borderRadius: 6,
                      border: "1px solid var(--prayer-play-bg)",
                      background: "var(--prayer-play-bg)",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.8125rem",
                      borderRadius: 6,
                      border: "1px solid var(--prayer-card-border)",
                      background: "transparent",
                      color: "var(--prayer-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
