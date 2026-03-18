/**
 * Container Creations — content for TSX template (Template V2).
 * No hardcoded strings in the screen; all from here.
 */
export const content = {
  defaultScreenPath: "tsx:ContainerCreations/Learn/landing/ContainerCreationsWebsite",
  apiContractPath: "/api/sites/containercreations/contract",
  labels: {
    loading: "Loading…",
    error: "Error",
    failedToLoadContract: "Failed to load contract",
  },
} as const;

export default content;
