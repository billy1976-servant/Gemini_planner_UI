"use client";

import React, { useState, useCallback } from "react";

export interface PrayerShareProps {
  url: string;
  title?: string;
  text?: string;
}

/**
 * Subtle secondary share row: small text links, not prominent buttons.
 */
export function PrayerShare({ url, title, text }: PrayerShareProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title ?? "Prayer",
          text: text ?? "Listen to this prayer with me.",
          url,
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") copyLink();
      }
    } else {
      copyLink();
    }
  }, [url, title, text, copyLink]);

  return (
    <div className="prayer-share-row">
      <button type="button" className="prayer-share-link" onClick={copyLink} aria-label="Copy link">
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button type="button" className="prayer-share-link" onClick={share} aria-label="Share">
        Share
      </button>
    </div>
  );
}
