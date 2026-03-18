"use client";

import React, { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
import { getEditorMode, subscribeEditorMode } from "@/07_Dev_Tools/editor/editor-mode-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";
import {
  getDevSidebarProps,
  subscribeDevSidebarProps,
  setSelectedFlowNodeId,
  setDevFlowConfig,
  updateFlowNode,
} from "@/app/ui/control-dock/dev-right-sidebar-store";
import type { FlowConfig } from "@/engine/onboarding/flow-engine/types";

export type DevFlowAdapterValue = {
  screenPath: string;
  editorMode: ReturnType<typeof getEditorMode>;
  deviceMode: ReturnType<typeof getDevicePreviewMode>;
  flowConfig: FlowConfig | null;
  selectedFlowNodeId: string | null;
  currentScreenId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (nodeId: string, updates: Partial<FlowConfig["screens"][number]>) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function useDevFlowAdapter(screenPath: string): DevFlowAdapterValue {
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const deviceMode = useSyncExternalStore(subscribeDevicePreviewMode, getDevicePreviewMode, getDevicePreviewMode);
  const devProps = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);

  const flowConfig = devProps?.flowScreenPath === screenPath ? (devProps.flowConfig ?? null) : null;
  const selectedFlowNodeId = devProps?.flowScreenPath === screenPath ? (devProps.selectedFlowNodeId ?? null) : null;

  const currentScreenId = useMemo(() => {
    if (!flowConfig?.screens?.length) return null;
    if (selectedFlowNodeId && flowConfig.screens.some((s) => s.id === selectedFlowNodeId)) {
      return selectedFlowNodeId;
    }
    return flowConfig.screens[0].id;
  }, [flowConfig, selectedFlowNodeId]);

  const onSelect = useCallback(
    (id: string) => {
      setSelectedFlowNodeId(id);
    },
    []
  );

  const onUpdate = useCallback(
    (nodeId: string, updates: Partial<FlowConfig["screens"][number]>) => {
      updateFlowNode(screenPath, nodeId, updates);
    },
    [screenPath]
  );

  const onReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const config = flowConfig;
      if (!config?.screens?.length) return;
      const from = clamp(fromIndex, 0, config.screens.length - 1);
      const to = clamp(toIndex, 0, config.screens.length - 1);
      if (from === to) return;
      const nextScreens = [...config.screens];
      const [moved] = nextScreens.splice(from, 1);
      nextScreens.splice(to, 0, moved);
      setDevFlowConfig({ ...config, screens: nextScreens });
    },
    [flowConfig]
  );

  return {
    screenPath,
    editorMode,
    deviceMode,
    flowConfig,
    selectedFlowNodeId,
    currentScreenId,
    onSelect,
    onUpdate,
    onReorder,
  };
}

