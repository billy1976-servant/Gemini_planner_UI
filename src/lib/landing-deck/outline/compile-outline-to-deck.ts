import type { LandingContentBlock, MediaBlock } from "@/lib/landing-content-blocks";
import type { LandingDeckScreen, LandingDeckV1 } from "@/lib/landing-deck/schema";
import { buildContentWithBlueprint, filterContentByBlueprint } from "./blueprint";
import { OUTLINE_TEMPLATE_IDS, type DeckOutline, type OutlineMediaRef, type OutlineSlide } from "./types";

function isKnownTemplate(id: string): boolean {
  return (OUTLINE_TEMPLATE_IDS as readonly string[]).includes(id);
}

function resolveMediaKeys(
  media: Record<string, OutlineMediaRef> | undefined,
  keys: string[] | undefined
): MediaBlock[] {
  if (!keys?.length || !media) return [];
  const out: MediaBlock[] = [];
  for (const k of keys) {
    const ref = media[k];
    if (!ref) continue;
    if (ref.type === "image") {
      out.push({
        type: "image",
        src: ref.src,
        alt: ref.alt ?? "",
      });
    } else {
      out.push({
        type: "video",
        src: ref.src,
        ...(ref.caption ? { caption: ref.caption } : {}),
        ...(ref.poster ? { poster: ref.poster } : {}),
        ...(ref.aspectRatio ? { aspectRatio: ref.aspectRatio } : {}),
      });
    }
  }
  return out;
}

function templatePartial(slide: OutlineSlide): Partial<LandingDeckScreen> {
  const tid = slide.templateId;
  const defaultButtons: LandingDeckScreen["buttons"] = [
    { type: "next", label: "Continue", nodeId: `${slide.id}-next` },
  ];

  switch (tid) {
    case "introStamped":
      return {
        layout: "stamped",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
      };
    case "teachingStamped":
      return {
        layout: "stamped",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
      };
    case "heroHook":
      return {
        layout: "hero",
        subtitle: slide.subtitle,
        content: buildContentWithBlueprint(slide),
        buttons: [],
      };
    case "quizSelectStamped": {
      const q = slide.quizSelect;
      if (!q) {
        return {
          layout: "stamped",
          content: buildContentWithBlueprint(slide),
          buttons: defaultButtons,
        };
      }
      const walkthrough = {
        inputs: [
          {
            id: q.inputId,
            type: "select" as const,
            label: q.label ?? "Your answer",
            options: q.options,
          },
        ],
        gate: {
          required: [q.inputId],
          message: q.gateMessage ?? "Choose an answer to continue.",
        },
      };
      const trackerResponse =
        slide.trackerEnabled !== false && slide.trackerValueLabels
          ? {
              rule: {
                type: "valueLabel" as const,
                field: q.inputId,
                map: slide.trackerValueLabels,
              },
            }
          : undefined;
      return {
        layout: "stamped",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
        walkthrough,
        ...(trackerResponse ? { trackerResponse } : {}),
      };
    }
    case "ctaStamped": {
      const cta: LandingContentBlock[] = [];
      if (slide.title) {
        const bp = slide.blueprint;
        const explicit = bp?.mode === "explicit" && bp.activeRegions?.length;
        const active = explicit ? new Set(bp.activeRegions) : null;
        const allowCta = !active || active.has("cta");
        if (allowCta) {
          cta.push({
            type: "ctaBand",
            headline: slide.title,
            sub: slide.subtitle ?? "",
            emphasis: true,
          });
        }
      }
      return {
        layout: "stamped",
        content: [...buildContentWithBlueprint(slide), ...cta],
        buttons: defaultButtons,
      };
    }
    case "summaryTextOnly":
      return {
        layout: "textOnly",
        content: buildContentWithBlueprint(slide),
        buttons: [],
      };
    case "proofStamped":
      return {
        layout: "proofPanel",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
      };
    case "comparisonTwoCol":
      return {
        layout: "twoCol",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
      };
    default:
      if (!isKnownTemplate(tid)) {
        console.warn(`[compileOutlineToLandingDeck] Unknown templateId "${tid}", using stamped + Continue.`);
      }
      return {
        layout: slide.layoutOverride ?? "stamped",
        content: buildContentWithBlueprint(slide),
        buttons: defaultButtons,
      };
  }
}

