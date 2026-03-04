"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  FilterBarOrgan,
  ColumnStripOrgan,
  BoardColumnOrgan,
  SelectionBarOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Button from "@/components/molecules/button.compound";
import Card from "@/components/molecules/card.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction, orderItemsById, ORGAN_CARD_PLACEHOLDER_PARAMS } from "./shared";

const LAYOUT_ROOT = "organism-root";
const LAYOUT_LIST = "organ-listcontent";

function getBoardColumns(
  tree: { id: string; name: string; children?: { id: string; name: string }[] }[]
): { id: string; name: string }[] {
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
          "toolbar.actions": <Card content={{ title: "Board actions" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Board" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="board-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Board nav" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
        <Section layout={LAYOUT_LIST} role={LAYOUT_LIST} id="board-content">
          <FilterBarOrgan organId="filterBar" slots={{ "filterBar.controls": <Card content={{ title: "Filters" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction} />
          <ColumnStripOrgan organId="columnStrip" slots={{ "columnStrip.title": <Card content={{ title: "Board" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} /> }} onAction={onAction}>
            {columns.length > 0
              ? columns.map((col) => {
                  const cards = orderedItems.filter((i: { categoryId?: string }) => i.categoryId === col.id);
                  return (
                    <BoardColumnOrgan
                      key={col.id}
                      organId="boardColumn"
                      slots={{
                        "boardColumn.header": <Card content={{ title: col.name }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                        "boardColumn.cards": (
                          <>
                            {cards.map((card: { id: string; title?: string }) => (
                              <Section key={card.id} layout="organ-filterbar" role="organ-filterbar" id={card.id}>
                                <Card content={{ title: card.title }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />
                                <Button
                                  content={{ label: "×" }}
                                  behavior={{ type: "Action", params: { name: "structure:deleteItem", id: card.id } }}
                                />
                                {columns
                                  .filter((c) => c.id !== col.id)
                                  .map((other) => (
                                    <Button
                                      key={other.id}
                                      content={{ label: `→ ${other.name}` }}
                                      behavior={{
                                        type: "Action",
                                        params: { name: "structure:moveItem", id: card.id, toContainerId: other.id },
                                      }}
                                    />
                                  ))}
                              </Section>
                            ))}
                          </>
                        ),
                        "boardColumn.footer": <Card content={{ title: "Add card" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                      }}
                      onAction={onAction}
                    />
                  );
                })
              : (
                <BoardColumnOrgan
                  organId="boardColumn"
                  slots={{
                    "boardColumn.header": <Card content={{ title: "No columns" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                    "boardColumn.cards": <Card content={{ title: "Add column with structure:addTreeNode (parentId: life)" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />,
                    "boardColumn.footer": null,
                  }}
                  onAction={onAction}
                />
              )}
          </ColumnStripOrgan>
          <SelectionBarOrgan
            organId="selectionBar"
            slots={{ "selectionBar.label": <Card content={{ title: "0 selected" }} params={ORGAN_CARD_PLACEHOLDER_PARAMS} />, "selectionBar.actions": null }}
            onAction={onAction}
          />
        </Section>
      </Section>
    </>
  );
}
