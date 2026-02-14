"use client";

import { useCallback, useState } from "react";
import { pickContacts, isNativePlatform, type NormalizedContact } from "./capacitorContacts";

export interface UseDeviceContactsResult {
  supported: boolean;
  granted: boolean;
  loading: boolean;
  contacts: NormalizedContact[];
  error: string | null;
  requestPermission: () => Promise<boolean>;
  fetchContacts: (limit?: number) => Promise<NormalizedContact[]>;
}

export function useDeviceContacts(): UseDeviceContactsResult {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    (isNativePlatform() || !!(navigator as { contacts?: { select?: unknown } }).contacts?.select);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNativePlatform()) {
      try {
        const { Contacts } = await import("@capacitor-community/contacts");
        const r = await Contacts.requestPermissions();
        return r.contacts === "granted";
      } catch {
        return false;
      }
    }
    return true;
  }, []);

  const fetchContacts = useCallback(
    async (limit: number = 10): Promise<NormalizedContact[]> => {
      setLoading(true);
      setError(null);
      try {
        const list = await pickContacts(limit);
        setContacts(list);
        return list;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch contacts";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    supported,
    granted: true,
    loading,
    contacts,
    error,
    requestPermission,
    fetchContacts,
  };
}
