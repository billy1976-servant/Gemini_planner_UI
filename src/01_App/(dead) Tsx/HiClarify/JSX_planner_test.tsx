"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { fromHM, toMin as toMinStr } from "@/logic/planner/date-helpers";
import { blockToPosition, TIMELINE_GRID_HEIGHT } from "./planner-timeline-constants";

/**
 * Day Planner — uses sidebar palette CSS variables throughout.
 * Change palette (or other sidebar options) in the right sidebar to see colors, spacing, fonts update on demand.
 */

/* ========= Helpers (use date-helpers for time; toMin = minutes from string for local math) ========= */
function toMin(t: string): number {
  return fromHM(t);
}
function fromMin(mins: number): string {
  return toMinStr(mins);
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type ParsedTask = { title: string; P: number; minutes: number; notes: string };
function parseTask(str: string): ParsedTask {
  const out: ParsedTask = { title: String(str || "").trim(), P: 8, minutes: 30, notes: "" };
  const parts = out.title.split("|");
  out.title = parts[0].trim();
  if (parts.length > 1) out.notes = parts.slice(1).join("|").trim();
  const mP = out.title.match(/^\s*(\d{1,2})\s+(.*)$/);
  if (mP) {
    out.P = clamp(parseInt(mP[1], 10), 1, 10);
    out.title = mP[2].trim();
  }
  const mT = out.title.match(/\((\d+)\s*min\)/i);
  if (mT) out.minutes = parseInt(mT[1], 10);
  out.title = out.title.replace(/\(\d+\s*min\)\s*$/i, "").trim();
  return out;
}

function priorityStyle(P: number): React.CSSProperties {
  if (P >= 9) return { color: "var(--color-accent, #dc2626)", fontWeight: "var(--font-weight-bold)" };
  if (P >= 8) return { color: "var(--color-primary)", fontWeight: "var(--font-weight-semibold)" };
  return { color: "var(--color-text-muted)" };
}

function catIcon(name: string): string {
  const s = name.toLowerCase();
  if (s.includes("email")) return "✉️";
  if (s.includes("call")) return "📞";
  if (s.includes("web")) return "💻";
  if (s.includes("sale")) return "💼";
  if (s.includes("mow")) return "🌱";
  return "📁";
}

/* ========= Catalog ========= */
const CATALOG: Record<string, Record<string, Record<string, string[]>>> = {
  Work: {
    "Office Tasks": {
      Email: [
        "10 Process inbox (45 min) | Check spam for the TPS report and follow up on the Acme project.",
        "8 Follow up with team",
        "Review project brief | Make sure to read the new design specs first.",
      ],
      Calls: ["9 Client check-in (15 min) | Ask about their Q4 budget.", "Call vendor"],
      "Website Development": [
        "10 Deploy new feature (60 min) | Remember to run the final tests on staging.",
        "Fix login bug",
        "Update dependencies",
      ],
      Invoices: ["Send invoice to Acme Corp"],
      Planning: ["Plan Q3 roadmap (90 min)"],
    },
    Sales: {
      Prospecting: ["Research 5 new leads"],
      Demos: ["Prepare demo for tomorrow (45 min) | Double-check the slides for typos."],
    },
  },
  Home: {
    Gardening: {
      "Mow lawn": ["Mow the front lawn (45 min)"],
      Weed: ["Weed the flower beds (30 min) | Don't forget the ones behind the shed."],
      Fertilize: ["Fertilize the roses"],
    },
    Family: {
      Dinner: ["Cook dinner"],
      Lunch: ["Make lunch"],
    },
  },
};

const CatalogService = {
  _version: 1,
  version: () => CatalogService._version,
  tasks: (folder: string, subfolder: string, category: string) =>
    CATALOG[folder]?.[subfolder]?.[category] ?? [],
};

/* ========= Long-press hook ========= */
function useLongPress(onLongPress: () => void, ms = 420) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onLongPress, ms);
  };
  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return { onPointerDown: start, onPointerUp: clear, onPointerLeave: clear };
}

