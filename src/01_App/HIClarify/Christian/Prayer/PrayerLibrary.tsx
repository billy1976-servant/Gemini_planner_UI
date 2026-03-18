"use client";

import React, { useState } from "react";
import type { Prayer } from "./PrayerTypes";

export interface PrayerLibraryProps {
  prayers: Prayer[];
  currentId: string | null;
  onSelect: (prayer: Prayer) => void;
  secondary?: boolean;
}

/**
 * Past Prayers: secondary section. Simple list; selecting loads into same player.
 */
export function PrayerLibrary({ prayers, currentId, onSelect, secondary = true }: PrayerLibraryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!prayers || prayers.length <= 1) return null;

  const others = prayers.filter((p) => p.id !== currentId);
  if (others.length === 0) return null;

  if (secondary) {
    return (
      <div className="prayer-past-section">
        <h3 className="prayer-past-heading">Past Prayers</h3>
        <button
          type="button"
          className="prayer-more-link"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "Show list"}
        </button>
        {expanded && (
          <ul className="prayer-more-list">
            {others.map((p) => (
              <li
                key={p.id}
                className="prayer-more-item"
                onClick={() => onSelect(p)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(p)}
                role="button"
                tabIndex={0}
              >
                <div className="prayer-more-item-title">{p.title}</div>
                <div className="prayer-more-item-meta">{new Date(p.createdAt).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ul className="prayer-library-list">
        {prayers.map((p) => (
          <li
            key={p.id}
            className={`prayer-library-item ${currentId === p.id ? "active" : ""}`}
            onClick={() => onSelect(p)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(p)}
            role="button"
            tabIndex={0}
          >
            <strong style={{ display: "block" }}>{p.title}</strong>
            <span className="prayer-time">
              {p.id === prayers[0]?.id ? "Latest" : new Date(p.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
