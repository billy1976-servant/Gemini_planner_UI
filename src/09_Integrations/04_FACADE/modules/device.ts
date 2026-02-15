/**
 * Device state — facade module.
 * Battery, network, screen, device info. Thermals stub if absent.
 */

import { readBattery as readBatteryImpl } from "@/engine/system7/sensors/battery";
import { readNetwork as readNetworkImpl } from "@/engine/system7/sensors/network";
import { readScreen as readScreenImpl } from "@/engine/system7/sensors/screen";
import { readDevice as readDeviceImpl } from "@/engine/system7/sensors/device";

export function readBattery() {
  return readBatteryImpl();
}

export function readNetwork() {
  return readNetworkImpl();
}

export function readScreen() {
  return readScreenImpl();
}

export function readDevice() {
  return readDeviceImpl();
}

/** Stub: thermals not wired; safe shape, no crash. */
export function readThermalsIfAny(): {
  temperature: number | null;
  available: boolean;
  error?: string;
} {
  return { temperature: null, available: false, error: "not wired" };
}

/** Alias: same as readNetwork. */
export function readNetworkIfAny() {
  return readNetworkImpl();
}
