"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  FilterBarOrgan,
  PaginationBarOrgan,
  SelectionBarOrgan,
  ListContentOrgan,
} from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById } from "./shared";

export function ListOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const itemOrder = structure?.itemOrder;
  const ordered = orderItemsById(items, itemOrder);

  const listItems = (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {ordered.map((item, idx) => (
        <li
          key={item.id}
          style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>{item.title || item.id}</span>
          <span style={{ display: "flex", gap: "0.25rem" }}>
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => onAction("structure:reorderItems", { fromIndex: idx, toIndex: idx - 1 })}
            >
              Up
            </button>
            <button
              type="button"
              disabled={idx === ordered.length - 1}
              onClick={() => onAction("structure:reorderItems", { fromIndex: idx, toIndex: idx + 1 })}
            >
              Down
            </button>
            <button type="button" onClick={() => onAction("structure:deleteItem", { id: item.id })}>
              Delete
            </button>
          </span>
        </li>
      ))}
      {ordered.length === 0 && <li style={{ padding: "0.5rem 0.75rem", color: "#666" }}>No items. Add with structure:addItem.</li>}
    </ul>
  );

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>List actions</span>,
          "toolbar.breadcrumb": <span>Home / List</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Sidebar</div> }} onAction={onAction} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <FilterBarOrgan organId="filterBar" slots={{ "filterBar.controls": <span>Filters</span> }} onAction={onAction} />
          <ListContentOrgan
            organId="listContent"
            slots={{
              "listContent.header": <strong>List</strong>,
              "listContent.items": listItems,
            }}
            onAction={onAction}
          />
          <PaginationBarOrgan
            organId="paginationBar"
            slots={{ "paginationBar.label": <span>Page 1</span>, "paginationBar.extra": <span /> }}
            onAction={onAction}
          />
          <SelectionBarOrgan
            organId="selectionBar"
            slots={{ "selectionBar.label": <span>0 selected</span>, "selectionBar.actions": <span /> }}
            onAction={onAction}
          />
        </div>
      </div>
    </>
  );
}
