"use client";


import screenJson from "@/apps-offline/apps/Onboarding/trial.json";
import JsonScreenRenderer from "@/engine/core/json-renderer";
import BeautifulShell from "./beautiful-skin";


export default function TrialScreen() {
  return (
    <BeautifulShell>
      <JsonScreenRenderer node={screenJson} />
    </BeautifulShell>
  );
}


