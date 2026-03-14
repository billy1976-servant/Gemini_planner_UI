"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const DURATIONS = [1, 5, 10, 15] as const;

export interface PrayerTimerSelectorProps {
  /** Base path for prayer app (e.g. "/prayer" or "/christian/prayer") for admin link. */
  prayerBase?: string;
  /** When provided, "Time's up" shows a button that switches to record mode on the main tab. */
  onStartPrayer?: () => void;
}

export function PrayerTimerSelector({ prayerBase = "/prayer", onStartPrayer }: PrayerTimerSelectorProps = {}) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = (minutes: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setEnded(false);
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setEnded(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (ended) {
    return (
      <div
        className="prayer-timer-ended"
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: 12,
          border: "1px solid var(--prayer-card-border)",
          background: "rgba(24,22,36,0.4)",
        }}
      >
        <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>Time’s up</div>
        <p className="prayer-subtitle" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
          Record a prayer to share?
        </p>
        {onStartPrayer ? (
          <button
            type="button"
            onClick={() => { onStartPrayer(); setSelectedMinutes(null); setEnded(false); }}
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-play-bg)",
              background: "var(--prayer-play-bg)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Start Prayer
          </button>
        ) : (
          <Link
            href={`${prayerBase}/admin`}
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-play-bg)",
              background: "var(--prayer-play-bg)",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Record Prayer
          </Link>
        )}
        <button
          type="button"
          onClick={() => { setSelectedMinutes(null); setEnded(false); }}
          style={{
            marginLeft: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: 12,
            border: "1px solid var(--prayer-card-border)",
            background: "transparent",
            color: "var(--prayer-text)",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  if (selectedMinutes !== null && remainingSeconds > 0) {
    return (
      <div
        className="prayer-timer-running"
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: 12,
          border: "1px solid var(--prayer-card-border)",
          background: "rgba(24,22,36,0.4)",
        }}
      >
        <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>Prayer timer</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {formatTime(remainingSeconds)}
        </div>
        <button
          type="button"
          onClick={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setSelectedMinutes(null);
            setRemainingSeconds(0);
          }}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--prayer-card-border)",
            background: "transparent",
            color: "var(--prayer-text)",
            cursor: "pointer",
            fontSize: "0.8125rem",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="prayer-timer-selector"
      style={{
        marginTop: "1rem",
        padding: "1rem",
        borderRadius: 12,
        border: "1px solid var(--prayer-card-border)",
        background: "rgba(24,22,36,0.4)",
      }}
    >
      <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
        How long can you pray?
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {DURATIONS.map((min) => (
          <button
            key={min}
            type="button"
            onClick={() => startTimer(min)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-play-bg)",
              background: "transparent",
              color: "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {min} minute{min !== 1 ? "s" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
