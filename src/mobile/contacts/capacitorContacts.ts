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

async function pickNative(limit: number): Promise<NormalizedContact[]> {
  const { Contacts } = await import("@capacitor-community/contacts");
  const perm = await Contacts.requestPermissions();
  if (perm.contacts !== "granted") return [];
  const result = await Contacts.getContacts({
    projection: { name: true, phones: true, emails: true },
  });
  const list = (result?.contacts ?? []).slice(0, limit);
  return list.map((c: { contactId?: string; name?: string; phones?: { value?: string }[]; emails?: { value?: string }[] }) => ({
    id: (c as { contactId?: string }).contactId ?? `n-${Math.random().toString(36).slice(2)}`,
    name: (c as { name?: string }).name ?? "",
    phones: ((c as { phones?: { value?: string }[] }).phones ?? []).map((p) => p.value ?? "").filter(Boolean),
    emails: ((c as { emails?: { value?: string }[] }).emails ?? []).map((e) => e.value ?? "").filter(Boolean),
  }));
}

async function pickWeb(limit: number): Promise<NormalizedContact[]> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const contactsApi = nav?.contacts as { select: (props: { multiple: boolean }) => Promise<{ id: string; name: string[]; email?: string[]; tel?: string[] }[]> } | undefined;
  if (!contactsApi?.select) return [];
  const selected = await contactsApi.select({ multiple: true });
  const list = (Array.isArray(selected) ? selected : []).slice(0, limit);
  return list.map((c, i) => ({
    id: (c as { id?: string }).id ?? `w-${i}-${Date.now()}`,
    name: Array.isArray((c as { name?: string[] }).name) ? (c as { name: string[] }).name[0] ?? "" : String((c as { name?: string }).name ?? ""),
    phones: Array.isArray((c as { tel?: string[] }).tel) ? (c as { tel: string[] }).tel : [],
    emails: Array.isArray((c as { email?: string[] }).email) ? (c as { email: string[] }).email : [],
  }));
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
