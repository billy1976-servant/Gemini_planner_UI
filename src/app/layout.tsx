import { type ReactNode } from "react";
import { headers } from "next/headers";
import RootLayoutClient from "./RootLayoutClient";

/**
 * `beforeFiles` rewrites map `learn.<app>.com/<flow>/...` → `/learn/<app>/<flow>/...` internally,
 * but the browser pathname stays `/flow/...`. Client `usePathname()` therefore does not start with
 * `/learn/`, and the root layout must key off `Host` to use the same minimal shell as `/learn/*`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  const host = headers().get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const learnPublicHost = hostname.startsWith("learn.");
  return <RootLayoutClient learnPublicHost={learnPublicHost}>{children}</RootLayoutClient>;
}
