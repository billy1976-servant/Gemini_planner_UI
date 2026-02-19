"use client";
import FlowRenderer from "@/logic/flow-runtime/FlowRenderer";
import localFlow from "./generated.flow-Gibson.json";

export default function GibsonLanding() {
  return (
    <FlowRenderer
      overrideFlow={localFlow}
      screenId="Gibson_Landing"
    />
  );
}