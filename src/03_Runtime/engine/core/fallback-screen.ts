/**
 * Fallback screen — valid Screen JSON tree when a requested screen fails to load.
 * Renders an error card with title, message, and hint "Open Diagnostics".
 */

export function makeFallbackScreen(params: {
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}): any {
  const { title, message, meta = {} } = params;
  const metaStr =
    Object.keys(meta).length > 0
      ? "\n" +
        Object.entries(meta)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join("\n")
      : "";

  return {
    id: "fallback-root",
    type: "screen",
    children: [
      {
        id: "fallback-section",
        type: "Section",
        role: "main",
        layout: "content-stack",
        content: {},
        children: [
          {
            type: "Section",
            content: {
              title: title,
              body: message + metaStr + "\n\nOpen Diagnostics to see all screens and errors.",
            },
            children: [],
          },
        ],
      },
    ],
    __fallback: true,
    __meta: meta,
  };
}
