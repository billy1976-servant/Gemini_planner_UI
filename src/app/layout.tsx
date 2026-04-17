import { type ReactNode } from "react";
import { headers } from "next/headers";
import RootLayoutClient from "./RootLayoutClient";
import { isLegacyRuntimeDisabledHostname } from "@/lib/learn-public-host";

/** Public hostname for this request (custom domain), not the internal upstream host. */
function getPublicHostname(): string {
  const h = headers();
  const forwarded =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    h.get("x-vercel-forwarded-host")?.split(",")[0]?.trim() ??
    "";
  if (forwarded) return forwarded.split(":")[0]?.toLowerCase() ?? "";
  const host = h.get("host") ?? "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}

/**
 * `beforeFiles` rewrites map `learn.<app>.com/<flow>/...` → `/learn/<app>/<flow>/...` internally,
 * but the browser pathname stays `/flow/...`. Client `usePathname()` therefore does not start with
 * `/learn/`, and the root layout must key off the public host to use the same minimal shell as `/learn/*`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  const h = headers();
  const fromMwLearn = h.get("x-learn-public-host") === "1";
  const fromMwLegacy = h.get("x-legacy-runtime-disabled") === "1";
  const hostname = getPublicHostname();
  const learnPublicHost = fromMwLearn || hostname.startsWith("learn.");
  const legacyRuntimeDisabledHost = fromMwLegacy || isLegacyRuntimeDisabledHostname(hostname);
  /** Bypass `UserLayoutChrome` / dev chrome for any legacy-disabled host (learn.*, product hosts, env list). */
  const minimalPublicEntryShell = learnPublicHost || legacyRuntimeDisabledHost;
  return (
    <RootLayoutClient learnPublicHost={learnPublicHost} minimalPublicEntryShell={minimalPublicEntryShell}>
      {children}
    </RootLayoutClient>
  );
}

export const dynamic = "force-dynamic";
