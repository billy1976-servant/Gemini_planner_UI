"use client";

import React from "react";
import { toMin } from "@/logic/planner/date-helpers";
import {
  DAY_START_MIN,
  DAY_END_MIN,
  SLOT_MINUTES,
  SLOT_HEIGHT,
  TOTAL_SLOTS,
  TIMELINE_GRID_HEIGHT,
} from "./planner-timeline-constants";

export type TimelineAxisProps = {
  slotHeight?: number;
  dayStartMin?: number;
  dayEndMin?: number;
  slotMinutes?: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
};

const defaultProps = {
  slotHeight: SLOT_HEIGHT,
  dayStartMin: DAY_START_MIN,
  dayEndMin: DAY_END_MIN,
  slotMinutes: SLOT_MINUTES,
  width: 48,
};

export function TimelineAxis({
  slotHeight = defaultProps.slotHeight,
  dayStartMin = defaultProps.dayStartMin,
  dayEndMin = defaultProps.dayEndMin,
  slotMinutes = defaultProps.slotMinutes,
  width = defaultProps.width,
  className,
  style,
}: TimelineAxisProps) {
  const totalSlots = (dayEndMin - dayStartMin) / slotMinutes;
  const height = totalSlots * slotHeight;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-bg-secondary)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-muted)",
        overflow: "hidden",
        ...style,
      }}
      aria-hidden
    >
      {Array.from({ length: totalSlots + 1 }, (_, i) => {
        const min = dayStartMin + i * slotMinutes;
        if (min >= dayEndMin) return null;
        return (
          <div
            key={i}
            style={{
              height: slotHeight,
              paddingLeft: 4,
              lineHeight: `${slotHeight}px`,
              boxSizing: "border-box",
            }}
          >
            {toMin(min)}
          </div>
        );
      })}
    </div>
  );
}

export { TIMELINE_GRID_HEIGHT, TOTAL_SLOTS, SLOT_HEIGHT };
