/**
 * Action → capability domain map (data only).
 * Used by behavior gating: if the required capability is "off", the action is skipped.
 * Only listed actions are gated; unlisted actions run as before.
 */

import type { CapabilityDomain } from "./capability.types";

export type ActionCapabilityRule = {
  domain: CapabilityDomain;
  /** Optional minimum level (e.g. "basic", "advanced"). If absent, any non-"off" allows. */
  minLevel?: string;
};

/** Map: action name → required capability rule(s). Only entries here are gated. */
export const CAPABILITY_ACTION_MAP: Record<string, ActionCapabilityRule> = {
  "logic:share": { domain: "sharing" },
  "logic:exportPdf": { domain: "export", minLevel: "basic" },
  "logic:export": { domain: "export" },
  "logic:contacts": { domain: "contacts" },
  "logic:pickContacts": { domain: "contacts" },
  "logic:notify": { domain: "notifications" },
  "logic:sendNotification": { domain: "notifications" },
  "logic:subscribeNotifications": { domain: "notifications" },
  "logic:message": { domain: "messaging" },
  "logic:sendMessage": { domain: "messaging" },
};

/**
 * Optional convention: prefix → domain. If no exact match in CAPABILITY_ACTION_MAP,
 * the runner uses the longest matching prefix (e.g. logic:shareLink → sharing).
 * Reduces map maintenance for many share/export/notify/message/contacts variants.
 */
export const CAPABILITY_ACTION_PREFIXES: Array<{ prefix: string; domain: CapabilityDomain }> = [
  { prefix: "logic:share", domain: "sharing" },
  { prefix: "logic:export", domain: "export" },
  { prefix: "logic:notify", domain: "notifications" },
  { prefix: "logic:message", domain: "messaging" },
  { prefix: "logic:contacts", domain: "contacts" },
];