/* ========= Shared palette styles (all use CSS vars so sidebar palette changes apply) ========= */
const styles = {
  screen: {
    minHeight: "100vh",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
  } as React.CSSProperties,
  header: {
    position: "sticky" as const,
    top: 0,
    background: "var(--color-surface-1)",
    borderBottom: "1px solid var(--color-border)",
    zIndex: 10,
    padding: "var(--spacing-md) var(--spacing-lg)",
    maxWidth: 896,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "var(--gap-md)",
  } as React.CSSProperties,
  btnIcon: {
    width: 32,
    height: 32,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-bg-secondary)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "var(--spacing-sm) var(--spacing-md)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-primary)",
    color: "var(--color-on-primary)",
    border: "none",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)",
  } as React.CSSProperties,
  btnSecondary: {
    padding: "var(--spacing-sm) var(--spacing-md)",
    borderRadius: "var(--radius-md)",
    background: "transparent",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
  } as React.CSSProperties,
  card: {
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-border)",
    padding: "var(--spacing-md)",
    boxShadow: "var(--shadow-sm, none)",
  } as React.CSSProperties,
  dropdown: {
    position: "absolute" as const,
    right: 0,
    marginTop: "var(--spacing-sm)",
    width: 280,
    maxHeight: 320,
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.1))",
    padding: "var(--spacing-md)",
    zIndex: 20,
    overflow: "auto",
  } as React.CSSProperties,
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 30,
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--spacing-lg)",
  } as React.CSSProperties,
  modalPanel: {
    background: "var(--color-surface-1)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.15))",
    padding: "var(--spacing-lg)",
    maxWidth: 400,
    width: "100%",
  } as React.CSSProperties,
  input: {
    flex: 1,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-sm) var(--spacing-md)",
    fontSize: "var(--font-size-sm)",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
  } as React.CSSProperties,
  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  } as React.CSSProperties,
  chip: {
    padding: "var(--spacing-1) var(--spacing-sm)",
    borderRadius: "var(--radius-full, 9999px)",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface-1)",
    fontSize: "var(--font-size-xs)",
    boxShadow: "var(--shadow-sm, none)",
  } as React.CSSProperties,
};

