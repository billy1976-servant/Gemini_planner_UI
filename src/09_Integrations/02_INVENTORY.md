# 09_Integrations — Auto-Discovered Inventory

Generated from repo scan. All device integration points that should go through the facade.

---

## Motion / Orientation (gyro, accel, orientation)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| orientation | `src/03_Runtime/engine/system7/sensors/orientation.ts` | `readOrientation()` | `deviceorientation` listener; returns `{ alpha, beta, gamma, available, error? }` |
| motion | `src/03_Runtime/engine/system7/sensors/motion.ts` | `readMotion()` | `devicemotion` listener; returns `{ x, y, z, available, error? }` |

---

## Location (GPS)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| location | `src/03_Runtime/engine/system7/sensors/location.ts` | `readLocation()` | Promise; `navigator.geolocation.getCurrentPosition`; returns `{ lat, lon, accuracy, available, error? }` |

---

## Camera (capture / permissions / stream)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| camera | `src/03_Runtime/engine/system7/sensors/camera.ts` | `readCamera()` | Promise; `getUserMedia({ video: true })`; returns `{ active, stream, available, error? }` |

---

## Microphone / Audio (level / recording access)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| audio | `src/03_Runtime/engine/system7/sensors/audio.ts` | `readAudio()` | Promise; `getUserMedia({ audio: true })`; returns `{ active, stream, available, error? }` |

---

## Battery / Thermals / Network (device state)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| battery | `src/03_Runtime/engine/system7/sensors/battery.ts` | `readBattery()` | Promise; `navigator.getBattery()`; returns `{ level, charging, available, error? }` |
| network | `src/03_Runtime/engine/system7/sensors/network.ts` | `readNetwork()` | Sync; `navigator.onLine`, `connection.effectiveType`; returns `{ online, effectiveType, available, error? }` |
| device | `src/03_Runtime/engine/system7/sensors/device.ts` | `readDevice()` | Sync; `navigator.platform`, `userAgent` |
| screen | `src/03_Runtime/engine/system7/sensors/screen.ts` | `readScreen()` | Sync; `window.innerWidth/Height`, `devicePixelRatio` |

Thermals: not found (no dedicated thermal API in scanned files).

---

## App lifecycle (foreground / background)

| Id | Current file | Notes |
|----|--------------|-------|
| — | (none found) | No dedicated lifecycle listener module in system7/sensors or bridges. |

---

## System7 bridges / adapters

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| environment-bridge | `src/03_Runtime/engine/system7/environment-bridge.ts` | `getEnvironmentPayload()` | Aggregates device, location, screen, battery, network (sync; note: location/battery are async in current impl) |
| media-payload-bridge | `src/03_Runtime/engine/system7/media-payload-bridge.ts` | `getMediaPayload()` | Returns empty by default; pluggable for media channel |
| identity-auth-bridge | `src/03_Runtime/engine/system7/identity-auth-bridge.ts` | `getIdentityPayload()`, `installIdentityAuthBridge()` | Auth snapshot for System7 identity channel |

---

## Gates and capability

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| sensor-capability-gate | `src/03_Runtime/engine/system7/sensors/sensor-capability-gate.ts` | `isSensorAllowed(sensorId)`, `SensorId` | Reads capability store; lite vs full sensor sets |

---

## Universal engine adapter (payload injection)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| universal-engine-adapter | `src/05_Logic/logic/engine-system/universal-engine-adapter.ts` | `applyUniversalEngine()` | Injects getIdentityPayload, getEnvironmentPayload, getMediaPayload into System7 channel route |

---

## Other sensors (stub / optional)

| Id | Current file | Exported / hooks | Notes |
|----|--------------|------------------|-------|
| lidar | `src/03_Runtime/engine/system7/sensors/lidar.ts` | `readLidar()` | Stub: `{ supported: false, depthMap: null }` |

---

**Summary:** Motion (2), Location (1), Camera (1), Audio (1), Battery/Network/Device/Screen (4), Bridges (3), Gate (1), Adapter (1), Lidar (1). Total integration points: 15+ (each sensor + bridge counts as one; “60 components” may include internal listeners/channels — this list is the canonical set of files and exports to wrap).
