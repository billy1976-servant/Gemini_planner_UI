"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, EditorContentOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

export function EditorOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const draft = state?.values?.editorDraft ?? "";

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <span>Editor actions</span>,
          "toolbar.breadcrumb": <span>Home / Editor</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Editor nav</div> }} onAction={onAction} />
        <EditorContentOrgan
          organId="editorContent"
          slots={{
            "editorContent.toolbar": <span>Format</span>,
            "editorContent.body": (
              <textarea
                value={draft}
                onChange={(e) => onAction("state.update", { key: "editorDraft", value: e.target.value })}
                style={{ width: "100%", minHeight: 200, padding: "0.5rem" }}
                placeholder="Editor content (state.update → editorDraft)"
              />
            ),
          }}
          onAction={onAction}
        />
      </div>
    </>
  );
}
