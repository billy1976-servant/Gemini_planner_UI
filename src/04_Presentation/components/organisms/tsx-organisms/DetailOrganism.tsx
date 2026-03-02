"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  DetailContentOrgan,
  SplitPaneOrgan,
  SelectionBarOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

const LAYOUT_ROOT = "organism-root";

export function DetailOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const selectedId = state?.values?.detailSelectedId as string | undefined;
  const selected = items.find((i: { id: string }) => i.id === selectedId) ?? items[0];

  const masterList = items.map((item: { id: string; title?: string }) => (
    <Button
      key={item.id}
      content={{ label: item.title || item.id }}
      behavior={{ type: "Action", params: { name: "state.update", key: "detailSelectedId", value: item.id } }}
    />
  ));

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <Card content={{ title: "Detail actions" }} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Detail" }} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="detail-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Detail nav" }} /> }} onAction={onAction} />
        <SplitPaneOrgan
          organId="splitPane"
          slots={{
            "splitPane.primary": (
              <Section layout="organ-detailcontent" role="organ-detailcontent" id="detail-master">
                {masterList.length > 0 ? masterList : <Card content={{ title: "No items" }} />}
              </Section>
            ),
            "splitPane.secondary": (
              <DetailContentOrgan
                organId="detailContent"
                slots={{
                  "detailContent.body": selected ? (
                    <>
                      <Card content={{ title: selected.title }} />
                      <Card content={{ title: `ID: ${selected.id}` }} />
                      <Card content={{ title: `Category: ${selected.categoryId}` }} />
                      <Button
                        content={{ label: "Delete" }}
                        behavior={{ type: "Action", params: { name: "structure:deleteItem", id: selected.id } }}
                      />
                    </>
                  ) : null,
                  "detailContent.emptyState": <Card content={{ title: "No selection" }} />,
                }}
                onAction={onAction}
              />
            ),
          }}
          onAction={onAction}
        />
      </Section>
      <SelectionBarOrgan
        organId="selectionBar"
        slots={{ "selectionBar.label": <Card content={{ title: "0 selected" }} />, "selectionBar.actions": null }}
        onAction={onAction}
      />
    </>
  );
}
