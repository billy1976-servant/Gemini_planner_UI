"use client";


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


