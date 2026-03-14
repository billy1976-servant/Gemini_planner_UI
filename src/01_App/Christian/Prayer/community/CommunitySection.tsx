"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getChains, getPrayer } from "../api/prayer-api";
import type { PrayerChain } from "../api/prayer-api";
import type { Prayer } from "../PrayerTypes";

export interface CommunitySectionProps {
  prayerBase?: string;
  groupSlug?: string | null;
}

function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http") || audioUrl.startsWith("/")) return audioUrl;
  return `/api/prayer/audio?path=${encodeURIComponent(audioUrl)}`;
}

export function CommunitySection({ prayerBase = "/prayer", groupSlug }: CommunitySectionProps) {
  const [chains, setChains] = useState<PrayerChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingChainId, setPlayingChainId] = useState<string | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [queue, setQueue] = useState<Prayer[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getChains().then(setChains).catch(() => setChains([])).finally(() => setLoading(false));
  }, []);

  const playNext = useCallback(() => {
    setPlayIndex((i) => {
      const next = i + 1;
      if (next >= queue.length) {
        setPlayingChainId(null);
        setQueue([]);
        return 0;
      }
      const prayer = queue[next];
      if (audioRef.current && prayer?.audioUrl) {
        audioRef.current.src = getAudioUrl(prayer.audioUrl);
        audioRef.current.play().catch(() => {});
      }
      return next;
    });
  }, [queue.length]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => playNext();
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [playNext]);

  const handlePlayChain = useCallback(async (chain: PrayerChain) => {
    if (chain.prayerIds.length === 0) return;
    const prayers: Prayer[] = [];
    for (const id of chain.prayerIds) {
      const p = await getPrayer(id);
      if (p) prayers.push(p);
    }
    if (prayers.length === 0) return;
    setQueue(prayers);
    setPlayingChainId(chain.id);
    setPlayIndex(0);
    const first = prayers[0];
    if (first?.audioUrl) {
      const url = getAudioUrl(first.audioUrl);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      }
    }
  }, []);

  const base = groupSlug ? `${prayerBase}/${groupSlug}` : prayerBase;

  return (
    <div className="prayer-community-section" style={{ marginTop: "1rem" }}>
      <h2 className="prayer-section-title">Community Prayer</h2>
      <p className="prayer-section-description" style={{ marginBottom: "1rem" }}>
        Prayer chains: listen to multiple prayers in sequence. Auto-play through the full chain.
      </p>

      <audio ref={audioRef} style={{ display: "none" }} />

      {loading ? (
        <p className="prayer-section-muted">Loading…</p>
      ) : chains.length === 0 ? (
        <p className="prayer-section-muted">No prayer chains yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {chains.map((chain) => (
            <li
              key={chain.id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
                background: "rgba(24,22,36,0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <div className="prayer-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>
                  {chain.request}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>
                  {chain.prayerIds.length} prayer{chain.prayerIds.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePlayChain(chain)}
                disabled={playingChainId === chain.id || chain.prayerIds.length === 0}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-play-bg)",
                  background: playingChainId === chain.id ? "var(--prayer-play-bg)" : "transparent",
                  color: "var(--prayer-text)",
                  cursor: playingChainId === chain.id || chain.prayerIds.length === 0 ? "default" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {playingChainId === chain.id ? "Playing…" : "Play chain"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link href={base} className="prayer-share-link">
          ← Back to Prayer
        </Link>
      </div>
    </div>
  );
}
