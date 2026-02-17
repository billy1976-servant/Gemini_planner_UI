"use client";

import { useState, useEffect, useMemo } from "react";
import { getState, subscribeState } from "@/state/state-store";
import type { StructureItem, Block, Rollup } from "@/logic/engines/structure/structure.types";
import { sortByPriority, isVisibleInWeekView } from "@/logic/engines/structure/prioritization.engine";
import { isDueOn } from "@/logic/engines/structure/recurrence.engine";
import { getWeekDates, getMonthCells, toKey } from "@/logic/planner/date-helpers";
import type { MonthCell } from "@/logic/planner/date-helpers";
import { foldersList, subByFolder, catBySub } from "@/logic/planner/task-tree-engine";
import type { StructureTreeNode } from "@/logic/engines/structure/structure.types";

type StructureSlice = {
  tree?: StructureTreeNode[];
  items: StructureItem[];
  blocksByDate?: Record<string, Block[]>;
  rules?: Record<string, unknown>;
  calendarView?: "day" | "week" | "month";
  selectedDate?: string;
  weekDates?: string[];
  monthRollup?: Rollup[];
  scheduledSection?: string;
};

function getStructure(): StructureSlice {
  const s = getState()?.values?.structure;
  if (s && typeof s === "object" && Array.isArray((s as StructureSlice).items))
    return s as StructureSlice;
  return { items: [], blocksByDate: {} };
}

/** Day view: selected date, blocks for that date, tasks due on that date (including recurring), sorted by priority. */
export function useDayViewModel() {
  const [slice, setSlice] = useState<StructureSlice>(getStructure);
  useEffect(() => {
    const unsub = subscribeState(() => setSlice(getStructure()));
    return unsub;
  }, []);

  const selectedDate = slice.selectedDate ?? toKey(new Date());
  const refDate = useMemo(() => new Date(selectedDate + "T12:00:00"), [selectedDate]);
  const blocks = useMemo(
    () => (slice.blocksByDate?.[selectedDate] ?? []) as Block[],
    [slice.blocksByDate, selectedDate]
  );
  const items = useMemo(() => {
    const rules = (slice.rules ?? {}) as Parameters<typeof sortByPriority>[2];
    const dueOnDay = slice.items.filter((i) => isDueOn(i, refDate));
    return sortByPriority(dueOnDay, refDate, rules);
  }, [slice.items, slice.rules, refDate]);

  const tree = (slice.tree ?? []) as StructureTreeNode[];
  const treeFolders = useMemo(() => foldersList(tree), [tree]);
  const treeSubByFolder = useMemo(() => subByFolder(tree), [tree]);
  const treeCatBySub = useMemo(() => catBySub(tree), [tree]);

  return {
    selectedDate,
    refDate,
    blocks,
    items,
    rules: slice.rules ?? {},
    treeFolders,
    subByFolder: treeSubByFolder,
    catBySub: treeCatBySub,
    scheduledSection: slice.scheduledSection,
  };
}

/** Week view: 7 dates, items per day (recurring + due), blocks per day, visibility filter applied. */
export function useWeekViewModel() {
  const [slice, setSlice] = useState<StructureSlice>(getStructure);
  useEffect(() => {
    const unsub = subscribeState(() => setSlice(getStructure()));
    return unsub;
  }, []);

  const weekDates = useMemo(() => {
    if (slice.weekDates?.length === 7) return slice.weekDates;
    const ref = slice.selectedDate ? new Date(slice.selectedDate) : new Date();
    return getWeekDates(ref);
  }, [slice.weekDates, slice.selectedDate]);

  const itemsByDay = useMemo(() => {
    const rules = (slice.rules ?? {}) as Parameters<typeof isVisibleInWeekView>[2];
    const byDay: Record<string, StructureItem[]> = {};
    for (const dateKey of weekDates) {
      const d = new Date(dateKey + "T12:00:00");
      const dayItems = slice.items.filter(
        (i) => isDueOn(i, d) && isVisibleInWeekView(i, d, rules)
      );
      byDay[dateKey] = sortByPriority(dayItems, d, rules);
    }
    return byDay;
  }, [slice.items, slice.rules, weekDates]);

  const blocksByDay = useMemo(() => {
    const out: Record<string, Block[]> = {};
    for (const dateKey of weekDates) {
      out[dateKey] = (slice.blocksByDate?.[dateKey] ?? []) as Block[];
    }
    return out;
  }, [slice.blocksByDate, weekDates]);

  return {
    weekDates,
    itemsByDay,
    blocksByDay,
    rules: slice.rules ?? {},
  };
}

/** Month view: 42 cells, rollup count (or items) per date key. */
export function useMonthViewModel() {
  const [slice, setSlice] = useState<StructureSlice>(getStructure);
  useEffect(() => {
    const unsub = subscribeState(() => setSlice(getStructure()));
    return unsub;
  }, []);

  const selectedDate = slice.selectedDate ?? toKey(new Date());
  const [year, month] = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return [d.getFullYear(), d.getMonth()];
  }, [selectedDate]);

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);

  const rollupByKey = useMemo(() => {
    const map: Record<string, Rollup> = {};
    for (const r of slice.monthRollup ?? []) {
      map[r.period] = r;
    }
    return map;
  }, [slice.monthRollup]);

  const blocksByDate = slice.blocksByDate ?? {};

  return {
    selectedDate,
    year,
    month,
    cells,
    rollupByKey,
    items: slice.items,
    blocksByDate,
  };
}

export type { MonthCell };
