"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomSignalingEvent, SignalingMessage } from "../PrayerRoomTypes";

const SIGNALING_POLL_MS = 5000;

function getSignalingBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer-room/signaling`;
  return "/api/prayer-room/signaling";
}

export interface UsePrayerRoomSignalingOptions {
  roomId: string | null;
  participantId: string | null;
  onEvent?: (event: RoomSignalingEvent) => void;
}

export function usePrayerRoomSignaling({
  roomId,
  participantId,
  onEvent,
}: UsePrayerRoomSignalingOptions) {
  const [lastTimestamp, setLastTimestamp] = useState(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const send = useCallback(
    async (type: SignalingMessage["type"], to: string, payload: Record<string, unknown>) => {
      if (!roomId || !participantId) return;
      const res = await fetch(getSignalingBase(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          from: participantId,
          to,
          type,
          ...payload,
        }),
      });
      if (!res.ok) throw new Error("Signaling send failed");
    },
    [roomId, participantId]
  );

  const sendOffer = useCallback(
    (to: string, sdp: RTCSessionDescriptionInit) => send("offer", to, { sdp }),
    [send]
  );
  const sendAnswer = useCallback(
    (to: string, sdp: RTCSessionDescriptionInit) => send("answer", to, { sdp }),
    [send]
  );
  const sendIce = useCallback(
    (to: string, candidate: RTCIceCandidateInit) => send("ice", to, { candidate }),
    [send]
  );
  const sendMute = useCallback(
    (to: string, muted: boolean) => send("mute", to, { muted }),
    [send]
  );

  useEffect(() => {
    if (!roomId || !participantId) return;
    let cancelled = false;

    const poll = async () => {
      const url = `${getSignalingBase()}?roomId=${encodeURIComponent(roomId)}&after=${lastTimestamp}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json().catch(() => ({}));
      const events: RoomSignalingEvent[] = Array.isArray(data?.events)
        ? data.events.map((e: { id?: string; from?: string; to?: string; type?: string; sdp?: unknown; candidate?: unknown; muted?: boolean; timestamp?: number }) => ({
            id: e.id ?? "",
            roomId,
            message: {
              type: (e.type ?? "ice") as SignalingMessage["type"],
              from: e.from ?? "",
              to: e.to ?? "",
              sdp: e.sdp,
              candidate: e.candidate,
              muted: e.muted,
              timestamp: e.timestamp ?? 0,
            },
          }))
        : [];
      let maxTs = lastTimestamp;
      for (const ev of events) {
        if (ev.message.to === participantId) {
          onEventRef.current?.(ev);
        }
        if (ev.message.timestamp > maxTs) maxTs = ev.message.timestamp;
      }
      if (events.length > 0) setLastTimestamp((prev) => Math.max(prev, maxTs));
    };

    const id = setInterval(poll, SIGNALING_POLL_MS);
    poll();

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomId, participantId, lastTimestamp]);

  return { sendOffer, sendAnswer, sendIce, sendMute };
}
