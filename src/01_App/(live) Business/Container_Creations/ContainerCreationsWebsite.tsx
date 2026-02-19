"use client";

/**
 * Container Creations website — TSX screen registered in the experience system.
 * Uses global layout engine (TSXScreenWithEnvelope from dev page) and global palette (state + palette-store).
 * Syncs contract.palette to global state so envelope and Palette Contract Inspector use the same source.
 */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { WebsiteTemplate } from "@/04_Presentation/components/organs/tsx/website/WebsiteTemplate";
import { validateTsxWebsiteContract } from "@/04_Presentation/components/organs/tsx/website/validateContract";
import { setDevWebsiteNodeOrder } from "@/app/ui/control-dock/dev-right-sidebar-store";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { setPalette } from "@/engine/core/palette-store";
import type { TsxWebsiteContract } from "@/04_Presentation/components/organs/tsx/website/types";

export default function ContainerCreationsWebsite() {
  const searchParams = useSearchParams();
  const screenPath = searchParams.get("screen") ?? "tsx:(live) Business/Container_Creations/ContainerCreationsWebsite";
  const [contract, setContract] = useState<TsxWebsiteContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const experience = (stateSnapshot?.values?.experience as string) ?? "website";

  useEffect(() => {
    fetch("/api/sites/containercreations/contract")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: unknown) => {
        const validation = validateTsxWebsiteContract(data);
        if (!validation.valid && validation.errors.length > 0 && process.env.NODE_ENV === "development") {
          console.warn("[ContainerCreationsWebsite] contract validation:", validation.errors);
        }
        setContract(data as TsxWebsiteContract);
        setError(null);
        dispatchState("state.update", { key: "paletteName", value: validation.resolvedPaletteName });
        setPalette(validation.resolvedPaletteName);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load contract");
        setContract(null);
      });
  }, []);

  useEffect(() => {
    if (contract?.nodeOrder) {
      setDevWebsiteNodeOrder(screenPath, contract.nodeOrder);
    }
  }, [contract?.nodeOrder, screenPath]);

  if (error) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-primary)" }}>
        Error: {error}
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-secondary)" }}>
        Loading…
      </div>
    );
  }

  return (
    <WebsiteTemplate
      contract={contract}
      screenPath={screenPath}
      experience={experience}
    />
  );
}
