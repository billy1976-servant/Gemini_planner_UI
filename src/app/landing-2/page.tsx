import ContainerCreationsLandingRenderer from "@/01_App/(live) Business/Container_Creations/ContainerCreationsLandingRenderer";
import {
  parseLandingRuntimeMode,
  parseSlideBuilderFlagDefaultOn,
} from "@/lib/slide-builder-query";

type Landing2SearchParams = Record<string, string | string[] | undefined>;

function parseScreenParam(sp: Landing2SearchParams): string | null {
  const raw = sp.screen;
  if (typeof raw === "string") return raw.length ? raw : null;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length) return raw[0];
  return null;
}

export default function Landing2Page({ searchParams }: { searchParams: Landing2SearchParams }) {
  return (
    <ContainerCreationsLandingRenderer
      slideBuilderFlag={parseSlideBuilderFlagDefaultOn(searchParams.slideBuilder)}
      runtimeModeParam={parseLandingRuntimeMode(searchParams.runtimeMode) ?? undefined}
      screenParam={parseScreenParam(searchParams)}
    />
  );
}
