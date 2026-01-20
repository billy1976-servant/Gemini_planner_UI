// src/engine/system7/system7-router.ts
"use client";


import { System7 } from "./system7";


export const System7Router = {
  route(channel: string, action: string, payload: any = {}) {
    console.log("🛰 System-7:", { channel, action, payload });
    // Future: channel-specific reducer logic
    return System7({ [channel]: { action } }, { [channel]: payload });
  }
};
