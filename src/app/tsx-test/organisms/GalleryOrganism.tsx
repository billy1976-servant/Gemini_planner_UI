"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, GalleryGridOrgan, LightboxOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById } from "./shared";

export function GalleryOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const itemOrder = structure?.itemOrder;
  const ordered = orderItemsById(items, itemOrder);
  const lightboxId = state?.values?.galleryLightboxId;

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>Gallery actions</span>,
          "toolbar.breadcrumb": <span>Home / Gallery</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Gallery nav</div> }} onAction={onAction} />
        <GalleryGridOrgan
          organId="galleryGrid"
          slots={{
            "galleryGrid.header": <strong>Gallery</strong>,
            "galleryGrid.items": (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {ordered.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: 4, display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <span>{(item as { id: string; title?: string }).title ?? item.id}</span>
                    <span style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => onAction("structure:reorderItems", { fromIndex: idx, toIndex: idx - 1 })} disabled={idx === 0}>
                        ↑
                      </button>
                      <button type="button" onClick={() => onAction("structure:reorderItems", { fromIndex: idx, toIndex: idx + 1 })} disabled={idx === ordered.length - 1}>
                        ↓
                      </button>
                      <button type="button" onClick={() => onAction("structure:deleteItem", { id: item.id })}>×</button>
                    </span>
                  </div>
                ))}
              </div>
            ),
            "galleryGrid.emptyState": <div>No items</div>,
          }}
          onAction={onAction}
        />
      </div>
      {lightboxId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LightboxOrgan
            organId="lightbox"
            slots={{
              "lightbox.item": <div>{items.find((i: any) => i.id === lightboxId)?.title ?? lightboxId}</div>,
              "lightbox.caption": <span>Caption</span>,
            }}
            onAction={(name) => name === "close" && onAction("state.update", { key: "galleryLightboxId", value: null })}
          />
          <button type="button" onClick={() => onAction("state.update", { key: "galleryLightboxId", value: null })} style={{ position: "absolute", top: 16, right: 16 }}>
            Close
          </button>
        </div>
      )}
    </>
  );
}
