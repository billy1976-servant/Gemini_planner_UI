"use client";

import React, { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, WizardStepStripOrgan, WizardStepContentOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { readEngineState, subscribeEngineState } from "@/logic/runtime/engine-bridge";
import { createOnAction } from "./shared";

const FLOW_ID = "default";
const STEP_COUNT = 4;

export function WizardOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const engine = useSyncExternalStore(subscribeEngineState, readEngineState, readEngineState);
  const onAction = React.useMemo(() => createOnAction(), []);
  useEffect(() => {
    const countKey = `wizardStepCount_${FLOW_ID}`;
    const current = getState()?.values?.[countKey];
    if (current === undefined) {
      onAction("state.update", { key: countKey, value: STEP_COUNT });
    }
  }, [onAction]);
  const flow = engine?.currentFlow;
  const stepIndex =
    flow?.steps?.length != null
      ? (typeof engine.currentStepIndex === "number" ? engine.currentStepIndex : 0)
      : (state?.values?.[`wizardStepIndex_${FLOW_ID}`] ?? 0);
  const steps = flow?.steps?.length ?? STEP_COUNT;
  const current = Math.min(stepIndex, steps - 1);

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>Wizard</span>,
          "toolbar.breadcrumb": <span>Home / Wizard</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column" }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Wizard nav</div> }} onAction={onAction} />
        <WizardStepStripOrgan
          organId="wizardStepStrip"
          slots={{
            "wizardStepStrip.steps": (
              <span>
                Step {current + 1} of {steps}
              </span>
            ),
            "wizardStepStrip.nav": (
              <span style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" disabled={current <= 0} onClick={() => onAction("wizard:prev", { flowId: FLOW_ID })}>
                  Prev
                </button>
                <button type="button" disabled={current >= steps - 1} onClick={() => onAction("wizard:next", { flowId: FLOW_ID })}>
                  Next
                </button>
                <button type="button" onClick={() => onAction("wizard:goTo", { flowId: FLOW_ID, stepIndex: 0 })}>
                  Go to 1
                </button>
              </span>
            ),
          }}
          onAction={onAction}
        />
        <WizardStepContentOrgan
          organId="wizardStepContent"
          slots={{
            "wizardStepContent.body": (
              <div style={{ padding: "1rem" }}>
                <p>Step {current + 1} content. Use Prev/Next or Go to 1.</p>
              </div>
            ),
          }}
          onAction={onAction}
        />
      </div>
    </>
  );
}
