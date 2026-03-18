export default function parametersChannel(spec: any = {}, data: any = {}) {
  return {
    kind: "semantic",
    channel: "parameters",
    data,
    children: Object.entries(data || {}).map(([k, v]) => ({
      key: k,
      value: v
    }))
  };
}
