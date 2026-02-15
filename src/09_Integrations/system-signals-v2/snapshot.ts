/**
 * System Signals V2 — unified system snapshot (latest battery, network, device, screen).
 * Uses existing interpret layer; does not modify it.
 */

import { getLatestInterpreted } from "../interpret";

export function getSystemSnapshot(): {
  battery: ReturnType<typeof getLatestInterpreted>;
  network: ReturnType<typeof getLatestInterpreted>;
  device: ReturnType<typeof getLatestInterpreted>;
  screen: ReturnType<typeof getLatestInterpreted>;
  t: number;
} {
  return {
    battery: getLatestInterpreted("battery"),
    network: getLatestInterpreted("network"),
    device: getLatestInterpreted("device"),
    screen: getLatestInterpreted("screen"),
    t: Date.now(),
  };
}
