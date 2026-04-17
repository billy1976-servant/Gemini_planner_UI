"use client";

import { loadScreen } from "@/engine/core/screen-loader";
import { isLegacyRuntimeDisabledClient } from "@/lib/learn-public-host";

/**
 * AppLoader
 * Loads ANY app screen dynamically from /public/screens/apps/.
 *
 * Example JSON usage:
 * {
 *   "type": "appLoader",
 *   "props": { "screen": "demo" }
 * }
 */
export function AppLoader({ screen }: { screen: string }) {
  async function handleClick() {
    if (typeof window !== "undefined" && isLegacyRuntimeDisabledClient()) return;
    const loaded = await loadScreen(`apps/${screen}`);
    if (!loaded) {
      console.warn("AppLoader: screen not found:", screen);
      return;
    }

    // Dispatch the result to global state (engine-runner listens for this)
    window.dispatchEvent(
      new CustomEvent("hicurv.app.load", { detail: loaded })
    );
  }

  return (
    <button onClick={handleClick}>
      Load {screen}
    </button>
  );
}

export default AppLoader;

