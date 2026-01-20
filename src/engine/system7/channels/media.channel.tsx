// src/engine/system7/channels/media.channel.ts
export default function mediaChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "media",
    data,
    children: [
      { key: "type", value: data.type || "none" },
      { key: "uri", value: data.uri || null },
      { key: "duration", value: data.duration || 0 }
    ]
  };
}
