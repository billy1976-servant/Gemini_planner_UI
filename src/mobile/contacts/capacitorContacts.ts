/**
 * Device contacts: Capacitor native plugin when available, else Web Contact Picker API.
 * Normalized shape: { id, name, phones[], emails[] }[]
 */

export interface NormalizedContact {
  id: string;
  name: string;
  phones: string[];
  emails: string[];
}

declare global {
  interface Navigator {
    contacts?: {
      select: (props: { multiple?: boolean }, opts?: unknown) => Promise<unknown[]>;
    };
  }
}

let isNative: boolean | null = null;

export function isNativePlatform(): boolean {
  if (isNative !== null) return isNative;
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = require("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch {
    isNative = false;
  }
  return isNative;
}

function formatName(name: { display?: string | null; given?: string | null; family?: string | null } | undefined): string {
  if (!name) return "";
  if (name.display) return name.display;
  const parts = [name.given, name.family].filter(Boolean);
  return parts.join(" ").trim() || "";
}

async function pickNative(limit: number): Promise<NormalizedContact[]> {
  const { Contacts } = await import("@capacitor-community/contacts");
  const perm = await Contacts.requestPermissions();
  if (perm.contacts !== "granted") return [];
  const result = await Contacts.getContacts({
    projection: { name: true, phones: true, emails: true },
  });
  const list = (result?.contacts ?? []).slice(0, limit);
  return list.map((c) => ({
    id: c.contactId ?? `n-${Math.random().toString(36).slice(2)}`,
    name: formatName(c.name),
    phones: (c.phones ?? []).map((p) => p.number ?? "").filter(Boolean),
    emails: (c.emails ?? []).map((e) => e.address ?? "").filter(Boolean),
  }));
}

async function pickWeb(limit: number): Promise<NormalizedContact[]> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const contactsApi = nav?.contacts as { select: (props: { multiple: boolean }) => Promise<{ id: string; name: string[]; email?: string[]; tel?: string[] }[]> } | undefined;
  if (!contactsApi?.select) return [];
  const selected = await contactsApi.select({ multiple: true });
  const list = (Array.isArray(selected) ? selected : []).slice(0, limit);
  type WebContact = { id?: string; name?: string | string[]; email?: string[]; tel?: string[] };
  return list.map((c: unknown, i: number) => {
    const w = c as WebContact;
    const nameArr = Array.isArray(w.name) ? w.name : [];
    const nameStr = typeof w.name === "string" ? w.name : nameArr[0] ?? "";
    return {
      id: w.id ?? `w-${i}-${Date.now()}`,
      name: nameStr,
      phones: Array.isArray(w.tel) ? w.tel : [],
      emails: Array.isArray(w.email) ? w.email : [],
    };
  });
}

export async function pickContacts(limit: number = 10): Promise<NormalizedContact[]> {
  if (isNativePlatform()) {
    try {
      return await pickNative(limit);
    } catch (e) {
      console.warn("[contacts] Native pick failed", e);
      return [];
    }
  }
  try {
    return await pickWeb(limit);
  } catch (e) {
    console.warn("[contacts] Web pick failed", e);
    return [];
  }
}
