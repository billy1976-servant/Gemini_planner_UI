"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getActiveRooms } from "./prayer-room-api";
import type { ActiveRoomSummary } from "./prayer-room-api";

/** Room list polling: >= 5s to avoid request flooding; single source for LiveSection + LivePrayerCta. */
const ACTIVE_POLL_MS = 10000;

interface ActiveRoomsContextValue {
  rooms: ActiveRoomSummary[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const ActiveRoomsContext = createContext<ActiveRoomsContextValue | null>(null);

export interface ActiveRoomsProviderProps {
  groupId: string | null;
  children: React.ReactNode;
}

export function ActiveRoomsProvider({ groupId, children }: ActiveRoomsProviderProps) {
  const [rooms, setRooms] = useState<ActiveRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await getActiveRooms(groupId).catch(() => []);
    setRooms(list);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, ACTIVE_POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <ActiveRoomsContext.Provider value={{ rooms, loading, refetch: load }}>
      {children}
    </ActiveRoomsContext.Provider>
  );
}

export function useActiveRooms(): ActiveRoomsContextValue {
  const ctx = useContext(ActiveRoomsContext);
  if (!ctx) {
    return {
      rooms: [],
      loading: false,
      refetch: async () => {},
    };
  }
  return ctx;
}
