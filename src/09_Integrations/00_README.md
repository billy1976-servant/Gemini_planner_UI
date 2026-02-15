# 09_Integrations — Authority Layer for Device Integrations

**Purpose:** This folder is the single authority for all device and environment integrations in HiSense. Every sensor read, bridge, and device hook must go through this layer. New integrations are added here and exposed via the facade in `04_FACADE/`; existing System7 sensors and bridges are wrapped, not replaced, so current imports keep working.

**Authority rule:** All device hooks (motion, orientation, location, camera, audio, battery, network, device/screen, lifecycle) are consumed via `04_FACADE/integrations.ts`. Callers should import from `@/09_Integrations/04_FACADE/integrations` (or the facade re-export) rather than from `03_Runtime/engine/system7/sensors/*` directly when adding new features. Existing code may continue to use legacy paths until migrated; no mass import rewrite is required.
