"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, DetailContentOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

export function DetailOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const selectedId = state?.values?.detailSelectedId;
  const selected = items.find((i: any) => i.id === selectedId) ?? items[0];

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>Detail actions</span>,
          "toolbar.breadcrumb": <span>Home / Detail</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Detail nav</div> }} onAction={onAction} />
        <DetailContentOrgan
          organId="detailContent"
          slots={{
            "detailContent.body": selected ? (
              <div style={{ padding: "1rem" }}>
                <h2>{selected.title}</h2>
                <p>ID: {selected.id}</p>
                <p>Category: {selected.categoryId}</p>
                <button type="button" onClick={() => onAction("structure:deleteItem", { id: selected.id })}>
                  Delete
                </button>
              </div>
            ) : (
              <div>No item selected. Set values.detailSelectedId or add structure items.</div>
            ),
            "detailContent.emptyState": <div>No selection</div>,
          }}
          onAction={onAction}
        />
      </div>
    </>
  );
}
