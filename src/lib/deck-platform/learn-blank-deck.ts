/**
 * Minimal landing deck JSON for a brand-new learn flow (`v1.json` in flow root).
 * Shape matches what {@link LandingDeckRenderer} expects at runtime.
 */
export function createBlankLearnDeck(args: { title: string; shopUrl?: string }): Record<string, unknown> {
  const shopUrl = args.shopUrl ?? "https://example.com";
  const title = args.title.trim() || "New learn flow";
  return {
    shopUrl,
    header: {
      logoSrc: "/favicon.ico",
      logoAlt: title,
      shopNowLabel: "Shop",
    },
    stepTracker: {
      title: "Steps",
      description: "Track progress through this flow.",
      showResponses: false,
      responsePlaceholder: "",
      completedOnly: false,
    },
    screens: [
      {
        id: "start",
        stepLabel: "Start",
        layout: "textOnly",
        title,
        subtitle: "Edit this deck in the slide builder.",
        content: [{ type: "paragraph", text: "Replace this content with your screens." }],
        buttons: [],
        nextScreenId: null,
      },
    ],
  };
}
