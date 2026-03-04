"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  FilterBarOrgan,
  TimelineRulerOrgan,
  TimelineLaneStripOrgan,
  TimelineLaneOrgan,
  SelectionBarOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, ORGAN_CARD_PLACEHOLDER_PARAMS } from "./shared";

const LAYOUT_ROOT = "organism-root";
const LAYOUT_LIST = "organ-listcontent";

export function TimelineOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const blocksByDate = structure?.blocksByDate ?? {};
  const dateKeys = Object.keys(blocksByDate).slice(0, 3);

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <Card content={{ title: "Timeline actions" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Timeline" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="timeline-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Timeline nav" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
        <Section layout={LAYOUT_LIST} role={LAYOUT_LIST} id="timeline-content">
          <TimelineRulerOrgan organId="timelineRuler" slots={{ "timelineRuler.label": <Card content={{ title: "Timeline" }} /> }} onAction={onAction} />
          <TimelineLaneStripOrgan organId="timelineLaneStrip" slots={{ "timelineLaneStrip.title": <Card content={{ title: "Lanes" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction}>
            {dateKeys.length > 0
              ? dateKeys.map((date) => (
                  <TimelineLaneOrgan
                    key={date}
                    organId="timelineLane"
                    slots={{
                      "timelineLane.label": <Card content={{ title: date }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                      "timelineLane.events": (
                        <>
                          {(blocksByDate[date] ?? []).map((b: { id?: string; label?: string; start?: string }) => (
                            <Card key={b.id ?? b.start ?? date} content={{ title: b.label ?? b.start }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
                          ))}
                        </>
                      ),
                    }}
                    onAction={onAction}
                  />
                ))
              : (
                <TimelineLaneOrgan
                  organId="timelineLane"
                  slots={{
                    "timelineLane.label": <Card content={{ title: "No dates" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                    "timelineLane.events": <Card content={{ title: "Use structure:setBlocksForDate" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                  }}
                  onAction={onAction}
                />
              )}
          </TimelineLaneStripOrgan>
          <FilterBarOrgan organId="filterBar" slots={{ "filterBar.controls": <Card content={{ title: "Filters" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
        </Section>
      </Section>
      <SelectionBarOrgan
        organId="selectionBar"
        slots={{ "selectionBar.label": <Card content={{ title: "0 selected" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />, "selectionBar.actions": null }}
        onAction={onAction}
      />
    </>
  );
}
