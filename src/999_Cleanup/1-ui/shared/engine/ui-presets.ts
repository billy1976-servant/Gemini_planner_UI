import google from "../global-styles/google.json";

export type UIPreset = typeof google;

export function getUIPreset(name: string): UIPreset {
  switch (name) {
    case "google":
      return google;
    default:
      return google;
  }
}

