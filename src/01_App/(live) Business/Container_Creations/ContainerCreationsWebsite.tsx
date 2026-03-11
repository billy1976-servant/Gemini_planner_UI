"use client";

/**
 * Container Creations website — TSX screen (Template V2).
 * Thin wrapper: fetches contract, syncs palette (wrapper only), passes props to template.
 * Template receives screenPath, experience, layoutStyle from envelope; no router/state in template.
 */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import content from "./content";
import { getCanonicalScreenKey } from "@/07_Dev_Tools/navigation/getDevScreenKey";
import { WebsiteTemplate } from "@/04_Presentation/components/organs/tsx/website/WebsiteTemplate";
import { validateTsxWebsiteContract } from "@/04_Presentation/components/organs/tsx/website/validateContract";
import { setDevWebsiteNodeOrder } from "@/app/ui/control-dock/dev-right-sidebar-store";
import { dispatchState } from "@/state/state-store";
import type { TsxWebsiteContract } from "@/04_Presentation/components/organs/tsx/website/types";

type Props = {
  screenPath?: string;
  experience?: string;
  layoutStyle?: React.CSSProperties;
};

export default function ContainerCreationsWebsite(props: Props) {
  const searchParams = useSearchParams();
  const canonicalKey = getCanonicalScreenKey(searchParams);
  const screenPath = props.screenPath ?? content.defaultScreenPath;
  const experience = props.experience ?? "website";
  const layoutStyle = props.layoutStyle;
  const [contract, setContract] = useState<TsxWebsiteContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(content.apiContractPath)
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
      })
      .catch((err) => {
        setError(err?.message ?? content.labels.failedToLoadContract);
        setContract(null);
      });
  }, []);

  useEffect(() => {
    if (contract?.nodeOrder && canonicalKey != null) {
      setDevWebsiteNodeOrder(canonicalKey, contract.nodeOrder);
    }
  }, [contract?.nodeOrder, canonicalKey]);

  if (error) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-primary)" }}>
        {content.labels.error}: {error}
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ padding: 24, color: "var(--color-text-secondary)" }}>
        {content.labels.loading}
      </div>
    );
  }

  return (
    <WebsiteTemplate
      contract={contract}
      screenPath={screenPath}
      experience={experience}
      layoutStyle={layoutStyle}
    />
  );
}
