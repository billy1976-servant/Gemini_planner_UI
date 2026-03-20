"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { PrayerWaveform } from "./PrayerWaveform";
import { formatTime } from "./utils/formatTime";

const SKIP_SECONDS = 15;
const SPEED_CYCLE = [1, 1.25, 1.5] as const;

export interface PrayerPlayerProps {
  src: string | null;
  title?: string;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  /** Called when audio duration is known (for metrics) */
  onDurationChange?: (seconds: number) => void;
  /** When set, seek audio to this position (e.g. from ReplayTimeline marker). */
  seekToSeconds?: number | null;
  /** Called after seek was applied (parent can clear seekToSeconds). */
  onSeekDone?: () => void;
  /** Use video element so replay can show screen recording (live_room with screen share). */
  useVideo?: boolean;
  /** Called with seconds of listening time when playback is flushed (pause/end). */
  onListeningSecondsFlush?: (seconds: number) => void;
}

/**
 * Clean podcast-style player: horizontal row [ Play | Waveform | Time remaining ],
 * then control row (-15s, +15s, Speed cycle). Waveform is full-width and click-to-seek.
 */
export function PrayerPlayer({
  src,
  title,
  onEnded,
  onPlayingChange,
  onDurationChange,
  seekToSeconds,
  onSeekDone,
  useVideo = false,
  onListeningSecondsFlush,
}: PrayerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRef = useVideo ? videoRef : audioRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const playbackRate = SPEED_CYCLE[speedIndex];
  const lastListeningFlushRef = useRef<number>(0);

  const progress = duration > 0 ? currentTime / duration : 0;
  const remainingSeconds = Math.max(0, duration - currentTime);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((i) => (i + 1) % SPEED_CYCLE.length);
  }, []);

  const play = useCallback(() => {
    const el = mediaRef.current;
    if (!el || !src) return;
    el.play().then(() => { setIsPlaying(true); onPlayingChange?.(true); }).catch(() => {});
  }, [src, onPlayingChange]);

  const pause = useCallback(() => {
    const el = mediaRef.current;
    if (el) {
      const seconds = el.currentTime - lastListeningFlushRef.current;
      if (seconds > 0 && onListeningSecondsFlush) {
        onListeningSecondsFlush(seconds);
      }
      lastListeningFlushRef.current = el.currentTime;
      el.pause();
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange, onListeningSecondsFlush]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !src) return;
    setCurrentTime(0);
    setDuration(0);
    el.src = src;
    el.load();
  }, [src]);

  useEffect(() => {
    const el = mediaRef.current;
    if (el && typeof seekToSeconds === "number" && Number.isFinite(seekToSeconds)) {
      el.currentTime = Math.max(0, seekToSeconds);
      setCurrentTime(el.currentTime);
      onSeekDone?.();
    }
  }, [seekToSeconds, onSeekDone]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChangeEv = () => {
      const d = el.duration;
      setDuration(d);
      if (Number.isFinite(d)) onDurationChange?.(d);
    };
    const onEndedEv = () => {
      const seconds = el.currentTime - lastListeningFlushRef.current;
      if (seconds > 0 && onListeningSecondsFlush) {
        onListeningSecondsFlush(seconds);
      }
      lastListeningFlushRef.current = 0;
      el.currentTime = 0;
      setCurrentTime(0);
      onEnded?.();
      setIsPlaying(false);
      onPlayingChange?.(false);
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChangeEv);
    el.addEventListener("ended", onEndedEv);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChangeEv);
      el.removeEventListener("ended", onEndedEv);
    };
  }, [onPlayingChange, onDurationChange]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = mediaRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    el.currentTime = x * el.duration;
    setCurrentTime(el.currentTime);
  }, []);

  const skipBack = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - SKIP_SECONDS);
    setCurrentTime(el.currentTime);
  }, []);

  const skipForward = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + SKIP_SECONDS);
    setCurrentTime(el.currentTime);
  }, []);

  const hasAudio = Boolean(src);

  return (
    <div className="prayer-player-hero">
      {src && useVideo ? (
        <video
          ref={videoRef}
          preload="metadata"
          playsInline
          muted={false}
          style={{ width: "100%", maxHeight: 320, background: "var(--prayer-card-bg, #0f172a)", borderRadius: 8, marginBottom: "0.75rem" }}
        />
      ) : (
        <audio ref={audioRef} preload="metadata" />
      )}

      {/* Main row: Play | Waveform | Time remaining */}
      <div className="prayer-player-row">
        <button
          type="button"
          className="prayer-play-btn-inline"
          onClick={hasAudio ? (isPlaying ? pause : play) : undefined}
          disabled={!hasAudio}
          aria-label={hasAudio ? (isPlaying ? "Pause" : "Play") : "No prayer loaded"}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div
          className="prayer-waveform-wrap"
          onClick={hasAudio ? seek : undefined}
          role="progressbar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
        >
          <PrayerWaveform
            audioRef={mediaRef}
            isPlaying={isPlaying}
            progress={progress}
            height={56}
            barCount={72}
          />
        </div>
        <span className="prayer-time-remaining">{formatTime(remainingSeconds)} remaining</span>
      </div>

      {/* Control row: -15s | +15s | Speed */}
      <div className="prayer-controls-row">
        <button
          type="button"
          className="prayer-skip-btn"
          onClick={skipBack}
          disabled={!hasAudio}
          aria-label="Skip back 15 seconds"
        >
          −15s
        </button>
        <button
          type="button"
          className="prayer-skip-btn"
          onClick={skipForward}
          disabled={!hasAudio}
          aria-label="Skip forward 15 seconds"
        >
          +15s
        </button>
        <button
          type="button"
          className="prayer-speed-cycle-btn"
          onClick={cycleSpeed}
          disabled={!hasAudio}
          aria-label="Playback speed"
        >
          Speed {playbackRate}x
        </button>
      </div>
    </div>
  );
}
