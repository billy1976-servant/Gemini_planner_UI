/**
 * Converts landing-2 config (screens[] format) to json-skin tree
 * so it can be rendered via ExperienceRenderer → JsonRenderer → JsonSkinEngine.
 *
 * **Lossy export — not a full Learn bridge.** Only these content blocks are mapped:
 * `paragraph`, `badge`, `checklist` (see `mapContentBlock`). All other
 * `LandingContentBlock` types (heading, testimonial, comparison, ctaBand, etc.) are dropped.
 * Walkthrough inputs, tracker rules, presenter `presentation`, `modes`, `extraLinkKeys`, and
 * most media tuning are not represented in the output. For authoritative deck authoring use
 * `LandingDeckV1` (`src/lib/landing-deck/schema.ts`) and `LandingDeckRenderer`; use this
 * converter only when a reduced json-skin preview is acceptable.
 */

export type LandingConfig = {
  shopUrl?: string;
  header?: { logoSrc?: string; logoAlt?: string; shopNowLabel?: string };
  stepTracker?: {
    title?: string;
    description?: string;
    showResponses?: boolean;
    responsePlaceholder?: string;
    completedOnly?: boolean;
  };
  screens?: ScreenConfig[];
};

export type ScreenConfig = {
  id: string;
  stepLabel?: string;
  layout?: string;
  title?: string;
  subtitle?: string;
  content?: ContentBlock[];
  media?: MediaBlock[];
  buttons?: ButtonBlock[];
  nextScreenId?: string;
  lightTheme?: boolean;
  nodePosition?: { x: number; y: number };
  inlineControls?: string[];
  dynamicSummary?: boolean;
  dynamicSummaryConfig?: DynamicSummaryConfig;
  trackerResponse?: TrackerResponseConfig;
  /** Optional presentation hints (CSS only); forwarded when mapping to skin if needed. */
  visualTone?: "default" | "soft" | "bold";
  density?: "comfortable" | "compact";
};

type ContentBlock =
  | { type: "paragraph"; text: string; className?: string }
  | { type: "badge"; text: string }
  | { type: "checklist"; heading?: string; items?: { title: string; sub?: string }[] };

type MediaBlock =
  | { type: "video"; src: string; caption?: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "beforeAfter"; before: string; after: string; altBefore?: string; altAfter?: string };

type ButtonBlock =
  | { type: "link"; label: string; hrefKey?: string; nodeId?: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "back"; label: string; nodeId?: string }
  | { type: "next"; label: string; nodeId?: string };

type ResponseRule =
  | { type: "valueLabel"; field: string; map: Record<string, string> }
  | { type: "boolean"; field: string; trueText: string; falseText?: string }
  | { type: "numberTemplate"; field: string; template: string }
  | { type: "range"; field: string; ranges: Array<{ min?: number; max?: number; text: string }>; defaultText?: string }
  | { type: "compoundTemplate"; fields: string[]; template: string };

type TrackerResponseConfig = {
  enabled?: boolean;
  rule?: ResponseRule;
  fallbackText?: string;
};

type DynamicSummaryConfig = {
  mode?: "autoFromTrackerRules" | "lines";
  heading?: string;
  includeUnanswered?: boolean;
  lines?: Array<{ sourceStepId?: string; rule?: ResponseRule; prefix?: string }>;
};

function mapContentBlock(block: ContentBlock, index: number): any {
  if (block.type === "paragraph") {
    return {
      type: "text",
      id: `content-${index}`,
      content: { text: block.text },
      params: { variant: "body" },
    };
  }
  if (block.type === "badge") {
    return {
      type: "text",
      id: `badge-${index}`,
      content: { text: block.text },
      params: { variant: "subheadline" },
    };
  }
  if (block.type === "checklist") {
    const nodes: any[] = [];
    if (block.heading) {
      nodes.push({
        type: "text",
        id: `checklist-head-${index}`,
        content: { text: block.heading },
        params: { variant: "subheadline" },
      });
    }
    (block.items ?? []).forEach((item, i) => {
      nodes.push({
        type: "text",
        id: `checklist-${index}-${i}`,
        content: { text: item.sub ? `${item.title} — ${item.sub}` : item.title },
        params: { variant: "body" },
      });
    });
    return nodes;
  }
  return null;
}

