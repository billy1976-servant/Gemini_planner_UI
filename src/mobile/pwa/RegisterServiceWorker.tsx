"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[HI Clarify] Service worker registered", reg.scope);
      })
      .catch((err) => {
        console.warn("[HI Clarify] Service worker registration failed", err);
      });
  }, []);
  return null;
}
