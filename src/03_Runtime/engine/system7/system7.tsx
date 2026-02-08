// src/engine/system7/system7.tsx
"use client";

import type { System7Input, System7Output } from "./system7.types";
import system7Config from "./system7.config.json";
import identity from "./channels/identity.channel";
import media from "./channels/media.channel";
import content from "./channels/content.channel";
import environment from "./channels/environment.channel";
import parameters from "./channels/parameters.channel";
import style from "./channels/style.channel";
import timeline from "./channels/timeline.channel";

/**
 * System-7 aggregator.
 * Each channel returns a semantic object:
 * { kind, channel, data, children }
 */
export function System7(spec: System7Input["spec"] = {}, data: System7Input["data"] = {}): System7Output {
  return {
    kind: "system7",
    channels: {
      identity: identity(spec.identity, data.identity),
      media: media(spec.media, data.media),
      content: content(spec.content, data.content),
      environment: environment(spec.environment, data.environment),
      parameters: parameters(spec.parameters, data.parameters),
      style: style(spec.style, data.style),
      timeline: timeline(spec.timeline, data.timeline)
    }
  } as System7Output;
}
