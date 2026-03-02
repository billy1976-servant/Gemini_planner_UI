"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import {
  ToolbarOrgan,
  SidebarOrgan,
  EditorContentOrgan,
  SplitPaneOrgan,
} from "@/components/organs/tsx-organs";
import Section from "@/components/molecules/section.compound";
import Card from "@/components/molecules/card.compound";
import Field from "@/components/molecules/field.compound";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

const LAYOUT_ROOT = "organism-root";

export function EditorOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const draft = state?.values?.editorDraft ?? "";

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": <Card content={{ title: "Editor actions" }} />,
          "toolbar.breadcrumb": <Card content={{ title: "Home / Editor" }} />,
          "toolbar.viewToggles": <Card content={{ title: "View" }} />,
        }}
        onAction={onAction}
      />
      <Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT} id="editor-main">
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <Card content={{ title: "Editor nav" }} /> }} onAction={onAction} />
        <SplitPaneOrgan
          organId="splitPane"
          slots={{
            "splitPane.primary": (
              <EditorContentOrgan
                organId="editorContent"
                slots={{
                  "editorContent.toolbar": <Card content={{ title: "Format" }} />,
                  "editorContent.body": (
                    <Field id="editorDraft" content={{ label: "Editor content (state.update → editorDraft)" }} />
                  ),
                }}
                onAction={onAction}
              />
            ),
            "splitPane.secondary": (
              <Section layout="organ-detailcontent" role="organ-detailcontent" id="editor-preview">
                <Card content={{ title: "Preview" }} />
                <Card content={{ title: draft || "—" }} />
              </Section>
            ),
          }}
          onAction={onAction}
        />
      </Section>
    </>
  );
}
