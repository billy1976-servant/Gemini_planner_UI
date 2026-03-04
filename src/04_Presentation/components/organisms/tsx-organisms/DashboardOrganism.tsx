"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  GridLayoutOrgan,
  WidgetCellOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, ORGAN_CARD_PLACEHOLDER_PARAMS } from "./shared";

const SCREEN_KEY = "tsx-dashboard";
const LAYOUT_ROOT = "organism-root";
const LAYOUT_LIST = "organ-listcontent";

export function DashboardOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const layout = state?.dashboardLayout?.[SCREEN_KEY]?.widgets ?? [];

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": (
            <Button
              content={{ label: "Add widget" }}
              behavior={{
                type: "Action",
                params: {
                  name: "dashboard:addWidget",
                  screenKey: SCREEN_KEY,
                  widgetId: `w-${Date.now()}`,
                  rect: { x: 0, y: 0, w: 2, h: 1 },
                },
              }}
            />
          ),
          "toolbar.breadcrumb": <Card content={{ title: "Home / Dashboard" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="dashboard-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Dashboard nav" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
        <Section layout={LAYOUT_LIST} role={LAYOUT_LIST} id="dashboard-grid">
        <GridLayoutOrgan
          organId="gridLayout"
          slots={{ "gridLayout.title": <Card content={{ title: "Dashboard" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }}
          onAction={onAction}
        >
          {layout.map((w: { id: string; w?: number; h?: number }) => (
            <WidgetCellOrgan
              key={w.id}
              organId="widgetCell"
              slots={{
                "widgetCell.content": (
                  <>
                    <Card content={{ title: `Widget ${w.id}` }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
                    <Button
                      content={{ label: "Remove" }}
                      behavior={{
                        type: "Action",
                        params: { name: "dashboard:removeWidget", screenKey: SCREEN_KEY, widgetId: w.id },
                      }}
                    />
                  </>
                ),
              }}
              onAction={onAction}
            />
          ))}
          {layout.length === 0 && (
            <Card content={{ title: "No widgets. Click \"Add widget\" in the toolbar." }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
          )}
        </GridLayoutOrgan>
        </Section>
      </Section>
    </>
  );
}
