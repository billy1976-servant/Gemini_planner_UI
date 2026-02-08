// src/engine/system7/channels/identity.channel.ts
export default function identityChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "identity",
    data,
    children: [
      { key: "userId", value: data.userId || null },
      { key: "name", value: data.name || "" },
      { key: "role", value: data.role || "guest" }
    ]
  };
}