/* ========= Category Picker ========= */
function CategoryPicker({
  folder,
  subfolder,
  value,
  onChange,
}: {
  folder: string;
  subfolder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const options = useMemo(() => {
    const cats = Object.keys(CATALOG[folder]?.[subfolder] ?? {});
    return Array.from(new Set([...cats, ...value])).sort((a, b) => a.localeCompare(b));
  }, [folder, subfolder, value]);

  const toggle = (c: string) =>
    value.includes(c) ? onChange(value.filter((v) => v !== c)) : onChange([...value, c]);
  const selectAll = () => onChange(options);
  const selectNone = () => onChange([]);
  const addNew = () => {
    const name = newCat.trim();
    if (!name) return;
    onChange(Array.from(new Set([...value, name])));
    setAdding(false);
    setNewCat("");
  };

  return (
    <div style={{ position: "relative" }} ref={pickerRef}>
      <button
        style={{
          ...styles.btnSecondary,
          padding: "var(--spacing-1) var(--spacing-sm)",
          fontSize: "var(--font-size-xs)",
          background: "var(--color-surface-1)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Categories
      </button>
      {open && (
        <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-sm)" }}>
            <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)" }}>
              {folder} › {subfolder}
            </span>
            <div style={{ display: "flex", gap: "var(--gap-sm)" }}>
              <button type="button" style={{ fontSize: "var(--font-size-xs)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }} onClick={selectNone}>none</button>
              <button type="button" style={{ fontSize: "var(--font-size-xs)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }} onClick={selectAll}>all</button>
            </div>
          </div>
          <div style={{ maxHeight: 192, overflow: "auto", display: "flex", flexDirection: "column", gap: "var(--gap-xs)" }}>
            {options.map((opt) => (
              <label key={opt} style={styles.labelRow}>
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  onChange={() => toggle(opt)}
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {adding ? (
            <div style={{ marginTop: "var(--spacing-md)", display: "flex", gap: "var(--gap-sm)" }}>
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Add new category"
                style={styles.input}
              />
              <button type="button" style={styles.btnPrimary} onClick={addNew}>Add</button>
              <button type="button" style={styles.btnSecondary} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          ) : (
            <button
              type="button"
              style={{ marginTop: "var(--spacing-md)", width: "100%", padding: "var(--spacing-sm)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}
              onClick={() => setAdding(true)}
            >
              + Add new
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ========= Chunk Quick Menu ========= */
function ChunkQuickMenu({
  onClose,
  onCancel,
  onReschedule,
  onChangeFolder,
  onAddMeeting,
  presets,
}: {
  onClose: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onChangeFolder: () => void;
  onAddMeeting: () => void;
  presets: string[];
}) {
  return (
    <div
      style={{ ...styles.modalOverlay, zIndex: 30 }}
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div
        style={{
          ...styles.modalPanel,
          position: "relative",
          maxWidth: 320,
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--spacing-sm)", paddingLeft: "var(--spacing-sm)" }}>Slot options</h3>
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          <button type="button" style={{ width: "100%", textAlign: "left", padding: "var(--spacing-sm)", borderRadius: "var(--radius-md)", border: "none", background: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }} onClick={onCancel}>Cancel slot</button>
          <button type="button" style={{ width: "100%", textAlign: "left", padding: "var(--spacing-sm)", borderRadius: "var(--radius-md)", border: "none", background: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }} onClick={onReschedule}>Reschedule…</button>
          <button type="button" style={{ width: "100%", textAlign: "left", padding: "var(--spacing-sm)", borderRadius: "var(--radius-md)", border: "none", background: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }} onClick={onChangeFolder}>Change folder…</button>
          <button type="button" style={{ width: "100%", textAlign: "left", padding: "var(--spacing-sm)", borderRadius: "var(--radius-md)", border: "none", background: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }} onClick={onAddMeeting}>Add meeting…</button>
          <div style={{ padding: "var(--spacing-sm)", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-sm)" }}>Presets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap-sm)" }}>
              {presets.map((p) => (
                <span
                  key={p}
                  style={{ ...styles.chip, cursor: "pointer" }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "var(--spacing-md)", textAlign: "right" }}>
          <button type="button" style={styles.btnSecondary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ========= Folder Picker Modal (stub) ========= */
function FolderPickerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ ...styles.modalOverlay, zIndex: 50 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div style={{ ...styles.modalPanel, position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-lg)", marginBottom: "var(--spacing-md)" }}>Change Folder (TODO)</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--spacing-lg)" }}>This is where the folder and subfolder picker would go.</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--gap-sm)" }}>
          <button type="button" style={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button type="button" style={styles.btnPrimary} onClick={onClose}>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ========= Continue After Modal ========= */
function ContinueAfterModal({
  meetingTitle,
  onContinue,
  onChangeCategory,
  onClose,
}: {
  meetingTitle: string;
  onContinue: () => void;
  onChangeCategory: () => void;
  onClose: () => void;
}) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      <div style={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-sm)" }}>Continue after "{meetingTitle}"?</h3>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-md)" }}>
          Keep the remainder of this time slot on the current category, or change it?
        </p>
        <div style={{ display: "flex", gap: "var(--gap-sm)", justifyContent: "flex-end" }}>
          <button type="button" style={styles.btnSecondary} onClick={onChangeCategory}>Change</button>
          <button type="button" style={styles.btnPrimary} onClick={onContinue}>Continue</button>
        </div>
      </div>
    </div>
  );
}

/* ========= Chunk type ========= */
type ChunkEvent = { id: string; title: string; start: string; end: string; sticky?: boolean };
type Chunk = {
  id: string;
  label: string;
  start: string;
  end: string;
  folder: string;
  subfolder: string;
  categories: string[];
  events: ChunkEvent[];
  color?: string;
};

/* ========= Chunk Card ========= */
function ChunkCard({
  chunk,
  onUpdate,
}: {
  chunk: Chunk;
  onUpdate: (next: Chunk) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [askContinue, setAskContinue] = useState<ChunkEvent | null>(null);
  const [folderPicker, setFolderPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const longPress = useLongPress(() => setMenuOpen(true));

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const addMeeting = () => {
    const s = toMin(chunk.start) + 30;
    const e = s + 45;
    const event: ChunkEvent = { id: crypto.randomUUID(), title: "Meeting", start: fromMin(s), end: fromMin(e), sticky: true };
    const overlapped = toMin(event.end) < toMin(chunk.end);
    onUpdate({ ...chunk, events: [...chunk.events, event] });
    setMenuOpen(false);
    if (overlapped) setAskContinue(event);
  };

  const changeCategories = (cats: string[]) => onUpdate({ ...chunk, categories: cats });

  const categoryBlocks = useMemo(() => {
    if (!CatalogService.version()) return [];
    const blocks: { category: string; tasks: ParsedTask[]; total: number }[] = [];
    for (const c of chunk.categories) {
      const raw = CatalogService.tasks(chunk.folder, chunk.subfolder || "", c);
      let tasks = raw.map(parseTask);
      if (priorityOnly) tasks = tasks.filter((t) => t.P >= 8);
      const total = tasks.reduce((n, t) => n + (t.minutes || 0), 0);
      blocks.push({ category: c, tasks, total });
    }
    return blocks;
  }, [chunk.folder, chunk.subfolder, chunk.categories, priorityOnly]);

  const headerLine = `${chunk.label}  •  ${chunk.start}–${chunk.end}`;

  return (
    <div
      style={{
        ...styles.card,
        position: "relative",
        userSelect: "none",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onDoubleClick={() => setExpanded((e) => !e)}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
      {...longPress}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--gap-sm)" }}>
        <div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{headerLine}</div>
          <div style={{ fontWeight: "var(--font-weight-semibold)" }}>
            {chunk.folder}:{" "}
            <span style={{ fontWeight: "var(--font-weight-normal)" }}>
              {chunk.subfolder || <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>[Folder-level]</span>}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)" }}>
          {expanded && (
            <button
              type="button"
              style={{
                ...styles.btnSecondary,
                padding: "var(--spacing-1) var(--spacing-sm)",
                fontSize: "var(--font-size-xs)",
                background: "var(--color-surface-1)",
                outline: priorityOnly ? "2px solid var(--color-primary)" : undefined,
                outlineOffset: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setPriorityOnly((v) => !v);
              }}
              title="Show only P8–P10"
            >
              Priority only (8–10)
            </button>
          )}
          <CategoryPicker folder={chunk.folder} subfolder={chunk.subfolder} value={chunk.categories} onChange={changeCategories} />
        </div>
      </div>

      {!expanded && chunk.categories.length > 0 && (
        <div style={{ marginTop: "var(--spacing-sm)", display: "flex", flexWrap: "wrap", gap: "var(--gap-sm)" }}>
          {chunk.categories.map((c) => (
            <span key={c} style={styles.chip}>
              {c}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div
          style={{
            marginTop: "var(--spacing-md)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-1)",
            padding: "var(--spacing-md)",
            opacity: 0.9,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-sm)" }}>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tasks for: {chunk.subfolder || "All Categories"}
            </div>
            <button
              type="button"
              style={{
                ...styles.btnSecondary,
                padding: "var(--spacing-1) var(--spacing-sm)",
                fontSize: "var(--font-size-xs)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setPriorityOnly((v) => !v);
              }}
            >
              Priority only
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
            {CatalogService.version() === 0 && (
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "var(--spacing-sm)", textAlign: "center" }}>
                Load your sheet to see tasks.
              </div>
            )}

            {CatalogService.version() !== 0 && categoryBlocks.length === 0 && (
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "var(--spacing-sm)", textAlign: "center" }}>
                No categories selected.
              </div>
            )}

            {categoryBlocks.map(({ category, tasks, total }) => (
              <div
                key={category}
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-bg-muted)",
                  border: "1px solid var(--color-border)",
                  padding: "var(--spacing-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: "var(--font-weight-semibold)", textDecoration: "underline", textUnderlineOffset: 2, display: "flex", alignItems: "center", gap: "var(--gap-sm)" }}>
                    <span>{catIcon(category)}</span>
                    <span>{category}</span>
                  </div>
                  <label style={styles.labelRow}>
                    <input
                      type="checkbox"
                      checked={chunk.categories.includes(category)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...chunk.categories, category]))
                          : chunk.categories.filter((x) => x !== category);
                        onUpdate({ ...chunk, categories: next });
                      }}
                      style={{ borderRadius: "var(--radius-sm)" }}
                    />
                    <span>selected</span>
                  </label>
                </div>

                <div style={{ marginTop: "var(--spacing-sm)", paddingLeft: "var(--spacing-lg)" }}>
                  {tasks.length === 0 ? (
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>No tasks found for this category.</div>
                  ) : (
                    <ul style={{ fontSize: "var(--font-size-sm)", listStyle: "none", padding: 0, margin: 0 }}>
                      {tasks.map((t, idx) => {
                        const taskId = `${category}-${idx}`;
                        const isExpanded = expandedTasks.has(taskId);
                        return (
                          <li
                            key={idx}
                            style={{ borderBottom: "1px solid var(--color-border)", padding: "var(--spacing-xs) 0" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: t.notes ? "pointer" : "default",
                                padding: "var(--spacing-xs) 0",
                              }}
                              onClick={() => t.notes && toggleTaskExpand(taskId)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)" }}>
                                <span style={{ width: 24, textAlign: "right", ...priorityStyle(t.P) }}>{t.P}</span>
                                <span>{t.title}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)" }}>
                                <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>({t.minutes} min)</span>
                                <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)", width: 16, textAlign: "center" }}>{t.notes ? (isExpanded ? "▲" : "▼") : ""}</span>
                              </div>
                            </div>
                            {isExpanded && t.notes && (
                              <div
                                style={{
                                  paddingBottom: "var(--spacing-sm)",
                                  paddingTop: "var(--spacing-xs)",
                                  paddingLeft: "var(--spacing-lg)",
                                  paddingRight: "var(--spacing-sm)",
                                  fontSize: "var(--font-size-sm)",
                                  color: "var(--color-text-primary)",
                                  background: "var(--color-bg-muted)",
                                  borderRadius: "0 0 var(--radius-md) var(--radius-md)",
                                }}
                              >
                                {t.notes}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div style={{ marginTop: "var(--spacing-sm)", textAlign: "right", fontSize: "var(--font-size-xs)", color: "var(--color-text-primary)", fontWeight: "var(--font-weight-medium)" }}>
                    Total: {total} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "var(--spacing-md)", borderRadius: "var(--radius-xl)", background: "var(--color-surface-1)", border: "1px solid var(--color-border)", padding: "var(--spacing-sm)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-sm)" }}>
          {chunk.events.map((ev) => (
            <div key={ev.id} style={{ ...styles.card, padding: "var(--spacing-sm)" }}>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                {ev.start}–{ev.end}{ev.sticky ? " • sticky" : ""}
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>{ev.title}</div>
            </div>
          ))}
          {chunk.events.length === 0 && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Double-click card to expand tasks.
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <ChunkQuickMenu
          onClose={() => setMenuOpen(false)}
          onCancel={() => {
            onUpdate({ ...chunk, folder: "Free", subfolder: "Unscheduled", categories: [], events: [] });
            setMenuOpen(false);
          }}
          onReschedule={() => setMenuOpen(false)}
          onChangeFolder={() => {
            setMenuOpen(false);
            setFolderPicker(true);
          }}
          onAddMeeting={addMeeting}
          presets={["Go Fishing", "Family Time"]}
        />
      )}

      <FolderPickerModal open={folderPicker} onClose={() => setFolderPicker(false)} />

      {askContinue && (
        <ContinueAfterModal
          meetingTitle={askContinue.title}
          onContinue={() => setAskContinue(null)}
          onChangeCategory={() => setAskContinue(null)}
          onClose={() => setAskContinue(null)}
        />
      )}
    </div>
  );
}

/* ========= Main Screen ========= */
const INITIAL_CHUNKS: Chunk[] = [
  { id: "am", label: "Morning", start: "08:00", end: "12:00", folder: "Work", subfolder: "Office Tasks", categories: ["Email", "Calls", "Website Development"], events: [] },
  { id: "lunch", label: "Lunch", start: "12:00", end: "13:00", folder: "Home", subfolder: "Family", categories: ["Lunch"], events: [] },
  { id: "pm", label: "Afternoon", start: "13:00", end: "17:00", folder: "Home", subfolder: "Gardening", categories: ["Mow lawn", "Weed", "Fertilize"], events: [] },
  { id: "eve", label: "Evening", start: "18:00", end: "22:30", folder: "Home", subfolder: "Family", categories: ["Dinner"], events: [] },
];

const chunkBandStyle: React.CSSProperties = {
  position: "absolute",
  left: 8,
  right: 8,
  background: "var(--color-surface-1)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  padding: "6px 10px",
  fontSize: "var(--font-size-sm)",
  overflow: "hidden",
  boxSizing: "border-box",
};

/**
 * Time-aligned chunk layer for unified planner. Uses shared blockToPosition and TIMELINE_GRID_HEIGHT.
 * Export for use in UnifiedPlannerLayout pane 2.
 */
export function ChunkPlannerLayer() {
  const [chunks, setChunks] = useState<Chunk[]>(INITIAL_CHUNKS);
  const updateChunk = (id: string, next: Chunk) =>
    setChunks((prev) => prev.map((c) => (c.id === id ? next : c)));

  return (
    <div
      style={{
        position: "relative",
        height: TIMELINE_GRID_HEIGHT,
        minHeight: TIMELINE_GRID_HEIGHT,
        minWidth: 0,
        flex: 1,
      }}
    >
      {chunks.map((chunk) => {
        const pos = blockToPosition({ start: chunk.start, end: chunk.end });
        return (
          <div
            key={chunk.id}
            style={{
              ...chunkBandStyle,
              top: pos.top,
              height: pos.height,
              minHeight: 24,
            }}
            title={`${chunk.label} ${chunk.start}–${chunk.end}`}
          >
            <div style={{ fontWeight: "var(--font-weight-semibold)" }}>{chunk.label}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              {chunk.start}–{chunk.end} · {chunk.folder}
              {chunk.categories.length > 0 && ` · ${chunk.categories.join(", ")}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function JSX_planner_test() {
  const [date, setDate] = useState(() => new Date());
  const [chunks, setChunks] = useState<Chunk[]>(INITIAL_CHUNKS);

  const updateChunk = (id: string, next: Chunk) =>
    setChunks((prev) => prev.map((c) => (c.id === id ? next : c)));

  const prevDay = () => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const nextDay = () => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  const niceDate = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-md)" }}>
          <button type="button" style={styles.btnIcon} onClick={prevDay} aria-label="Previous day">
            ←
          </button>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>WORK DAY</div>
            <div style={{ fontWeight: "var(--font-weight-semibold)" }}>{niceDate}</div>
          </div>
          <button type="button" style={styles.btnIcon} onClick={nextDay} aria-label="Next day">
            →
          </button>
        </div>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>Time-aligned chunks</div>
      </header>

      <main style={{ maxWidth: 896, margin: "0 auto", padding: "var(--spacing-lg)" }}>
        <div
          style={{
            position: "relative",
            height: TIMELINE_GRID_HEIGHT,
            minHeight: TIMELINE_GRID_HEIGHT,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {chunks.map((chunk) => {
            const pos = blockToPosition({ start: chunk.start, end: chunk.end });
            return (
              <div
                key={chunk.id}
                style={{
                  ...chunkBandStyle,
                  top: pos.top,
                  height: pos.height,
                  minHeight: 24,
                }}
                title={`${chunk.label} ${chunk.start}–${chunk.end}`}
              >
                <div style={{ fontWeight: "var(--font-weight-semibold)" }}>{chunk.label}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {chunk.start}–{chunk.end} · {chunk.folder}
                  {chunk.categories.length > 0 && ` · ${chunk.categories.join(", ")}`}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <nav style={{ position: "sticky", bottom: 0, background: "var(--color-surface-1)", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 896, margin: "0 auto", padding: "var(--spacing-md) var(--spacing-lg)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-md)", textAlign: "center" }}>
          <a href="#projects" style={{ padding: "var(--spacing-sm)", borderRadius: "var(--radius-xl)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)", textDecoration: "none" }}>Projects</a>
          <a href="#day" style={{ padding: "var(--spacing-sm)", borderRadius: "var(--radius-xl)", background: "var(--color-bg-muted)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-primary)", textDecoration: "none" }}>Day Planner</a>
          <a href="#tasks" style={{ padding: "var(--spacing-sm)", borderRadius: "var(--radius-xl)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)", textDecoration: "none" }}>Task Manager</a>
        </div>
      </nav>
    </div>
  );
}
