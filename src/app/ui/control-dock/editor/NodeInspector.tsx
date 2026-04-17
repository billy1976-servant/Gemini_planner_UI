"use client";

import React from "react";
import { stopSpaceEnterBubblingFromFormFields } from "@/lib/editable-keyboard";
import type { SlideBuilderMeta } from "@/lib/slide-builder-recipes";
import type { LandingContentBlock } from "@/lib/landing-content-blocks/types";
import SlideContentBlocksEditor from "./SlideContentBlocksEditor";
import { landingLayoutSelectOptions } from "@/lib/landing-layout-catalog";
import LayoutTilePicker from "@/app/ui/control-dock/layout/LayoutTilePicker";
import type { LayoutTileOption } from "@/app/ui/control-dock/layout/LayoutTilePicker";
import LandingSlideLayoutPreview, {
  SlideLayoutPreviewErrorBoundary,
} from "@/01_App/(live) Business/Container_Creations/LandingSlideLayoutPreview";
import InspectorCollapsible from "./InspectorCollapsible";

/** Editable node shape (subset of landing screen). */
export type EditableNode = {
  id: string;
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

  function patchFirstMedia(partial: Record<string, unknown>) {
    const next = media.map((item, idx) => (idx === 0 ? { ...item, ...partial } : item));
    onChange({ media: next });
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
            <option value="link">link</option>
            <option value="goto">goto</option>
            <option value="next">next</option>
            <option value="back">back</option>
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

        {!isBasic ? (
          <InspectorCollapsible title="Layout" defaultOpen>
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
          </InspectorCollapsible>
        ) : null}

        <InspectorCollapsible title="Content" defaultOpen>
          <SlideContentBlocksEditor
            content={content}
            onChange={(next: LandingContentBlock[]) => onChange({ content: next as EditableNode["content"] })}
          />
        </InspectorCollapsible>

        <InspectorCollapsible title="Advanced" defaultOpen={false}>
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

      <SlideContentBlocksEditor
        content={content}
        onChange={(next: LandingContentBlock[]) => onChange({ content: next as EditableNode["content"] })}
      />
    </div>
  );
}
