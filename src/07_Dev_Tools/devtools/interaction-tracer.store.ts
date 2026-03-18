export type TraceEvent = {
  time: number;
  type: "event" | "behavior" | "action" | "state" | "layout" | "render" | "nav";
  label: string;
  payload?: any;
};

let listeners: ((e: TraceEvent) => void)[] = [];

export function trace(event: TraceEvent) {
  if (process.env.NODE_ENV !== "development") return;
  listeners.forEach((l) => l(event));
}

export function subscribeTrace(listener: (e: TraceEvent) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
