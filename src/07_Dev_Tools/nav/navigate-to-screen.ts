/**
 * Stateless navigation utility for Screen-ID system.
 * No React state; no subscribe/listeners. SSR-safe.
 *
 * Dev mode: route stays /dev, ?screen=<path>
 * User mode: route uses /?screen=<id>
 */

import { getScreenById, getScreenIdByPath } from "./screen-registry";

export type NavOpts = { replace?: boolean; anchor?: string };

/**
 * Build URL for dev mode: /dev?screen=<path>&mode=... (preserve other params).
 */
export function buildDevUrl(
  screenPath: string,
  currentSearch: string,
  opts?: { mode?: string }
): string {
  const params = new URLSearchParams(typeof currentSearch === "string" ? currentSearch : "");
  params.set("screen", screenPath);
  if (opts?.mode) params.set("mode", opts.mode);
  return `/dev?${params.toString()}`;
}

/**
 * Build URL for user mode: /?screen=<id>
 */
export function buildUserUrl(screenId: string, _currentSearch?: string): string {
  const params = new URLSearchParams();
  params.set("screen", screenId);
  return `/?${params.toString()}`;
}

/**
 * Navigate to a screen by id or path. Uses router.push or router.replace.
 * Resolves screenId to path in dev (path in query); in user mode uses id in query.
 */
export function goToScreen(
  router: { push: (url: string, opts?: { scroll?: boolean }) => void; replace: (url: string, opts?: { scroll?: boolean }) => void },
  screenIdOrPath: string,
  opts: NavOpts & { devMode?: "dev" | "user"; currentSearch?: string } = {}
): void {
  const { replace = false, anchor, devMode = "dev", currentSearch = "" } = opts;
  const path = getScreenById(screenIdOrPath)?.path ?? screenIdOrPath;
  const id = getScreenIdByPath(screenIdOrPath) || getScreenIdByPath(path) || screenIdOrPath;
  const url =
    devMode === "dev"
      ? buildDevUrl(path, currentSearch)
      : buildUserUrl(id, currentSearch);
  const full = anchor ? `${url}#${encodeURIComponent(anchor)}` : url;
  if (replace) router.replace(full, { scroll: false });
  else router.push(full, { scroll: false });
}