function composeScreen(
  slide: OutlineSlide,
  partial: Partial<LandingDeckScreen>,
  mediaMap: Record<string, OutlineMediaRef> | undefined
): LandingDeckScreen {
  const title = slide.title ?? slide.id;
  const stepLabel = slide.stepLabel ?? title;
  const inline = slide.inlineMedia ?? [];
  const keyed = resolveMediaKeys(mediaMap, slide.mediaKeys);
  /** Prefer keyed outline media first, then inline-only blocks (profile may pass `[]` for keyed-only slides). */
  const resolvedMedia = [...keyed, ...inline];

  const fromPartialContent =
    partial.content && partial.content.length > 0
      ? partial.content
      : [{ type: "paragraph" as const, text: title }];
  const content: LandingContentBlock[] = filterContentByBlueprint(
    slide,
    slide.richContent !== undefined ? slide.richContent : fromPartialContent
  );

  let buttons: LandingDeckScreen["buttons"] = partial.buttons ?? [];
  if (slide.buttons != null && slide.buttons.length > 0) {
    buttons = slide.buttons;
  } else if (slide.nextButtonLabel && buttons.length > 0) {
    buttons = buttons.map((b, i) =>
      i === 0 && b.type === "next" ? { ...b, label: slide.nextButtonLabel! } : b
    );
  }

  return {
    id: slide.id,
    stepLabel,
    /** TXT / outline `layoutOverride` wins over template default (e.g. teach → splitProof). */
    layout: slide.layoutOverride ?? partial.layout ?? "stamped",
    title,
    ...(partial.subtitle !== undefined ? { subtitle: partial.subtitle } : slide.subtitle ? { subtitle: slide.subtitle } : {}),
    content,
    media: resolvedMedia,
    buttons,
    ...(partial.nextScreenId !== undefined ? { nextScreenId: partial.nextScreenId } : {}),
    ...(partial.walkthrough ? { walkthrough: partial.walkthrough } : {}),
    ...(partial.trackerResponse ? { trackerResponse: partial.trackerResponse } : {}),
    ...(slide.modes?.length ? { modes: slide.modes } : {}),
    ...(slide.presentation ? { presentation: slide.presentation } : {}),
    ...(slide.lightTheme !== undefined ? { lightTheme: slide.lightTheme } : {}),
    ...(slide.visualTone ? { visualTone: slide.visualTone } : {}),
    ...(slide.density ? { density: slide.density } : {}),
  };
}

/**
 * Expand a high-level outline into `LandingDeckV1` suitable for `LandingDeckRenderer` / `validateLandingDeck`.
 */
export function compileOutlineToLandingDeck(outline: DeckOutline): LandingDeckV1 {
  const { meta, slides } = outline;
  const mediaMap = outline.media;

  const screens: LandingDeckScreen[] = slides.map((slide, index) => {
    const partial = templatePartial(slide);
    const screen = composeScreen(slide, partial, mediaMap);
    const nextId = slides[index + 1]?.id;
    if (nextId) {
      screen.nextScreenId = nextId;
    }
    return screen;
  });

  return {
    shopUrl: meta.shopUrl,
    header: {
      logoSrc: meta.logoSrc ?? "/favicon.ico",
      logoAlt: meta.logoAlt ?? meta.title,
      shopNowLabel: meta.shopNowLabel ?? "Continue",
    },
    stepTracker: {
      title: meta.stepTrackerTitle ?? meta.title,
      description: meta.stepTrackerDescription ?? "",
      showResponses: meta.showResponses ?? false,
      responsePlaceholder: meta.responsePlaceholder ?? "",
      completedOnly: false,
    },
    screens,
    ...(meta.extraLinkKeys ? { extraLinkKeys: meta.extraLinkKeys } : {}),
    ...(meta.deckPalette ? { deckPalette: meta.deckPalette } : {}),
  };
}
