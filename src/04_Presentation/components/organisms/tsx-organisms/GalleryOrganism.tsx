"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  FilterBarOrgan,
  GalleryGridOrgan,
  LightboxOrgan,
  ModalOrgan,
  SelectionBarOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById } from "./shared";

const LAYOUT_ROOT = "organism-root";
const LAYOUT_LIST = "organ-listcontent";
const LAYOUT_MODAL = "organism-modal-overlay";

export function GalleryOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const itemOrder = structure?.itemOrder;
  const ordered = orderItemsById(items, itemOrder);
  const lightboxId = state?.values?.galleryLightboxId as string | undefined;
  const lightboxItem = items.find((i: { id: string }) => i.id === lightboxId);

  const galleryItems = ordered.map((item: { id: string; title?: string }, idx: number) => (
    <ToolbarOrgan
      key={item.id}
      organId="toolbar"
      slots={{
        "toolbar.actions": (
          <>
            <Button
              content={{ label: "View" }}
              behavior={{ type: "Action", params: { name: "state.update", key: "galleryLightboxId", value: item.id } }}
            />
            <Button
              content={{ label: "↑" }}
              behavior={{ type: "Action", params: { name: "structure:reorderItems", fromIndex: idx, toIndex: idx - 1 } }}
            />
            <Button
              content={{ label: "↓" }}
              behavior={{ type: "Action", params: { name: "structure:reorderItems", fromIndex: idx, toIndex: idx + 1 } }}
            />
            <Button
              content={{ label: "×" }}
              behavior={{ type: "Action", params: { name: "structure:deleteItem", id: item.id } }}
            />
          </>
        ),
        "toolbar.breadcrumb": <Card content={{ title: item.title }} />,
        "toolbar.viewToggles": null,
      }}
      onAction={onAction}
    />
  ));

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <Card content={{ title: "Gallery actions" }} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Gallery" }} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="gallery-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Gallery nav" }} /> }} onAction={onAction} />
        <Section layout={LAYOUT_LIST} role={LAYOUT_LIST} id="gallery-content">
          <FilterBarOrgan organId="filterBar" slots={{ "filterBar.controls": <Card content={{ title: "Filters" }} /> }} onAction={onAction} />
          <GalleryGridOrgan
            organId="galleryGrid"
            slots={{
              "galleryGrid.header": <Card content={{ title: "Gallery" }} />,
              "galleryGrid.items": galleryItems.length > 0 ? galleryItems : null,
              "galleryGrid.emptyState": <Card content={{ title: "No items" }} />,
            }}
            onAction={onAction}
          />
          <SelectionBarOrgan
            organId="selectionBar"
            slots={{ "selectionBar.label": <Card content={{ title: "0 selected" }} />, "selectionBar.actions": null }}
            onAction={onAction}
          />
        </Section>
      </Section>
      {lightboxId && (
        <Section layout={LAYOUT_MODAL} role={LAYOUT_MODAL} id="gallery-lightbox">
          <ModalOrgan
            organId="modal"
            slots={{
              "modal.title": <Card content={{ title: "View" }} />,
              "modal.content": (
                <>
                  <LightboxOrgan
                    organId="lightbox"
                    slots={{
                      "lightbox.item": <Card content={{ title: lightboxItem?.title ?? lightboxId }} />,
                      "lightbox.caption": <Card content={{ title: "Caption" }} />,
                    }}
                    onAction={onAction}
                  />
                  <Button
                    content={{ label: "Close" }}
                    behavior={{ type: "Action", params: { name: "state.update", key: "galleryLightboxId", value: null } }}
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
