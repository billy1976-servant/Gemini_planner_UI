/**
 * Level B — Domain micro loaders.
 * Each loader returns the domain's capability definition (sub-controls).
 * Resolver uses the resolved level (e.g. "lite", "full") to select which set is active.
 */

import authCapabilities from "./domains/auth.capabilities.json";
import sensorsCapabilities from "./domains/sensors.capabilities.json";
import exportCapabilities from "./domains/export.capabilities.json";
import mediaCapabilities from "./domains/media.capabilities.json";
import notificationsCapabilities from "./domains/notifications.capabilities.json";
import deviceCapabilities from "./domains/device.capabilities.json";
import messagingCapabilities from "./domains/messaging.capabilities.json";

export function getDomainMicroLoaders(): Record<string, () => Record<string, unknown>> {
  return {
    auth: () => authCapabilities as Record<string, unknown>,
    sensors: () => sensorsCapabilities as Record<string, unknown>,
    export: () => exportCapabilities as Record<string, unknown>,
    media: () => mediaCapabilities as Record<string, unknown>,
    notifications: () => notificationsCapabilities as Record<string, unknown>,
    device: () => deviceCapabilities as Record<string, unknown>,
    messaging: () => messagingCapabilities as Record<string, unknown>,
  };
}
