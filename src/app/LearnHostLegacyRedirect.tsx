"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { buildLearnPublicRedirectPathFromWindow } from "@/lib/learn-public-host";

/** Sends accidental legacy-route hits on `learn.*` to canonical `/learn/...` (other legacy-disabled hosts return null from the builder). */
export default function LearnHostLegacyRedirect() {
  const router = useRouter();
  useLayoutEffect(() => {
    const dest = buildLearnPublicRedirectPathFromWindow();
    if (dest) router.replace(dest);
  }, [router]);
  return null;
}
