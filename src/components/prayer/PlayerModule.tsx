"use client";

import React from "react";
import { PrayerPlayer } from "@/01_App/Christian/Prayer/PrayerPlayer";
import { ReplayTimeline } from "@/01_App/Christian/Prayer/ReplayTimeline";
import type { Prayer } from "@/01_App/Christian/Prayer/PrayerTypes";

/**
 * Dedicated player module: play/pause, waveform, remaining time, seek, speed only.
 * Self-contained; can be reused elsewhere. Renders only when mode === "player".
 */

export interface PlayerModuleProps {
  src: string | null;
  title?: string;
  onPlayingChange?: (playing: boolean) => void;
  onDurationChange?: (seconds: number) => void;
  seekToSeconds?: number | null;
  onSeekDone?: () => void;
  /** When provided (e.g. live_room source), show replay timeline below player */
  replayPrayer?: Prayer | null;
  durationSec?: number;
  onReplaySeek?: (timestampSec: number) => void;
}

export function PlayerModule({
  src,
  title,
  onPlayingChange,
  onDurationChange,
  seekToSeconds,
  onSeekDone,
  replayPrayer,
  durationSec = 0,
  onReplaySeek,
}: PlayerModuleProps) {
  return (
    <div className="prayer-player-module" data-module="player">
      <PrayerPlayer
        src={src}
        title={title}
        onPlayingChange={onPlayingChange}
        onDurationChange={onDurationChange}
        seekToSeconds={seekToSeconds}
        onSeekDone={onSeekDone}
      />
      {replayPrayer?.source === "live_room" && replayPrayer.studyPages && replayPrayer.studyPages.length > 0 && (
        <ReplayTimeline
          prayer={replayPrayer}
          durationSec={durationSec || replayPrayer.duration || 0}
          onSeek={onReplaySeek}
        />
      )}
    </div>
  );
}
