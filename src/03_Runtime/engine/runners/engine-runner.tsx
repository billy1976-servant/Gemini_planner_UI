"use client";

/**
 * Event-only; not mounted in app layout. Listens for hicurv.app.load; mounts JsonRenderer
 * when event fires. Primary render path is page.tsx → loadScreen → JsonRenderer.
 */

import React, { useEffect, useState } from "react";
import JsonRenderer from "@/engine/core/json-renderer";


export default function EngineRunner() {
  const [screen, setScreen] = useState<any>(null);


  useEffect(() => {
    const handler = (e: any) => {
      setScreen(e.detail ?? null);
    };


    window.addEventListener("hicurv.app.load", handler);
    return () => window.removeEventListener("hicurv.app.load", handler);
  }, []);


  /**
   * 🔒 CRITICAL RULE:
   * JsonRenderer MUST ALWAYS MOUNT
   * node may be null — renderer may NOT be conditional
   */
  return (
    <div>
      <JsonRenderer node={screen} />
    </div>
  );
}


