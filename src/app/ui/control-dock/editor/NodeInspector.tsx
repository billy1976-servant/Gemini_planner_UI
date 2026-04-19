"use client";

import React from "react";
import { stopSpaceEnterBubblingFromFormFields } from "@/lib/editable-keyboard";
import type { SlideBuilderMeta } from "@/lib/slide-builder-recipes";
import type { LandingContentBlock } from "@/lib/landing-content-blocks/types";
import type { WalkthroughScreenConfig } from "@/lib/landing-walkthrough";
import type { TrackerResponseConfig } from "@/lib/landing-tracker-responses";
import SlideContentBlocksEditor from "./SlideContentBlocksEditor";
import WalkthroughTrackerInspector from "./WalkthroughTrackerInspector";
import { landingLayoutSelectOptions } from "@/lib/landing-layout-catalog";
import LayoutTilePicker from "@/app/ui/control-dock/layout/LayoutTilePicker";
import type { LayoutTileOption } from "@/app/ui/control-dock/layout/LayoutTilePicker";
import LandingSlideLayoutPreview, {
  SlideLayoutPreviewErrorBoundary,
} from "@/01_App/(live) Business/Container_Creations/LandingSlideLayoutPreview";
import InspectorCollapsible from "./InspectorCollapsible";
import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";
import type { LearnSlideTypeV1, SlideBlueprint } from "@/lib/landing-deck/outline/types";
import { BLUEPRINT_REGION_OPTIONS } from "@/lib/landing-deck/outline/blueprint";
import { allowedLearnButtonTypes } from "@/lib/landing-deck/authoring/learn-authoring-contracts";
import {
  LEARN_MEDIA_SECTION_INTRO,
  LEARN_REVEAL_SECTION_INTRO,
  LEARN_WALKTHROUGH_SECTION_INTRO,
} from "@/lib/landing-deck/authoring/learn-authoring-ui-hints";

/** Editable node shape (subset of landing screen). */
export type EditableNode = {
  id: string;
  /** Learn authoring: outline `templateId` (blueprint region list only; not persisted on deck JSON). */
  templateId?: string;
  title?: string;
  subtitle?: string;
  stepLabel?: string;
  layout?: string;
  lightTheme?: boolean;
  /** landing-screen-presentation */
  visualTone?: string;
  /** landing-screen-presentation */
  density?: string;
  media?: Array<Record<string, unknown>>;
  nextScreenId?: string;
  buttons?: Array<{ type?: string; label?: string; target?: string }>;
  content?: Array<{ type?: string; text?: string; heading?: string; [key: string]: unknown }>;
  /** Ignored by landing renderers; used by slide builder for type/preset UX. */
  builderMeta?: SlideBuilderMeta;
  walkthrough?: WalkthroughScreenConfig;
  trackerResponse?: TrackerResponseConfig;
  /** Learn V2: region activation for compile (outline-only; merged via `mergeOutlineFromScreenSnapshot`). */
  blueprint?: SlideBlueprint;
  /** When set (including `[]`), filters this slide in short vs long deck previews. */
  modes?: DeckSlideMode[];
  [key: string]: unknown;
};

const PANEL_STYLE: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "var(--color-surface-1, #f1f3f4)",
  borderRadius: 8,
  border: "1px solid var(--color-border, #dadce0)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.8,
  color: "var(--color-text-secondary, #5f6368)",
  marginBottom: 4,
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 13,
  border: "1px solid var(--color-border, #dadce0)",
  borderRadius: 6,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #202124)",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 60,
  resize: "vertical",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minWidth: 120,
};

/** Slide builder: live layout previews via ContainerCreationsLandingRenderer.renderScreenPreview. */
export type NodeInspectorSlideLayoutPreview = {
  deckPalette: string;
  renderPreview: (layoutId: string) => React.ReactNode;
  /** Match main canvas width so tile previews wrap like the builder. */
  contentLogicalWidth?: number;
};

export type NodeInspectorProps = {
  node: EditableNode;
  screenIds: string[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onChange: (patch: Partial<EditableNode>) => void;
  /** When true, hide the node id dropdown (e.g. slide builder outline is the single source of selection). */
  hideNodePicker?: boolean;
  /**
   * basic: copy + primary fields only (slide builder default).
   * advanced: full layout, flow, and media tuning (default for dev dock).
   */
  inspectorMode?: "basic" | "advanced";
  /** When set (slide builder), Advanced mode shows live layout tiles + list select. */
  slideLayoutPreview?: NodeInspectorSlideLayoutPreview | null;
  /**
   * When true, fields are grouped into collapsible sections (slide builder / narrow viewports).
   * The dev control dock keeps the flat single-panel layout by default.
   */
  sectionGroups?: boolean;
  /** Learn deterministic authoring: layout comes from slide type / compiler. */
  layoutAuthoringLocked?: boolean;
  /** When set with `layoutAuthoringLocked`, filters legal button types per slide kind. */
  learnSlideType?: LearnSlideTypeV1;
};

const MINI_BTN: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "1px solid var(--color-border, #dadce0)",
  background: "var(--color-surface-1, #f1f3f4)",
  cursor: "pointer",
  color: "var(--color-text-primary, #202124)",
  marginTop: 8,
};

