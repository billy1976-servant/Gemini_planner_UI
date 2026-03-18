import { NextResponse } from "next/server";

/**
 * Example prayer flow config using the same screen schema as Container Creations.
 * Used by PrayerFlowWrapper with configUrl="/api/prayer-flow-config".
 */

const PRAYER_FLOW_CONFIG = {
  id: "prayer-onboarding",
  title: "Prayer & Disciple Flow",
  stepTracker: {
    title: "Getting Started",
    description: "Follow the steps below.",
  },
  screens: [
    {
      id: "welcome",
      stepLabel: "Welcome",
      layout: "hero",
      title: "Welcome to Prayer",
      subtitle: "Listen, record, and join live rooms.",
      content: [
        { type: "badge", text: "Prayer • Live • Community" },
        {
          type: "paragraph",
          text: "Start by listening to a recent prayer or join a live room.",
        },
      ],
      media: [],
      buttons: [
        { type: "goto", label: "Browse prayers", target: "library" },
        {
          type: "action",
          label: "Join live room",
          action: "openPrayerRoom",
          params: {},
        },
      ],
      nextScreenId: "library",
    },
    {
      id: "library",
      stepLabel: "Library",
      layout: "twoCol",
      title: "Past prayers",
      content: [
        {
          type: "paragraph",
          text: "Content driven by list engine; data from API.",
        },
      ],
      media: [],
      buttons: [
        { type: "back", label: "Back" },
        { type: "next", label: "Continue to Live" },
      ],
      nextScreenId: "live",
    },
    {
      id: "live",
      stepLabel: "Live",
      layout: "stamped",
      title: "Live prayer rooms",
      content: [
        {
          type: "paragraph",
          text: "Join or start a live room. When you start, you enter the room.",
        },
      ],
      media: [],
      buttons: [
        { type: "back", label: "Back" },
        {
          type: "action",
          label: "Start room",
          action: "openPrayerRoom",
        },
      ],
    },
  ],
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(PRAYER_FLOW_CONFIG, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
