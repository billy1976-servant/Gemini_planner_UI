export default function contentChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "content",
    data,
    children: [
      { key: "title", value: data.title || "" },
      { key: "body", value: data.body || "" }
    ]
  };
}
