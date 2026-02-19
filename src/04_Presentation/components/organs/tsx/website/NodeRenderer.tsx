"use client";

import React from "react";
import { getNodeComponent } from "./NodeRegistry";
import type { TsxWebsiteNode } from "./types";

export function NodeRenderer({ node }: { node: TsxWebsiteNode }) {
  const Component = getNodeComponent(node.type);
  if (!Component) return null;
  return <Component {...(node.props ?? {})} />;
}
