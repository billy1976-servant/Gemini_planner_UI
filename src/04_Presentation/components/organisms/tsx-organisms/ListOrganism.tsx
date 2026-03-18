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
  ModalOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById, ORGAN_CARD_PLACEHOLDER_PARAMS } from "./shared";

const LAYOUT_ROOT = "organism-root";
const LAYOUT_MODAL = "organism-modal-overlay";
const LAYOUT_LIST = "organ-listcontent";

export function ListOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const itemOrder = structure?.itemOrder;
  const ordered = orderItemsById(items, itemOrder);
  const confirmDeleteId = state?.values?.listConfirmDeleteId as string | undefined;

  const listItems = ordered.map((item, idx) => (
    <ToolbarOrgan
      key={item.id}
      organId="toolbar"
      slots={{
        "toolbar.actions": (
          <>
            <Button
              content={{ label: "Up" }}
              behavior={{ type: "Action", params: { name: "structure:reorderItems", fromIndex: idx, toIndex: idx - 1 } }}
            />
            <Button
              content={{ label: "Down" }}
              behavior={{ type: "Action", params: { name: "structure:reorderItems", fromIndex: idx, toIndex: idx + 1 } }}
            />
            <Button
              content={{ label: "Delete" }}
              behavior={{ type: "Action", params: { name: "state.update", key: "listConfirmDeleteId", value: item.id } }}
            />
          </>
        ),
        "toolbar.breadcrumb": <Card content={{ title: (item as { id: string; title?: string }).title || item.id }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        "toolbar.viewToggles": null,
      }}
      onAction={onAction}
    />
  ));

  const emptyRow = (
    <Card content={{ title: "No items. Add with structure:addItem." }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
  );

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": (
            <Button
              content={{ label: "Add" }}
              behavior={{
                type: "Action",
                params: {
                  name: "structure:addItem",
                  title: `Item ${Date.now()}`,
                  id: `item-${Date.now()}`,
                },
              }}
            />
          ),
          "toolbar.breadcrumb": <Card content={{ title: "Home / List" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="list-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Sidebar" }} /> }} onAction={onAction} />
        <Section layout={LAYOUT_LIST} role={LAYOUT_LIST} id="list-content">
          <FilterBarOrgan organId="filterBar" slots={{ "filterBar.controls": <Card content={{ title: "Filters" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
          <ListContentOrgan
            organId="listContent"
            slots={{
              "listContent.header": <Card content={{ title: "List" }} />,
              "listContent.items": listItems.length > 0 ? listItems : null,
              "listContent.emptyState": emptyRow,
            }}
            onAction={onAction}
          />
          <PaginationBarOrgan
            organId="paginationBar"
            slots={{ "paginationBar.label": <Card content={{ title: "Page 1" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />, "paginationBar.extra": null }}
            onAction={onAction}
          />
          <SelectionBarOrgan
            organId="selectionBar"
            slots={{ "selectionBar.label": <Card content={{ title: "0 selected" }} />, "selectionBar.actions": null }}
            onAction={onAction}
          />
        </Section>
      </Section>
      {confirmDeleteId && (
        <Section layout={LAYOUT_MODAL} role={LAYOUT_MODAL} id="confirm-modal">
          <ModalOrgan
            organId="modal"
            slots={{
              "modal.title": <Card content={{ title: "Confirm delete" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
              "modal.content": (
                <>
                  <Button
                    content={{ label: "Confirm" }}
                    behavior={{
                      type: "Action",
                      params: {
                        name: "structure:deleteItem",
                        id: confirmDeleteId,
                      },
                    }}
                  />
                  <Button
                    content={{ label: "Cancel" }}
                    behavior={{
                      type: "Action",
                      params: { name: "state.update", key: "listConfirmDeleteId", value: null },
                    }}
                  />
                </>
              ),
            }}
            onAction={onAction}
          />
        </Section>
      )}
    </>
  );
}
