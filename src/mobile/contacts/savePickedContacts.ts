/**
 * Pure transformation layer: normalize picked contacts to a clean shape.
 * No Firestore or database logic. Caller is responsible for persistence.
 */

import type { NormalizedContact } from "./capacitorContacts";

export interface NormalizedContactRow {
  name: string;
  phone: string;
  email: string;
}

/**
 * Normalize a list of picked contacts to clean { name, phone, email } rows.
 * Uses first phone and first email when multiple exist.
 */
export function savePickedContacts(picked: NormalizedContact[]): NormalizedContactRow[] {
  if (!Array.isArray(picked)) return [];
  return picked.map((c) => ({
    name: typeof c.name === "string" ? c.name.trim() : "",
    phone: Array.isArray(c.phones) && c.phones.length > 0 ? String(c.phones[0]).trim() : "",
    email: Array.isArray(c.emails) && c.emails.length > 0 ? String(c.emails[0]).trim() : "",
  }));
}
