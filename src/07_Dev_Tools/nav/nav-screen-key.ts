/**
 * Single source of truth for nav state key (layoutByScreen[key].navTargets).
 * Use everywhere: DevNavigationPanel (via prop from page), TsxNavCapture, dev page, JSON renderer.
 */
export function getCanonicalNavScreenKey(
  screen: string | null,
  options?: { json?: unknown }
): string {
  if (screen && screen.trim()) {
    return screen.replace(/[^a-zA-Z0-9]/g, "-");
  }
  if (options?.json != null) {
    const str = JSON.stringify(options.json);
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    return `screen-${Math.abs(hash).toString(36)}`;
  }
  return "tsx-screen";
}
