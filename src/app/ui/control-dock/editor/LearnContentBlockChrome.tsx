"use client";

import React, { useCallback, useState } from "react";
import { ADD_BLOCK_TYPE_OPTIONS } from "@/lib/landing-content-blocks/blockDefaults";

const DND_TYPE = "application/x-learn-block-index";

export type LearnContentBlockChromeProps = {
  blockIndex: number;
  blockType: string;
  selected: boolean;
  blockCount: number;
  onSelectBlock: (index: number) => void;
  onInsertAt: (index: number, blockType: string) => void;
  onDuplicateAt: (index: number) => void;
  onRemoveAt: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onMoreInInspector?: () => void;
  children: React.ReactNode;
};

export default function LearnContentBlockChrome({
  blockIndex,
  blockType,
  selected,
  blockCount,
  onSelectBlock,
  onInsertAt,
  onDuplicateAt,
  onRemoveAt,
  onMove,
  onMoreInInspector,
  children,
}: LearnContentBlockChromeProps) {
  const [dragOver, setDragOver] = useState<"above" | "below" | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleChromeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.closest(
          "input, textarea, select, button, a[href], label, [role='link'], [role='button'], [data-learn-inline-edit], [aria-label='Click to edit']"
        )
      ) {
        return;
      }
      e.stopPropagation();
      onSelectBlock(blockIndex);
    },
    [blockIndex, onSelectBlock]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData(DND_TYPE, String(blockIndex));
      e.dataTransfer.effectAllowed = "move";
      setDragging(true);
    },
    [blockIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setDragOver(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    setDragOver(e.clientY < mid ? "above" : "below");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    setDragOver(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = e.dataTransfer.getData(DND_TYPE);
      const from = parseInt(raw, 10);
      setDragOver(null);
      setDragging(false);
      if (Number.isNaN(from)) return;
      if (from === blockIndex && dragOver === null) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const half = e.clientY < mid ? "above" : "below";
      let to = half === "above" ? blockIndex : blockIndex + 1;
      if (from === to || from === to - 1) {
        /* dropped on self boundary */
      }
      if (from < to) to -= 1;
      onMove(from, to);
    },
    [blockIndex, dragOver, onMove]
  );

  return (
    <div
      className={`learn-block-chrome${selected ? " learn-block-chrome--selected" : ""}${dragging ? " learn-block-chrome--dragging" : ""}`}
      data-learn-block-chrome="1"
      data-learn-block-index={blockIndex}
      data-learn-block-type={blockType}
      onMouseDown={handleChromeMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver === "above" ? <div className="learn-block-chrome__drop-line learn-block-chrome__drop-line--above" aria-hidden /> : null}
      <div className="learn-block-chrome__toolbar" data-learn-block-toolbar="1">
        <button
          type="button"
          className="learn-block-chrome__handle"
          draggable
          aria-label={`Drag to reorder ${blockType} block`}
          aria-grabbed={dragging}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </button>
        <span className="learn-block-chrome__type">{blockType}</span>
        <label className="learn-block-chrome__sr-only" htmlFor={`learn-add-above-${blockIndex}`}>
          Add block above
        </label>
        <select
          id={`learn-add-above-${blockIndex}`}
          className="learn-block-chrome__select"
          aria-label="Add block above"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v) {
              onInsertAt(blockIndex, v);
              ev.target.value = "";
            }
          }}
        >
          <option value="">+ Above</option>
          {ADD_BLOCK_TYPE_OPTIONS.map((t) => (
            <option key={`a-${t.value}`} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="learn-block-chrome__sr-only" htmlFor={`learn-add-below-${blockIndex}`}>
          Add block below
        </label>
        <select
          id={`learn-add-below-${blockIndex}`}
          className="learn-block-chrome__select"
          aria-label="Add block below"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v) {
              onInsertAt(blockIndex + 1, v);
              ev.target.value = "";
            }
          }}
        >
          <option value="">+ Below</option>
          {ADD_BLOCK_TYPE_OPTIONS.map((t) => (
            <option key={`b-${t.value}`} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="learn-block-chrome__btn"
          aria-label="Duplicate block"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateAt(blockIndex);
          }}
        >
          ⧉
        </button>
        <button
          type="button"
          className="learn-block-chrome__btn learn-block-chrome__btn--danger"
          aria-label="Remove block"
          disabled={blockCount <= 1}
          title={blockCount <= 1 ? "Cannot remove the only block" : undefined}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (blockCount > 1) onRemoveAt(blockIndex);
          }}
        >
          ✕
        </button>
        {onMoreInInspector ? (
          <button
            type="button"
            className="learn-block-chrome__btn learn-block-chrome__btn--more"
            aria-label="More in inspector"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMoreInInspector();
            }}
          >
            More
          </button>
        ) : null}
      </div>
      {dragOver === "below" ? <div className="learn-block-chrome__drop-line learn-block-chrome__drop-line--below" aria-hidden /> : null}
      <div className="learn-block-chrome__body">{children}</div>
    </div>
  );
}
