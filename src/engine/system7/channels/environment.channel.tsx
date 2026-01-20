export default function environmentChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "environment",
    data,
    children: [
      { key: "light", value: data.light || "normal" },
      { key: "noise", value: data.noise || "normal" },
      { key: "temperature", value: data.temperature || "unknown" }
    ]
  };
}
