"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, TimelineRulerOrgan, TimelineLaneStripOrgan, TimelineLaneOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

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
          "toolbar.actions": <span>Timeline actions</span>,
          "toolbar.breadcrumb": <span>Home / Timeline</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Timeline nav</div> }} onAction={onAction} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <TimelineRulerOrgan organId="timelineRuler" slots={{ "timelineRuler.label": <span>Timeline</span> }} onAction={onAction} />
          <TimelineLaneStripOrgan organId="timelineLaneStrip" slots={{ "timelineLaneStrip.title": <strong>Lanes</strong> }} onAction={onAction}>
            {dateKeys.length > 0 ? (
              dateKeys.map((date) => (
                <TimelineLaneOrgan
                  key={date}
                  organId="timelineLane"
                  slots={{
                    "timelineLane.label": <span>{date}</span>,
                    "timelineLane.events": (
                      <div>
                        {(blocksByDate[date] ?? []).map((b: any) => (
                          <div key={b.id ?? b.start} style={{ padding: "0.25rem", background: "#eee", marginBottom: 2 }}>
                            {b.label ?? b.start}
                          </div>
                        ))}
                      </div>
                    ),
                  }}
                  onAction={onAction}
                />
              ))
            ) : (
              <TimelineLaneOrgan
                organId="timelineLane"
                slots={{ "timelineLane.label": <span>No dates</span>, "timelineLane.events": <div>Use structure:setBlocksForDate</div> }}
                onAction={onAction}
              />
            )}
          </TimelineLaneStripOrgan>
        </div>
      </div>
    </>
  );
}
