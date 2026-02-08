export default function timelineChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "timeline",
    data,
    children: [
      { key: "created", value: data.created || Date.now() },
      { key: "modified", value: data.modified || Date.now() }
    ]
  };
}
