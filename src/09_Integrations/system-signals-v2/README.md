# System Signals V2

System-only signals layer (battery, network, device, screen). Uses the existing capture → input-log → interpret pipeline. Does not replace facade or calibrated sensor system.

- **registry.ts** — `SYSTEM_SIGNAL_IDS` (battery, network, device, screen).
- **snapshot.ts** — `getSystemSnapshot()` returns latest interpreted values for all system signals + `t`.
- **index.ts** — re-exports for consumers.

Planned (not implemented): thermals, memory, lifecycle. Calibrated sensors (gyro, motion, camera, audio, location) live in the separate pipeline.
