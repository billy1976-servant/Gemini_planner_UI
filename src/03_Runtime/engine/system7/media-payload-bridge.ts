/**
 * Media payload bridge: optional provider for System7 media channel.
 * When media/camera capability is on, adapter can call getMediaPayload() to inject
 * type, uri, duration (e.g. from sensor or file input). Default returns empty;
 * implementors can plug in a real provider later.
 */

export type MediaPayload = {
  type?: string;
  uri?: string;
  duration?: number;
  [key: string]: unknown;
};

/**
 * Returns media payload for System7 media channel. Default empty; override or
 * call from adapter when a media pipeline provides current capture/selection.
 */
export function getMediaPayload(): MediaPayload {
  return {};
}