export default function NodeInspector({
  node,
  screenIds,
  selectedNodeId,
  onSelectNode,
  onChange,
  hideNodePicker = false,
  inspectorMode = "advanced",
  slideLayoutPreview = null,
  sectionGroups = false,
  layoutAuthoringLocked = false,
  learnSlideType,
}: NodeInspectorProps) {
  const isBasic = inspectorMode === "basic";
  const buttons = Array.isArray(node.buttons) ? node.buttons : [];
  const content = Array.isArray(node.content) ? node.content : [];
  const media = Array.isArray(node.media) ? node.media : [];
  const layoutValue = node.layout ?? "";
  const layoutOptions = landingLayoutSelectOptions(layoutValue);

  const layoutTileOptions: LayoutTileOption[] = !slideLayoutPreview
    ? []
    : layoutOptions.map((id) => ({
        id,
        label: id,
        thumbnail: (
          <SlideLayoutPreviewErrorBoundary key={`eb-${selectedNodeId ?? "none"}-${id}`} layoutLabel={id}>
            <LandingSlideLayoutPreview
              deckPalette={slideLayoutPreview.deckPalette}
              presentationScreen={{
                visualTone: node.visualTone,
                density: node.density,
                lightTheme: node.lightTheme,
              }}
              previewLayoutKey={id}
              logicalRenderWidth={slideLayoutPreview.contentLogicalWidth}
            >
              {slideLayoutPreview.renderPreview(id)}
            </LandingSlideLayoutPreview>
          </SlideLayoutPreviewErrorBoundary>
        ),
      }));
  const firstMedia = media[0] as Record<string, unknown> | undefined;
  const firstMediaType = firstMedia?.type;
  const canToggleFullBleed =
    firstMediaType === "image" || firstMediaType === "video" || firstMediaType === "beforeAfter";

  function patchMediaAt(slotIndex: number, partial: Record<string, unknown>) {
    const next = media.map((item, idx) => (idx === slotIndex ? { ...item, ...partial } : item));
    onChange({ media: next });
  }

  function patchFirstMedia(partial: Record<string, unknown>) {
    patchMediaAt(0, partial);
  }

  function removeMediaAt(slotIndex: number) {
    onChange({ media: media.filter((_, idx) => idx !== slotIndex) });
  }

  const learnButtonTypeOptions =
    layoutAuthoringLocked && learnSlideType ? allowedLearnButtonTypes(learnSlideType) : null;

  function renderLearnMediaSlot(slotIndex: number) {
    const raw = media[slotIndex] as Record<string, unknown> | undefined;
    const t = raw?.type;
    const canBleed = t === "image" || t === "video" || t === "beforeAfter";
    return (
      <div
        key={slotIndex}
        style={{
          marginTop: slotIndex === 0 ? 0 : 14,
          paddingTop: slotIndex === 0 ? 0 : 12,
          borderTop: slotIndex === 0 ? undefined : "1px solid var(--color-border, #dadce0)",
        }}
      >
        <div style={LABEL_STYLE}>
          Media slot {slotIndex + 1} ({String(t ?? "empty")})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Type
            <select
              value={String(t ?? "image")}
              onChange={(e) => {
                const v = e.target.value;
                const next = [...media];
                if (v === "image") next[slotIndex] = { type: "image", src: "", alt: "" };
                else if (v === "video") next[slotIndex] = { type: "video", src: "" };
                else if (v === "beforeAfter") {
                  next[slotIndex] = { type: "beforeAfter", before: "", after: "", altBefore: "", altAfter: "" };
                } else next[slotIndex] = { type: "image", src: "", alt: "" };
                onChange({ media: next });
              }}
              style={SELECT_STYLE}
              aria-label={`Media slot ${slotIndex + 1} type`}
            >
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="beforeAfter">before/after</option>
            </select>
          </label>
          <button type="button" style={MINI_BTN} onClick={() => removeMediaAt(slotIndex)}>
            Remove slot
          </button>
        </div>
        {(t === "image" || t === "video") && (
          <>
            <label style={LABEL_STYLE}>Source URL</label>
            <input
              type="text"
              value={String(raw?.src ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { src: e.target.value })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
            {t === "image" && (
              <>
                <label style={LABEL_STYLE}>Alt</label>
                <input
                  type="text"
                  value={String(raw?.alt ?? "")}
                  onChange={(e) => patchMediaAt(slotIndex, { alt: e.target.value })}
                  style={{ ...INPUT_STYLE, marginBottom: 8 }}
                />
              </>
            )}
            {!isBasic && t === "video" ? (
              <>
                <label style={LABEL_STYLE}>Poster URL</label>
                <input
                  type="text"
                  value={String(raw?.poster ?? "")}
                  onChange={(e) => patchMediaAt(slotIndex, { poster: e.target.value || undefined })}
                  style={{ ...INPUT_STYLE, marginBottom: 8 }}
                />
                <label style={LABEL_STYLE}>Caption</label>
                <input
                  type="text"
                  value={String(raw?.caption ?? "")}
                  onChange={(e) => patchMediaAt(slotIndex, { caption: e.target.value || undefined })}
                  style={{ ...INPUT_STYLE, marginBottom: 8 }}
                />
              </>
            ) : null}
            {!isBasic ? (
              <>
                <label style={LABEL_STYLE}>Aspect ratio (CSS)</label>
                <input
                  type="text"
                  placeholder="16/9"
                  value={String(raw?.aspectRatio ?? "")}
                  onChange={(e) => patchMediaAt(slotIndex, { aspectRatio: e.target.value || undefined })}
                  style={{ ...INPUT_STYLE, marginBottom: 8 }}
                />
                <label style={LABEL_STYLE}>Object fit</label>
                <select
                  value={String(raw?.objectFit ?? "cover")}
                  onChange={(e) => patchMediaAt(slotIndex, { objectFit: e.target.value })}
                  style={{ ...SELECT_STYLE, marginBottom: 8 }}
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                </select>
              </>
            ) : null}
          </>
        )}
        {!isBasic && t === "beforeAfter" ? (
          <>
            <label style={LABEL_STYLE}>Before URL</label>
            <input
              type="text"
              value={String(raw?.before ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { before: e.target.value })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
            <label style={LABEL_STYLE}>After URL</label>
            <input
              type="text"
              value={String(raw?.after ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { after: e.target.value })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
            <label style={LABEL_STYLE}>Alt (before)</label>
            <input
              type="text"
              value={String(raw?.altBefore ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { altBefore: e.target.value })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
            <label style={LABEL_STYLE}>Alt (after)</label>
            <input
              type="text"
              value={String(raw?.altAfter ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { altAfter: e.target.value })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
            <label style={LABEL_STYLE}>Aspect ratio (CSS)</label>
            <input
              type="text"
              placeholder="16/9"
              value={String(raw?.aspectRatio ?? "")}
              onChange={(e) => patchMediaAt(slotIndex, { aspectRatio: e.target.value || undefined })}
              style={{ ...INPUT_STYLE, marginBottom: 8 }}
            />
          </>
        ) : null}
        {!isBasic && canBleed ? (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              marginTop: 8,
            }}
          >
            <input
              type="checkbox"
              checked={raw?.fullBleed === true}
              onChange={(e) => patchMediaAt(slotIndex, { fullBleed: e.target.checked })}
            />
            Full bleed
          </label>
        ) : null}
      </div>
    );
  }

  const hasMediaPanel =
    !!firstMedia &&
    (firstMediaType === "image" || firstMediaType === "video" || firstMediaType === "beforeAfter");

  const primaryButtonBasic = (
    <div>
      <div style={LABEL_STYLE}>Primary button</div>
      {buttons.length > 0 ? (
        <input
          type="text"
          placeholder="label"
          value={buttons[0]?.label ?? ""}
          onChange={(e) => {
            const next = [...buttons];
            next[0] = { ...next[0], label: e.target.value };
            onChange({ buttons: next });
          }}
          style={INPUT_STYLE}
          aria-label="Primary button label"
        />
      ) : (
        <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: "4px 0 0" }}>
          No buttons on this slide.
        </p>
      )}
      {buttons.length > 1 ? (
        <p style={{ fontSize: 11, color: "var(--color-text-secondary, #5f6368)", margin: "8px 0 0" }}>
          Additional buttons: open Advanced mode.
        </p>
      ) : null}
    </div>
  );

  const buttonsAdvanced = (
    <div>
      <div style={LABEL_STYLE}>Buttons</div>
      {buttons.map((btn, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <input
            type="text"
            placeholder="label"
            value={btn.label ?? ""}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...next[i], label: e.target.value };
              onChange({ buttons: next });
            }}
            style={{ ...INPUT_STYLE, flex: "1 1 80px", minWidth: 0 }}
          />
          <input
            type="text"
            placeholder="target"
            value={"target" in btn ? String(btn.target ?? "") : ""}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...next[i], target: e.target.value || undefined };
              onChange({ buttons: next });
            }}
            style={{ ...INPUT_STYLE, flex: "1 1 80px", minWidth: 0 }}
          />
          <select
            value={btn.type ?? "next"}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...next[i], type: e.target.value };
              onChange({ buttons: next });
            }}
            style={{ ...SELECT_STYLE, flex: "0 0 auto", width: 90 }}
          >
            {(["link", "goto", "next", "back"] as const).map((opt) => {
              const allowed = learnButtonTypeOptions;
              const ok = !allowed || allowed.includes(opt);
              return (
                <option key={opt} value={opt} disabled={!ok}>
                  {opt === "next" ? "Next" : opt === "back" ? "Back" : opt === "goto" ? "Go to slide" : "Link"}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );

  const mediaPanel = hasMediaPanel ? (
    <div>
      <div style={LABEL_STYLE}>First media ({String(firstMediaType ?? "?")})</div>
      {isBasic && firstMediaType === "beforeAfter" ? (
        <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: "4px 0 0" }}>
          Before/after tuning: switch to Advanced mode.
        </p>
      ) : null}
      {(firstMediaType === "image" || firstMediaType === "video") && (
        <>
          <label style={LABEL_STYLE}>Source URL</label>
          <input
            type="text"
            value={String(firstMedia?.src ?? "")}
            onChange={(e) => patchFirstMedia({ src: e.target.value })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
            aria-label="Media src"
          />
          {firstMediaType === "image" && (
            <>
              <label style={LABEL_STYLE}>Alt</label>
              <input
                type="text"
                value={String(firstMedia?.alt ?? "")}
                onChange={(e) => patchFirstMedia({ alt: e.target.value })}
                style={{ ...INPUT_STYLE, marginBottom: 8 }}
                aria-label="Image alt"
              />
            </>
          )}
          {!isBasic && firstMediaType === "video" ? (
            <>
              <label style={LABEL_STYLE}>Poster URL</label>
              <input
                type="text"
                value={String(firstMedia?.poster ?? "")}
                onChange={(e) => patchFirstMedia({ poster: e.target.value || undefined })}
                style={{ ...INPUT_STYLE, marginBottom: 8 }}
                aria-label="Video poster"
              />
              <label style={LABEL_STYLE}>Caption</label>
              <input
                type="text"
                value={String(firstMedia?.caption ?? "")}
                onChange={(e) => patchFirstMedia({ caption: e.target.value || undefined })}
                style={{ ...INPUT_STYLE, marginBottom: 8 }}
                aria-label="Video caption"
              />
            </>
          ) : null}
          {!isBasic ? (
            <>
              <label style={LABEL_STYLE}>Aspect ratio (CSS)</label>
              <input
                type="text"
                placeholder="16/9"
                value={String(firstMedia?.aspectRatio ?? "")}
                onChange={(e) => patchFirstMedia({ aspectRatio: e.target.value || undefined })}
                style={{ ...INPUT_STYLE, marginBottom: 8 }}
                aria-label="Aspect ratio"
              />
              <label style={LABEL_STYLE}>Object fit</label>
              <select
                value={String(firstMedia?.objectFit ?? "cover")}
                onChange={(e) => patchFirstMedia({ objectFit: e.target.value })}
                style={{ ...SELECT_STYLE, marginBottom: 8 }}
                aria-label="Object fit"
              >
                <option value="cover">cover</option>
                <option value="contain">contain</option>
              </select>
            </>
          ) : null}
        </>
      )}
      {!isBasic && firstMediaType === "beforeAfter" ? (
        <>
          <label style={LABEL_STYLE}>Before URL</label>
          <input
            type="text"
            value={String(firstMedia?.before ?? "")}
            onChange={(e) => patchFirstMedia({ before: e.target.value })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
          <label style={LABEL_STYLE}>After URL</label>
          <input
            type="text"
            value={String(firstMedia?.after ?? "")}
            onChange={(e) => patchFirstMedia({ after: e.target.value })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
          <label style={LABEL_STYLE}>Alt (before)</label>
          <input
            type="text"
            value={String(firstMedia?.altBefore ?? "")}
            onChange={(e) => patchFirstMedia({ altBefore: e.target.value })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
          <label style={LABEL_STYLE}>Alt (after)</label>
          <input
            type="text"
            value={String(firstMedia?.altAfter ?? "")}
            onChange={(e) => patchFirstMedia({ altAfter: e.target.value })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
          <label style={LABEL_STYLE}>Aspect ratio (CSS)</label>
          <input
            type="text"
            placeholder="16/9"
            value={String(firstMedia?.aspectRatio ?? "")}
            onChange={(e) => patchFirstMedia({ aspectRatio: e.target.value || undefined })}
            style={{ ...INPUT_STYLE, marginBottom: 8 }}
          />
        </>
      ) : null}
      {!isBasic && canToggleFullBleed ? (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--color-text-primary, #202124)",
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            checked={firstMedia?.fullBleed === true}
            onChange={(e) => patchFirstMedia({ fullBleed: e.target.checked })}
            aria-label="First media full bleed"
          />
          Full bleed
        </label>
      ) : null}
    </div>
  ) : null;

  if (sectionGroups) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
        onKeyDown={stopSpaceEnterBubblingFromFormFields}
      >
        <InspectorCollapsible title="Basic" defaultOpen>
          {!hideNodePicker ? (
            <div>
              <label style={LABEL_STYLE}>Node</label>
              <select
                value={selectedNodeId ?? ""}
                onChange={(e) => onSelectNode(e.target.value || null)}
                style={SELECT_STYLE}
                aria-label="Select node"
              >
                <option value="">— Select —</option>
                {screenIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label style={LABEL_STYLE}>Title</label>
            <input
              type="text"
              value={node.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Title"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Subtitle</label>
            <textarea
              value={node.subtitle ?? ""}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              style={TEXTAREA_STYLE}
              rows={2}
              aria-label="Subtitle"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Step label</label>
            <input
              type="text"
              value={node.stepLabel ?? ""}
              onChange={(e) => onChange({ stepLabel: e.target.value })}
              style={INPUT_STYLE}
              aria-label="Step label"
            />
          </div>
          {isBasic ? primaryButtonBasic : null}
        </InspectorCollapsible>

        <InspectorCollapsible title="Style" defaultOpen={false}>
          <div style={{ ...LABEL_STYLE, marginBottom: 2 }}>Step look</div>
          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-secondary, #5f6368)",
              lineHeight: 1.35,
              margin: "0 0 10px",
            }}
          >
            This slide only: light header, visual weight, and vertical density. Deck colors use{" "}
            <strong>Deck theme</strong> in the outline.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--color-text-primary, #202124)",
              marginBottom: 10,
            }}
          >
            <input
              type="checkbox"
              checked={node.lightTheme === true}
              onChange={(e) => onChange({ lightTheme: e.target.checked })}
              aria-label="Light theme"
            />
            Light theme
          </label>
          <div>
            <label style={LABEL_STYLE}>Visual tone</label>
            <select
              value={node.visualTone ?? "default"}
              onChange={(e) => onChange({ visualTone: e.target.value })}
              style={SELECT_STYLE}
              aria-label="Visual tone"
            >
              <option value="default">default</option>
              <option value="soft">soft</option>
              <option value="bold">bold</option>
            </select>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={LABEL_STYLE}>Density</label>
            <select
              value={node.density ?? "comfortable"}
              onChange={(e) => onChange({ density: e.target.value })}
              style={SELECT_STYLE}
              aria-label="Density"
            >
              <option value="comfortable">comfortable</option>
              <option value="compact">compact</option>
            </select>
          </div>
        </InspectorCollapsible>

        <InspectorCollapsible title="Reveal & staged teaching" defaultOpen={false}>
          {layoutAuthoringLocked ? (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: "0 0 10px", lineHeight: 1.45 }}>
              {LEARN_REVEAL_SECTION_INTRO}
            </p>
          ) : null}
          <label style={LABEL_STYLE}>Reveal mode</label>
          <select
            value={(node.presentation?.reveal as string | undefined) ?? "none"}
            onChange={(e) => {
              const v = e.target.value as "none" | "byBlock" | "custom";
              if (v === "none") onChange({ presentation: { reveal: "none" } });
              else if (v === "byBlock") onChange({ presentation: { reveal: "byBlock" } });
              else {
                const n = content.length;
                onChange({
                  presentation: {
                    reveal: "custom",
                    revealSequence: Array.from({ length: n }, (_, i) => `block:${i}`),
                  },
                });
              }
            }}
            style={SELECT_STYLE}
            aria-label="Reveal mode"
          >
            <option value="none">Show all at once</option>
            <option value="byBlock">Step through blocks (in order)</option>
            <option value="custom" disabled={content.length === 0}>
              Custom sequence{content.length === 0 ? " — add content blocks first" : ""}
            </option>
          </select>
          {node.presentation?.reveal === "custom" ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                style={MINI_BTN}
                onClick={() =>
                  onChange({
                    presentation: {
                      reveal: "custom",
                      revealSequence: Array.from({ length: content.length }, (_, i) => `block:${i}`),
                    },
                  })
                }
              >
                Sync sequence to blocks
              </button>
              <label style={{ ...LABEL_STYLE, marginTop: 8 }}>Sequence (comma-separated block:0, block:1, …)</label>
              <input
                type="text"
                value={(node.presentation?.revealSequence ?? []).join(", ")}
                onChange={(e) => {
                  const parts = e.target.value
                    .split(/[,\s]+/)
                    .map((s) => s.trim())
                    .filter((s) => /^block:\d+$/.test(s));
                  onChange({
                    presentation: { reveal: "custom", revealSequence: parts },
                  });
                }}
                style={INPUT_STYLE}
                aria-label="Reveal sequence"
              />
            </div>
          ) : null}
        </InspectorCollapsible>

        {layoutAuthoringLocked ? (
          <InspectorCollapsible title="Blueprint (regions)" defaultOpen={false}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: "0 0 8px", lineHeight: 1.45 }}>
              <strong>Auto</strong> uses all regions. <strong>Explicit</strong> limits which outline fields and rich blocks
              compile into the slide (e.g. hide badge or comparison).
            </p>
            <label style={LABEL_STYLE}>Mode</label>
            <select
              value={(node.blueprint?.mode as string | undefined) === "explicit" ? "explicit" : "auto"}
              onChange={(e) => {
                const mode = e.target.value as "auto" | "explicit";
                if (mode === "auto") {
                  onChange({ blueprint: undefined });
                  return;
                }
                const tid = node.templateId ?? "";
                const opts = BLUEPRINT_REGION_OPTIONS[tid] ?? BLUEPRINT_REGION_OPTIONS.introStamped ?? [];
                const ids = opts.map((o) => o.id);
                onChange({ blueprint: { mode: "explicit", activeRegions: ids.length ? [...ids] : ["body"] } });
              }}
              style={SELECT_STYLE}
              aria-label="Blueprint mode"
            >
              <option value="auto">Auto (all regions)</option>
              <option value="explicit">Explicit</option>
            </select>
            {node.blueprint?.mode === "explicit" ? (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {(BLUEPRINT_REGION_OPTIONS[node.templateId ?? ""] ?? BLUEPRINT_REGION_OPTIONS.introStamped ?? []).map(
                  (opt) => {
                    const active = new Set(node.blueprint?.activeRegions ?? []);
                    const checked = active.has(opt.id);
                    return (
                      <label
                        key={opt.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(node.blueprint?.activeRegions ?? []);
                            if (next.has(opt.id)) next.delete(opt.id);
                            else next.add(opt.id);
                            const arr = [...next];
                            onChange({
                              blueprint: { mode: "explicit", activeRegions: arr.length ? arr : ["body"] },
                            });
                          }}
                        />
                        {opt.label} <span style={{ opacity: 0.65, fontSize: 11 }}>({opt.id})</span>
                      </label>
                    );
                  }
                )}
                {!BLUEPRINT_REGION_OPTIONS[node.templateId ?? ""]?.length ? (
                  <p style={{ fontSize: 11, margin: 0, color: "var(--color-text-secondary, #5f6368)" }}>
                    No region list for this template — use Auto or add options in blueprint config.
                  </p>
                ) : null}
              </div>
            ) : null}
          </InspectorCollapsible>
        ) : null}

        {!isBasic ? (
          <InspectorCollapsible title="Layout" defaultOpen>
            <div>
              {slideLayoutPreview && layoutTileOptions.length > 0 ? (
                <div style={{ marginBottom: 10 }}>
                  <LayoutTilePicker
                    title={layoutAuthoringLocked ? "Live layout styles" : "Live preview"}
                    value={layoutValue}
                    options={layoutTileOptions}
                    onChange={(id) => onChange({ layout: id })}
                    mode="stack"
                    variant="section"
                  />
                </div>
              ) : null}
              {layoutAuthoringLocked ? (
                <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: "0 0 10px", lineHeight: 1.45 }}>
                  <strong>Learn authoring:</strong> tap a layout to preview it on the canvas. Default layout comes from the
                  slide type; your choice is stored on this screen until you change slide type or recompile from outline.
                </p>
              ) : null}
              <label style={{ ...LABEL_STYLE, marginTop: slideLayoutPreview ? 4 : 0 }}>Layout (list)</label>
              <select
                value={layoutValue}
                onChange={(e) => onChange({ layout: e.target.value })}
                style={SELECT_STYLE}
                aria-label="Layout"
              >
                {layoutOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </InspectorCollapsible>
        ) : null}

        <InspectorCollapsible title="Content" defaultOpen>
          <SlideContentBlocksEditor
            content={content}
            hideRawJson={layoutAuthoringLocked}
            onChange={(next: LandingContentBlock[]) => onChange({ content: next as EditableNode["content"] })}
          />
        </InspectorCollapsible>

        <InspectorCollapsible title="Walkthrough &amp; tracker" defaultOpen={false}>
          <WalkthroughTrackerInspector
            walkthrough={node.walkthrough}
            trackerResponse={node.trackerResponse}
            onPatch={(patch) => onChange(patch as Partial<EditableNode>)}
            learnWalkthroughIntro={layoutAuthoringLocked ? LEARN_WALKTHROUGH_SECTION_INTRO : undefined}
          />
        </InspectorCollapsible>

        <InspectorCollapsible title="Advanced" defaultOpen={false}>
          {layoutAuthoringLocked ? (
            <>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary, #5f6368)",
                  lineHeight: 1.4,
                  margin: "0 0 10px",
                }}
              >
                {LEARN_MEDIA_SECTION_INTRO}
              </p>
              {media.length === 0 ? (
                <button
                  type="button"
                  style={MINI_BTN}
                  onClick={() => onChange({ media: [{ type: "image", src: "", alt: "" }] })}
                >
                  + Add first media slot
                </button>
              ) : (
                media.map((_, idx) => renderLearnMediaSlot(idx))
              )}
              {media.length > 0 ? (
                <button
                  type="button"
                  style={MINI_BTN}
                  onClick={() => onChange({ media: [...media, { type: "image", src: "", alt: "" }] })}
                >
                  + Add media slot
                </button>
              ) : null}
            </>
          ) : (
            <>
              {mediaPanel}
              {media.length > 1
                ? media.slice(1).map((raw, j) => {
                    const slotIndex = j + 1;
                    const m = raw as Record<string, unknown>;
                    const t = m?.type;
                    return (
                      <div
                        key={slotIndex}
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px solid var(--color-border, #dadce0)",
                        }}
                      >
                        <div style={LABEL_STYLE}>
                          Media slot {slotIndex + 1} ({String(t ?? "?")})
                        </div>
                        <button
                          type="button"
                          style={{ ...MINI_BTN, marginTop: 4 }}
                          onClick={() => removeMediaAt(slotIndex)}
                        >
                          Remove this slot
                        </button>
                        {(t === "image" || t === "video") && (
                          <>
                            <label style={{ ...LABEL_STYLE, marginTop: 8 }}>Source URL</label>
                            <input
                              type="text"
                              value={String(m.src ?? "")}
                              onChange={(e) => patchMediaAt(slotIndex, { src: e.target.value })}
                              style={{ ...INPUT_STYLE, marginBottom: 8 }}
                            />
                            {t === "image" ? (
                              <>
                                <label style={LABEL_STYLE}>Alt</label>
                                <input
                                  type="text"
                                  value={String(m.alt ?? "")}
                                  onChange={(e) => patchMediaAt(slotIndex, { alt: e.target.value })}
                                  style={INPUT_STYLE}
                                />
                              </>
                            ) : null}
                            {t === "video" && !isBasic ? (
                              <>
                                <label style={{ ...LABEL_STYLE, marginTop: 8 }}>Poster URL</label>
                                <input
                                  type="text"
                                  value={String(m.poster ?? "")}
                                  onChange={(e) => patchMediaAt(slotIndex, { poster: e.target.value || undefined })}
                                  style={INPUT_STYLE}
                                />
                              </>
                            ) : null}
                          </>
                        )}
                        {t === "beforeAfter" && !isBasic ? (
                          <>
                            <label style={LABEL_STYLE}>Before URL</label>
                            <input
                              type="text"
                              value={String(m.before ?? "")}
                              onChange={(e) => patchMediaAt(slotIndex, { before: e.target.value })}
                              style={INPUT_STYLE}
                            />
                            <label style={LABEL_STYLE}>After URL</label>
                            <input
                              type="text"
                              value={String(m.after ?? "")}
                              onChange={(e) => patchMediaAt(slotIndex, { after: e.target.value })}
                              style={INPUT_STYLE}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })
                : null}
              <button
                type="button"
                style={MINI_BTN}
                onClick={() => onChange({ media: [...media, { type: "image", src: "", alt: "" }] })}
              >
                + Add media slot
              </button>
            </>
          )}
          {!isBasic ? (
            <div>
              <label style={LABEL_STYLE}>Next screen</label>
              <select
                value={node.nextScreenId ?? ""}
                onChange={(e) => onChange({ nextScreenId: e.target.value || undefined })}
                style={SELECT_STYLE}
                aria-label="Next screen"
              >
                <option value="">— None —</option>
                {screenIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {!isBasic ? buttonsAdvanced : null}
          {!hasMediaPanel && isBasic ? (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary, #5f6368)", margin: 0, lineHeight: 1.45 }}>
              Media, full button rows, and next-screen linking appear here in Advanced mode.
            </p>
          ) : null}
        </InspectorCollapsible>
      </div>
    );
  }

  return (
    <div style={PANEL_STYLE} onKeyDown={stopSpaceEnterBubblingFromFormFields}>
      {!hideNodePicker ? (
        <div>
          <label style={LABEL_STYLE}>Node</label>
          <select
            value={selectedNodeId ?? ""}
            onChange={(e) => onSelectNode(e.target.value || null)}
            style={SELECT_STYLE}
            aria-label="Select node"
          >
            <option value="">— Select —</option>
            {screenIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label style={LABEL_STYLE}>Title</label>
        <input
          type="text"
          value={node.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          style={INPUT_STYLE}
          aria-label="Title"
        />
      </div>

      <div>
        <label style={LABEL_STYLE}>Subtitle</label>
        <textarea
          value={node.subtitle ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          style={TEXTAREA_STYLE}
          rows={2}
          aria-label="Subtitle"
        />
      </div>

      <div>
        <label style={LABEL_STYLE}>Step label</label>
        <input
          type="text"
          value={node.stepLabel ?? ""}
          onChange={(e) => onChange({ stepLabel: e.target.value })}
          style={INPUT_STYLE}
          aria-label="Step label"
        />
      </div>

      <div
        style={{
          paddingTop: 8,
          borderTop: "1px solid var(--color-border, #dadce0)",
        }}
      >
        <div style={{ ...LABEL_STYLE, marginBottom: 2 }}>Step look</div>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary, #5f6368)",
            lineHeight: 1.35,
            margin: "0 0 10px",
          }}
        >
          This slide only: light header, visual weight, and vertical density. Not the deck color theme (use Deck theme
          in the slide outline when building a deck).
        </p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--color-text-primary, #202124)",
            marginBottom: 10,
          }}
        >
          <input
            type="checkbox"
            checked={node.lightTheme === true}
            onChange={(e) => onChange({ lightTheme: e.target.checked })}
            aria-label="Light theme"
          />
          Light theme
        </label>
        <div>
          <label style={LABEL_STYLE}>Visual tone</label>
          <select
            value={node.visualTone ?? "default"}
            onChange={(e) => onChange({ visualTone: e.target.value })}
            style={SELECT_STYLE}
            aria-label="Visual tone"
          >
            <option value="default">default</option>
            <option value="soft">soft</option>
            <option value="bold">bold</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={LABEL_STYLE}>Density</label>
          <select
            value={node.density ?? "comfortable"}
            onChange={(e) => onChange({ density: e.target.value })}
            style={SELECT_STYLE}
            aria-label="Density"
          >
            <option value="comfortable">comfortable</option>
            <option value="compact">compact</option>
          </select>
        </div>
      </div>

      {!isBasic ? (
        <div>
          <label style={LABEL_STYLE}>Layout</label>
          {slideLayoutPreview && layoutTileOptions.length > 0 ? (
            <div style={{ marginBottom: 10 }}>
              <LayoutTilePicker
                title="Live preview"
                value={layoutValue}
                options={layoutTileOptions}
                onChange={(id) => onChange({ layout: id })}
                mode="stack"
                variant="section"
              />
            </div>
          ) : null}
          <label style={{ ...LABEL_STYLE, marginTop: slideLayoutPreview ? 4 : 0 }}>Layout (list)</label>
          <select
            value={layoutValue}
            onChange={(e) => onChange({ layout: e.target.value })}
            style={SELECT_STYLE}
            aria-label="Layout"
          >
            {layoutOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {mediaPanel}

      {!isBasic ? (
        <div>
          <label style={LABEL_STYLE}>Next screen</label>
          <select
            value={node.nextScreenId ?? ""}
            onChange={(e) => onChange({ nextScreenId: e.target.value || undefined })}
            style={SELECT_STYLE}
            aria-label="Next screen"
          >
            <option value="">— None —</option>
            {screenIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {isBasic ? primaryButtonBasic : buttonsAdvanced}

      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid var(--color-border, #dadce0)",
        }}
      >
        <WalkthroughTrackerInspector
          walkthrough={node.walkthrough}
          trackerResponse={node.trackerResponse}
          onPatch={(patch) => onChange(patch as Partial<EditableNode>)}
          learnWalkthroughIntro={layoutAuthoringLocked ? LEARN_WALKTHROUGH_SECTION_INTRO : undefined}
        />
      </div>

      <SlideContentBlocksEditor
        content={content}
        hideRawJson={layoutAuthoringLocked}
        onChange={(next: LandingContentBlock[]) => onChange({ content: next as EditableNode["content"] })}
      />
    </div>
  );
}
