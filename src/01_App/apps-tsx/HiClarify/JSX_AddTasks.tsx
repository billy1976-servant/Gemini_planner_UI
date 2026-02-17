"use client";

import React, { useMemo, useState } from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { useDayViewModel } from "./usePlannerViewModels";
import {
  estimateDay,
  fmtEst,
  suggestFrequency,
  formatFrequency,
  getStartDateOptions,
  freqToRecurrence,
  folderToCategoryId,
  type StartDateOption,
} from "@/logic/planner/add-tasks-helpers";
import { toKey } from "@/logic/planner/date-helpers";
import type { RecurrenceBlock } from "@/logic/engines/structure/structure.types";

// Category tiles: same structure as your Quick-Add; folder maps to structure categoryId (home, business, relationships).
const TILES: Array<{
  key: string;
  title: string;
  subtitle?: string;
  folder: string;
  sections: Array<{ label?: string; items: Array<{ name: string; project?: string } | string> }>;
}> = [
  {
    key: "HOME_CLEAN",
    title: "Cleaning",
    subtitle: "house & yard",
    folder: "Home",
    sections: [
      {
        label: "Rooms",
        items: [
          { name: "Kitchen" },
          { name: "Bathroom", project: "Bath Remodel" },
          { name: "Floors" },
          { name: "Laundry" },
        ],
      },
    ],
  },
  {
    key: "HOME_MAINT",
    title: "Maintenance",
    subtitle: "repairs & upkeep",
    folder: "Home",
    sections: [
      {
        label: "General",
        items: [
          { name: "Change air filter" },
          { name: "Test smoke alarms" },
          { name: "Declutter" },
          { name: "Get Haircut" },
        ],
      },
    ],
  },
  {
    key: "HOME_YARD",
    title: "Yard Work",
    subtitle: "garden & lawn",
    folder: "Home",
    sections: [
      {
        label: "Tasks",
        items: [
          { name: "Mow the lawn" },
          { name: "Weed beds", project: "Garden" },
          { name: "Trim bushes", project: "Chicken Coop Build" },
        ],
      },
    ],
  },
  {
    key: "BIZ_FINANCE",
    title: "Finances",
    subtitle: "bills & budget",
    folder: "Business",
    sections: [
      {
        label: "Monthly Bills",
        items: [
          { name: "Electric bill" },
          { name: "Water bill" },
          { name: "Internet bill" },
          { name: "Rent/Mortgage" },
        ],
      },
    ],
  },
  {
    key: "BIZ_ADMIN",
    title: "Admin",
    subtitle: "paperwork & email",
    folder: "Business",
    sections: [
      {
        label: "Desk Work",
        items: [
          { name: "Inbox zero" },
          { name: "File paperwork" },
          { name: "Budget review" },
        ],
      },
    ],
  },
  {
    key: "BIZ_CARS",
    title: "Vehicles",
    subtitle: "maintenance",
    folder: "Business",
    sections: [
      {
        label: "Tasks",
        items: [
          { name: "Oil change" },
          { name: "Get gas" },
          { name: "Car wash" },
        ],
      },
    ],
  },
  {
    key: "CHURCH_VOL",
    title: "Volunteer",
    subtitle: "serving teams",
    folder: "Church",
    sections: [
      {
        label: "Teams",
        items: [
          { name: "Greeter" },
          { name: "Usher" },
          { name: "Kids Ministry" },
          { name: "Worship Team" },
        ],
      },
    ],
  },
  {
    key: "CHURCH_GROUP",
    title: "Small Group",
    subtitle: "prep & hosting",
    folder: "Church",
    sections: [
      {
        label: "Tasks",
        items: [
          { name: "Prepare lesson" },
          { name: "Clean for guests" },
          { name: "Send reminders" },
        ],
      },
    ],
  },
];

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-base, system-ui, sans-serif)",
    paddingBottom: 24,
  },
  header: {
    padding: "var(--spacing-md) var(--spacing-lg)",
    background: "var(--color-surface-1)",
    borderBottom: "1px solid var(--color-border)",
    marginBottom: "var(--spacing-md)",
  },
  title: {
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  },
  section: {
    maxWidth: 672,
    margin: "0 auto",
    padding: "0 var(--spacing-lg)",
  },
  folderTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  folderBtn: {
    padding: "6px 12px",
    borderRadius: 9999,
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
  folderBtnActive: {
    background: "var(--color-surface-1)",
    borderColor: "var(--color-border)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  tile: {
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    padding: "var(--spacing-md)",
  },
  tileHeader: {
    cursor: "pointer",
    marginBottom: 4,
  },
  tileTitle: {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
  },
  tileSubtitle: {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
  },
  sectionLabel: {
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    marginTop: 12,
    marginBottom: 6,
  },
  chipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  chip: {
    padding: "6px 12px",
    borderRadius: 9999,
    fontSize: "var(--font-size-sm)",
    border: "none",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
  chipSelected: {
    background: "var(--color-primary, #2563eb)",
    color: "var(--color-on-primary, #fff)",
  },
  selectedPanel: {
    marginTop: 24,
    padding: "var(--spacing-md)",
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
  },
  selectedTitle: {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
    marginBottom: 12,
  },
  taskRow: {
    padding: "8px 12px",
    marginBottom: 8,
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
  },
  taskName: {
    fontWeight: 600,
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    marginBottom: 8,
  },
  startRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  startLabel: {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-secondary)",
    marginRight: 4,
  },
  startBtn: {
    padding: "4px 10px",
    borderRadius: 9999,
    fontSize: "var(--font-size-xs)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
  startBtnActive: {
    background: "var(--color-surface-2)",
    borderColor: "var(--color-border)",
  },
  dayChooser: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  submitBtn: {
    marginTop: 16,
    width: "100%",
    padding: "10px 16px",
    borderRadius: 9999,
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    border: "none",
    background: "var(--color-primary, #2563eb)",
    color: "var(--color-on-primary, #fff)",
    cursor: "pointer",
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 16px",
    borderRadius: 12,
    background: "var(--color-text-primary)",
    color: "var(--color-bg-primary)",
    fontSize: "var(--font-size-sm)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toastUndo: {
    textDecoration: "underline",
    cursor: "pointer",
  },
};

function getTaskName(item: { name: string; project?: string } | string): string {
  return typeof item === "string" ? item : item.name;
}

export default function JSX_AddTasks() {
  const { treeFolders } = useDayViewModel();
  const [selectedFolders, setSelectedFolders] = useState<string[]>(["ALL"]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [pendingSchedules, setPendingSchedules] = useState<Record<string, string>>({});
  const [dayPickerTask, setDayPickerTask] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const folderList = useMemo(() => {
    const fromTree = treeFolders.map((f) => f.name);
    const fromTiles = Array.from(new Set(TILES.map((t) => t.folder)));
    const combined = Array.from(new Set([...fromTree, ...fromTiles]));
    return combined.length ? combined : ["Home", "Business", "Church"];
  }, [treeFolders]);

  const filteredTiles = useMemo(() => {
    if (selectedFolders.includes("ALL")) return TILES;
    return TILES.filter((t) => selectedFolders.includes(t.folder));
  }, [selectedFolders]);

  const leftTiles = useMemo(() => filteredTiles.filter((_, i) => i % 2 === 0), [filteredTiles]);
  const rightTiles = useMemo(() => filteredTiles.filter((_, i) => i % 2 !== 0), [filteredTiles]);

  const toggleFolder = (folder: string) => {
    if (folder === "ALL") {
      setSelectedFolders(["ALL"]);
      return;
    }
    setSelectedFolders((prev) => {
      const next = prev.filter((f) => f !== "ALL");
      const has = next.includes(folder);
      const updated = has ? next.filter((f) => f !== folder) : [...next, folder];
      return updated.length === 0 ? ["ALL"] : updated;
    });
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleTask = (taskName: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskName) ? prev.filter((t) => t !== taskName) : [...prev, taskName]
    );
    if (!selectedTasks.includes(taskName)) {
      setPendingSchedules((cur) => {
        const next = { ...cur };
        delete next[taskName];
        return next;
      });
    }
  };

  const selectDate = (task: string, buttonValue: string) => {
    setPendingSchedules((cur) => ({ ...cur, [task]: buttonValue }));
  };

  const handleSubmit = () => {
    const state = getState() ?? {};
    const toAdd: Array<{
      title: string;
      dueDate: string;
      categoryId: string;
      priority: number;
      recurrence?: RecurrenceBlock;
    }> = [];

    for (const taskName of selectedTasks) {
      const buttonValue = pendingSchedules[taskName] ?? "Today";
      let folder = "Business";
      for (const tile of TILES) {
        const items = tile.sections.flatMap((s) => s.items).map(getTaskName);
        if (items.includes(taskName)) {
          folder = tile.folder;
          break;
        }
      }
      const freq = suggestFrequency(taskName);
      const nextDate = estimateDay({ mode: folder, button: buttonValue });
      const dueDate = toKey(nextDate);
      const categoryId = folderToCategoryId(folder);
      const recurrence = freqToRecurrence(freq);
      toAdd.push({
        title: taskName,
        dueDate,
        categoryId,
        priority: 5,
        ...(recurrence && { recurrence }),
      });
    }

    if (toAdd.length === 0) return;

    runAction({ name: "structure:addItems", items: toAdd }, state);
    setToast(`Added ${toAdd.length} task(s). They will appear on the Day view.`);
    setSelectedTasks([]);
    setPendingSchedules({});
    setDayPickerTask(null);
  };

  const canSubmit =
    selectedTasks.length > 0 &&
    selectedTasks.every((t) => (pendingSchedules[t] ?? "Today").length > 0);
  const effectivePending = (task: string) => pendingSchedules[task] ?? "Today";

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <h1 style={styles.title}>Add tasks</h1>
        <p style={styles.subtitle}>Pick tasks, set start date, then submit. They’ll show on the Day view.</p>
      </header>

      <div style={styles.section}>
        <div style={styles.folderTabs}>
          <button
            type="button"
            style={{
              ...styles.folderBtn,
              ...(selectedFolders.includes("ALL") ? styles.folderBtnActive : {}),
            }}
            onClick={() => toggleFolder("ALL")}
          >
            All
          </button>
          {folderList.map((f) => (
            <button
              key={f}
              type="button"
              style={{
                ...styles.folderBtn,
                ...(selectedFolders.includes(f) ? styles.folderBtnActive : {}),
              }}
              onClick={() => toggleFolder(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          <div>
            {leftTiles.map((tile) => (
              <div key={tile.key} style={styles.tile}>
                <div style={styles.tileHeader} onClick={() => toggleExpand(tile.key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleExpand(tile.key)}>
                  <div style={styles.tileTitle}>{tile.title}</div>
                  {tile.subtitle && <div style={styles.tileSubtitle}>{tile.subtitle}</div>}
                </div>
                {expanded.includes(tile.key) &&
                  tile.sections.map((sec, idx) => (
                    <div key={idx}>
                      {sec.label && <div style={styles.sectionLabel}>{sec.label}</div>}
                      <div style={styles.chipWrap}>
                        {sec.items.map((it) => {
                          const name = getTaskName(it);
                          const isSelected = selectedTasks.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              style={{ ...styles.chip, ...(isSelected ? styles.chipSelected : {}) }}
                              onClick={() => toggleTask(name)}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
          <div>
            {rightTiles.map((tile) => (
              <div key={tile.key} style={styles.tile}>
                <div style={styles.tileHeader} onClick={() => toggleExpand(tile.key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleExpand(tile.key)}>
                  <div style={styles.tileTitle}>{tile.title}</div>
                  {tile.subtitle && <div style={styles.tileSubtitle}>{tile.subtitle}</div>}
                </div>
                {expanded.includes(tile.key) &&
                  tile.sections.map((sec, idx) => (
                    <div key={idx}>
                      {sec.label && <div style={styles.sectionLabel}>{sec.label}</div>}
                      <div style={styles.chipWrap}>
                        {sec.items.map((it) => {
                          const name = getTaskName(it);
                          const isSelected = selectedTasks.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              style={{ ...styles.chip, ...(isSelected ? styles.chipSelected : {}) }}
                              onClick={() => toggleTask(name)}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {selectedTasks.length > 0 && (
          <div style={styles.selectedPanel}>
            <div style={styles.selectedTitle}>Selected tasks</div>
            {selectedTasks.map((taskName) => {
              let folder = "Business";
              for (const tile of TILES) {
                const items = tile.sections.flatMap((s) => s.items).map(getTaskName);
                if (items.includes(taskName)) {
                  folder = tile.folder;
                  break;
                }
              }
              const freq = suggestFrequency(taskName);
              const buttonValue = effectivePending(taskName);
              const nextDate = estimateDay({ mode: folder, button: buttonValue });
              const options: StartDateOption[] = getStartDateOptions(freq);
              return (
                <div key={taskName} style={styles.taskRow}>
                  <div style={styles.taskName}>{taskName}</div>
                  <div style={styles.taskMeta}>
                    {formatFrequency(freq)} · Next: {fmtEst(nextDate)}
                  </div>
                  <div style={styles.startRow}>
                    <span style={styles.startLabel}>Start:</span>
                    {options.map((opt) => {
                      const isSelected =
                        pendingSchedules[taskName] === opt.value ||
                        (opt.value === "Choose day" && (pendingSchedules[taskName] ?? "").startsWith("Day:"));
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          style={{ ...styles.startBtn, ...(isSelected ? styles.startBtnActive : {}) }}
                          onClick={() => {
                            if (opt.value.includes("Choose day")) {
                              setDayPickerTask((cur) => (cur === taskName ? null : taskName));
                            } else {
                              selectDate(taskName, opt.value);
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {dayPickerTask === taskName && (
                    <div style={styles.dayChooser}>
                      {["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          style={styles.startBtn}
                          onClick={() => {
                            selectDate(taskName, `Day: ${d}`);
                            setDayPickerTask(null);
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              style={{
                ...styles.submitBtn,
                ...(!canSubmit ? styles.submitBtnDisabled : {}),
              }}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Add to planner
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div style={styles.toast}>
          {toast}
          <button type="button" style={styles.toastUndo} onClick={() => setToast("")}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
