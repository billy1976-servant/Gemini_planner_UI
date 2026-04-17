import { type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RootLayoutClient from "./RootLayoutClient";

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
  const forcedCanonical = h.get("x-force-learn-canonical")?.trim() ?? "";
  const requestPathname = h.get("x-request-pathname")?.trim() ?? "";
  if (forcedCanonical && requestPathname && requestPathname !== forcedCanonical) {
    redirect(forcedCanonical);
  }
  const fromMiddleware = h.get("x-learn-public-host") === "1";
  const hostname = getPublicHostname();
  const learnPublicHost = fromMiddleware || hostname.startsWith("learn.");
  return <RootLayoutClient learnPublicHost={learnPublicHost}>{children}</RootLayoutClient>;
}

export const dynamic = "force-dynamic";