function mapMediaBlock(block: MediaBlock, index: number): any {
  if (block.type === "video") {
    return {
      type: "video",
      id: `media-video-${index}`,
      src: block.src,
      params: { caption: block.caption, aspectRatio: "16/9", controls: true, background: "tokens.surface" },
    };
  }
  if (block.type === "image") {
    return {
      type: "image",
      id: `media-image-${index}`,
      src: block.src,
      alt: block.alt ?? "",
      params: { background: "tokens.cardBackground" },
    };
  }
  if (block.type === "beforeAfter") {
    return {
      type: "image",
      id: `media-slider-${index}`,
      src: [block.before, block.after],
      params: {
        layout: "slider",
        beforeSrc: block.before,
        afterSrc: block.after,
        altBefore: block.altBefore,
        altAfter: block.altAfter,
        background: "tokens.cardBackground",
      },
    };
  }
  return null;
}

function mapButtonBlock(block: ButtonBlock, screen: ScreenConfig, screens: ScreenConfig[], shopUrl: string, screenIndex: number): any {
  const nodeId = (block as { nodeId?: string }).nodeId ?? `btn-${screenIndex}`;
  if (block.type === "link") {
    const url = block.hrefKey === "shopUrl" ? shopUrl : (block as { href?: string }).href ?? shopUrl;
    return {
      type: "button",
      id: nodeId,
      content: { label: block.label },
      behavior: { params: { openUrl: url } },
    };
  }
  if (block.type === "goto") {
    return {
      type: "button",
      id: nodeId,
      content: { label: block.label },
      behavior: { params: { gotoScreenId: block.target } },
    };
  }
  if (block.type === "back") {
    const prevId = screenIndex > 0 ? screens[screenIndex - 1].id : screen.id;
    return {
      type: "button",
      id: nodeId,
      content: { label: block.label },
      behavior: { params: { gotoScreenId: prevId } },
    };
  }
  if (block.type === "next") {
    const nextId = screen.nextScreenId ?? (screenIndex < screens.length - 1 ? screens[screenIndex + 1].id : screen.id);
    return {
      type: "button",
      id: nodeId,
      content: { label: block.label },
      behavior: { params: { gotoScreenId: nextId } },
    };
  }
  return null;
}

/**
 * Convert LandingConfig (screens[] format) to a json-skin document.
 * State uses currentScreenId; sections use when: { state: "currentScreenId", equals: screen.id }.
 */
export function convertLandingConfigToJsonSkin(config: LandingConfig): {
  id: string;
  palette: string;
  state: Record<string, unknown>;
  root: { type: string; id: string; children: any[] };
} {
  const screens = config.screens ?? [];
  const shopUrl = config.shopUrl ?? "https://containercreations.com";
  const firstId = screens.length > 0 ? screens[0].id : "intro";

  const sections: any[] = screens.map((screen, screenIndex) => {
    const children: any[] = [];
    const isHero = (screen.layout ?? "contained") === "hero";
    const useTokenColor = isHero || screen.lightTheme === true;

    if (screen.title) {
      children.push({
        type: "text",
        id: `title-${screen.id}`,
        content: { text: screen.title },
        params: { variant: "headline", ...(useTokenColor ? { color: "tokens.textPrimary" } : {}) },
      });
    }
    if (screen.subtitle) {
      children.push({
        type: "text",
        id: `subtitle-${screen.id}`,
        content: { text: screen.subtitle },
        params: { variant: "subheadline", ...(useTokenColor ? { color: "tokens.textPrimary" } : {}) },
      });
    }

    (screen.content ?? []).forEach((block, i) => {
      const mapped = mapContentBlock(block, i);
      if (Array.isArray(mapped)) {
        children.push(...mapped);
      } else if (mapped) {
        children.push(mapped);
      }
    });

    (screen.media ?? []).forEach((block, i) => {
      const mapped = mapMediaBlock(block, i);
      if (mapped) children.push(mapped);
    });

    (screen.buttons ?? []).forEach((block) => {
      const mapped = mapButtonBlock(block, screen, screens, shopUrl, screenIndex);
      if (mapped) children.push(mapped);
    });

    const layout = screen.layout ?? "contained";
    const containerLayout = layout === "hero" ? "full" : "contained";
    const wrapStyle = layout === "hero" ? "none" : "card";

    return {
      id: screen.id,
      type: "section",
      role: layout,
      when: { state: "currentScreenId", equals: screen.id },
      params: {
        containerLayout,
        wrapStyle,
      },
      children,
    };
  });

  return {
    id: "container-creations-landing",
    palette: "container-creations",
    state: {
      currentScreenId: firstId,
    },
    root: {
      type: "json-skin",
      id: "container-creations-landing",
      children: sections,
    },
  };
}
