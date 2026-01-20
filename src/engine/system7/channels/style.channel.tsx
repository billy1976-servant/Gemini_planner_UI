export default function styleChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "style",
    data,
    children: [
      { key: "theme", value: data.theme || "light" },
      { key: "density", value: data.density || 0.5 }
    ]
  };
}
