"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  ColumnStripOrgan,
  BoardColumnOrgan,
  SelectionBarOrgan,
} from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById } from "./shared";

function getBoardColumns(tree: { id: string; name: string; children?: { id: string; name: string }[] }[]): { id: string; name: string }[] {
  const root = tree[0];
  if (root?.children?.length) return root.children.map((c) => ({ id: c.id, name: c.name }));
  return [];
}

export function BoardOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const structure = state?.values?.structure;
  const tree = structure?.tree ?? [];
  const items = Array.isArray(structure?.items) ? structure.items : [];
  const itemOrder = structure?.itemOrder;
  const columns = getBoardColumns(tree);
  const orderedItems = orderItemsById(items, itemOrder);

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>Board actions</span>,
          "toolbar.breadcrumb": <span>Home / Board</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Board nav</div> }} onAction={onAction} />
        <ColumnStripOrgan organId="columnStrip" slots={{ "columnStrip.title": <strong>Board</strong> }} onAction={onAction}>
          {columns.length > 0 ? (
            columns.map((col) => {
              const cards = orderedItems.filter((i) => i.categoryId === col.id);
              return (
                <BoardColumnOrgan
                  key={col.id}
                  organId="boardColumn"
                  slots={{
                    "boardColumn.header": <span>{col.name}</span>,
                    "boardColumn.cards": (
                      <div>
                        {cards.map((card) => (
                          <div
                            key={card.id}
                            style={{ padding: "0.5rem", marginBottom: "0.25rem", background: "#f5f5f5", borderRadius: 4 }}
                          >
                            {card.title}
                            <button
                              type="button"
                              style={{ marginLeft: "0.5rem" }}
                              onClick={() => onAction("structure:deleteItem", { id: card.id })}
                            >
                              ×
                            </button>
                            {columns.filter((c) => c.id !== col.id).map((other) => (
                              <button
                                key={other.id}
                                type="button"
                                style={{ marginLeft: "0.25rem" }}
                                onClick={() => onAction("structure:moveItem", { id: card.id, toContainerId: other.id })}
                              >
                                → {other.name}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    ),
                    "boardColumn.footer": <span>Add card</span>,
                  }}
                  onAction={onAction}
                />
              );
            })
          ) : (
            <BoardColumnOrgan
              organId="boardColumn"
              slots={{
                "boardColumn.header": <span>No columns</span>,
                "boardColumn.cards": <div>Add column with structure:addTreeNode (parentId: life)</div>,
                "boardColumn.footer": <span />,
              }}
              onAction={onAction}
            />
          )}
        </ColumnStripOrgan>
      </div>
      <SelectionBarOrgan
        organId="selectionBar"
        slots={{ "selectionBar.label": <span>0 selected</span>, "selectionBar.actions": <span /> }}
        onAction={onAction}
      />
    </>
  );
}
