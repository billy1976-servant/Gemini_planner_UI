/**
 * Capability Hub — Type definitions only.
 * No logic; contract for resolver, store, and consumers.
 */

/** Canonical capability domain keys (Level A macro). */
export type CapabilityDomain =
  | "auth"
  | "identity"
  | "messaging"
  | "sharing"
  | "voice"
  | "camera"
  | "media"
  | "contacts"
  | "notifications"
  | "sensors"
  | "environment"
  | "export"
  | "presence"
  | "device"
  | "timeline";

/** Per-domain value: string level or expanded object (after Level B). */
export type CapabilityLevel = string | Record<string, unknown>;

/** Global macro shape: one level per domain. */
export type GlobalCapabilities = Record<CapabilityDomain, string>;

/** Level C override: partial; only keys present override. */
export type CapabilityOverrides = Partial<Record<CapabilityDomain, string>>;

/** Effective capability profile: all domains present; values may be string or expanded. */
export type EffectiveCapabilityProfile = Record<CapabilityDomain, CapabilityLevel> & Record<string, unknown>;

/** Resolver options. */
export interface ResolveCapabilityProfileOptions {
  /** Level A — global macro (required). */
  global: GlobalCapabilities;
  /** Level B — domain micro loaders (optional; key = domain, value = loader returning domain micro object). */
  domainMicroLoaders?: Record<string, () => Record<string, unknown>>;
  /** Current template id (for lookup). */
  templateId?: string | null;
  /** Current template profile with optional capabilities block (any object with optional capabilities). */
  templateProfile?: { capabilities?: Partial<Record<string, string>> } | null;
  /** Screen JSON root capabilities block. */
  screenCapabilities?: CapabilityOverrides | null;
}
