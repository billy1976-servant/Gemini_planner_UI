"use client";

import React, { useEffect } from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  WizardStepStripOrgan,
  WizardStepContentOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, ORGAN_CARD_PLACEHOLDER_PARAMS } from "./shared";

const FLOW_ID = "default";
const STEP_COUNT = 4;
const LAYOUT_ROOT = "organism-root";

export function WizardOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);

  useEffect(() => {
    const countKey = `wizardStepCount_${FLOW_ID}`;
    const current = getState()?.values?.[countKey];
    if (current === undefined) {
      onAction("state.update", { key: countKey, value: STEP_COUNT });
    }
  }, [onAction]);

  const countKey = `wizardStepCount_${FLOW_ID}`;
  const indexKey = `wizardStepIndex_${FLOW_ID}`;
  const steps = typeof state?.values?.[countKey] === "number" ? state.values[countKey] : STEP_COUNT;
  const current = Math.min(
    typeof state?.values?.[indexKey] === "number" ? state.values[indexKey] : 0,
    steps - 1
  );

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <Card content={{ title: "Wizard" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Wizard" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="wizard-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Wizard nav" }} /> }} onAction={onAction} />
        <WizardStepStripOrgan
          organId="wizardStepStrip"
          slots={{
            "wizardStepStrip.steps": <Card content={{ title: `Step ${current + 1} of ${steps}` }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
            "wizardStepStrip.nav": (
              <>
                <Button
                  content={{ label: "Prev" }}
                  behavior={{ type: "Action", params: { name: "wizard:prev", flowId: FLOW_ID } }}
                />
                <Button
                  content={{ label: "Next" }}
                  behavior={{ type: "Action", params: { name: "wizard:next", flowId: FLOW_ID } }}
                />
                <Button
                  content={{ label: "Go to 1" }}
                  behavior={{ type: "Action", params: { name: "wizard:goTo", flowId: FLOW_ID, stepIndex: 0 } }}
                />
              </>
            ),
          }}
          onAction={onAction}
        />
        <WizardStepContentOrgan
          organId="wizardStepContent"
          slots={{
            "wizardStepContent.body": (
              <Card content={{ title: `Step ${current + 1} content. Use Prev/Next or Go to 1.` }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
            ),
          }}
          onAction={onAction}
        />
      </Section>
    </>
  );
}
