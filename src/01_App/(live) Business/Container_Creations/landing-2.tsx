"use client";

import ContainerCreationsLandingRenderer from "./ContainerCreationsLandingRenderer";

/**
 * `/landing-2` entry: thin wrapper around the shared Container Creations landing renderer.
 * JSON: `landing-2.json` via API `version=2` (or legacy `variant` query when present).
 */
export default function Landing2() {
  return <ContainerCreationsLandingRenderer componentName="landing-2" configVersion="2" />;
}
