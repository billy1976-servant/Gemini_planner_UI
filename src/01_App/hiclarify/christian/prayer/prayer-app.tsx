"use client";

import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { PlayerModule } from "../../../../components/prayer/PlayerModule";
import { RecorderModule } from "../../../../components/prayer/RecorderModule";
import { getPrayers } from "./api/prayer-api";

type PrayerRecord = {
  id: string;
  title?: string;
  description?: string;
  audioUrl?: string;
  source?: string;
  studyPages?: unknown[];
  duration?: number;
};

export type PrayerMode = "player" | "record" | "live";

export interface PrayerAppProps {
  basePath?: string;
}

function PrayerAppInner() {
  const [prayers, setPrayers] = useState<PrayerRecord[]>([]);
  const [current, setCurrent] = useState<PrayerRecord | null>(null);
  const [mode, setMode] = useState<PrayerMode>("player");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [seekToSec, setSeekToSec] = useState<number | null>(null);

  useEffect(() => {
    getPrayers()
      .then((rows) => {
        const list = Array.isArray(rows) ? (rows as PrayerRecord[]) : [];
        setPrayers(list);
        setCurrent(list[0] ?? null);
      })
      .catch(() => {
        setPrayers([]);
        setCurrent(null);
      });
  }, []);

  const audioSrc = current?.audioUrl ?? null;

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setMode("player")}>Player</button>
        <button type="button" onClick={() => setMode("record")}>Record</button>
      </div>

      {mode === "player" ? (
        <PlayerModule
          src={audioSrc}
          title={current?.title}
          onDurationChange={setDurationSeconds}
          seekToSeconds={seekToSec}
          onSeekDone={() => setSeekToSec(null)}
          replayPrayer={current as any}
          durationSec={durationSeconds || current?.duration || 0}
          onReplaySeek={(timestampSec) => setSeekToSec(timestampSec)}
        />
      ) : (
        <RecorderModule
          onPublished={(prayer) => {
            const record = prayer as PrayerRecord;
            const next = [record, ...prayers];
            setPrayers(next);
            setCurrent(record);
            setMode("player");
          }}
          onCancel={() => setMode("player")}
        />
      )}

      {prayers.length > 0 && (
        <ul style={{ marginTop: 16 }}>
          {prayers.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setCurrent(p)}>
                {p.title || p.id}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PrayerApp(_props: PrayerAppProps) {
  return (
    <SessionProvider refetchInterval={0}>
      <PrayerAppInner />
    </SessionProvider>
  );
}

export default PrayerApp;
