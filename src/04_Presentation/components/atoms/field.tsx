//update later to move STATE into molecules// 

"use client";
import { useState, useRef, useEffect } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";


type FieldAtomProps = {
  params?: any;
  children?: any;
};

const RICHTEXT_TOOLBAR_ACTIONS: Record<string, { cmd: string; arg?: string }> = {
  bold: { cmd: "bold" },
  italic: { cmd: "italic" },
  underline: { cmd: "underline" },
  bullet: { cmd: "insertUnorderedList" },
  number: { cmd: "insertOrderedList" },
  indent: { cmd: "indent" },
};

const FONT_SIZE_OPTIONS = [
  { value: "1", label: "Small" },
  { value: "3", label: "Normal" },
  { value: "5", label: "Large" },
  { value: "h2", label: "Heading" },
] as const;

const RichtextLabels: Record<string, React.ReactNode> = {
  bold: <b>B</b>,
  italic: <i>I</i>,
  underline: <u>U</u>,
  bullet: <>••</>,
  number: <>1.</>,
  indent: <>⇥</>,
};

export default function FieldAtom({ params = {}, children }: FieldAtomProps) {
  const [localValue, setLocalValue] = useState("");
  const editableRef = useRef<HTMLDivElement>(null);

  const value =
    params.value !== undefined ? params.value : localValue;

  const handleChange = (v: string) => {
    window.dispatchEvent(
      new CustomEvent("input-change", {
        detail: {
          value: v,
          fieldKey: params.fieldKey,
        },
      })
    );
    if (params.onChange) {
      params.onChange(v);
    } else {
      setLocalValue(v);
    }
  };

  // Sync controlled value into contentEditable when value prop changes
  useEffect(() => {
    if (params.variant !== "richtext" || !editableRef.current) return;
    const el = editableRef.current;
    if (params.value !== undefined && String(params.value) !== el.innerHTML) {
      el.innerHTML = params.value === "" ? "" : String(params.value);
    }
  }, [params.variant, params.value]);

  const style: React.CSSProperties = {
    background: resolveToken(params.background),
    borderColor: resolveToken(params.borderColor),
    borderWidth: params.borderWidth ?? 1,
    borderStyle: "solid",
    borderRadius: resolveToken(params.radius),
    ...(params.padding != null && { padding: resolveToken(params.padding) }),
  };

  const toolbarItems = Array.isArray(params.toolbar)
    ? params.toolbar
    : ["bold", "italic", "underline", "bullet", "number", "indent"];

  const runToolbarCommand = (key: string) => {
    const action = RICHTEXT_TOOLBAR_ACTIONS[key];
    if (!action || !editableRef.current) return;
    editableRef.current.focus();
    document.execCommand(action.cmd, false, action.arg);
    handleChange(editableRef.current.innerHTML);
  };

  const runFontSize = (value: string) => {
    if (!editableRef.current) return;
    editableRef.current.focus();
    if (value === "h2") {
      document.execCommand("formatBlock", false, "h2");
    } else {
      document.execCommand("fontSize", false, value);
    }
    handleChange(editableRef.current.innerHTML);
  };

  if (params.variant === "richtext") {
    const toolbarLabel = (key: string) =>
      key === "bullet" ? "Bullet list" : key === "number" ? "Number list" : key === "indent" ? "Indent" : key.charAt(0).toUpperCase() + key.slice(1);
    return (
      <div style={style}>
        <style>{`
          .richtext-btn {
            height: 28px;
            min-width: 28px;
            padding: 0 6px;
            font-size: 14px;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--text-default, var(--color-text-primary));
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .richtext-btn:hover {
            background: var(--surface-3, var(--color-bg-muted));
          }
          .richtext-btn.active {
            background: var(--accent-soft, var(--color-bg-muted));
          }
          .richtext-fontsize:hover {
            background-color: var(--surface-3, var(--color-bg-muted));
          }
        `}</style>
        <div
          style={{
            background: "var(--surface-1, var(--color-bg-primary))",
            border: "1px solid var(--border-default, var(--color-border))",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <div
            ref={editableRef}
            contentEditable
            data-placeholder={params.placeholder ?? "Write your thoughts..."}
            suppressContentEditableWarning
            onInput={() => {
              if (editableRef.current) handleChange(editableRef.current.innerHTML);
            }}
            style={{
              minHeight: params.rows ? `${params.rows * 1.5}em` : "6em",
              padding: "var(--spacing-md)",
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              boxSizing: "border-box",
              lineHeight: 1.4,
            }}
          />
          <div
            role="toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              height: "36px",
              boxSizing: "border-box",
              borderTop: "1px solid var(--border-subtle, var(--color-border))",
              background: "var(--surface-2, var(--color-bg-secondary))",
            }}
          >
            {toolbarItems.map((key: string) => {
              const action = RICHTEXT_TOOLBAR_ACTIONS[key];
              if (!action) return null;
              const label = RichtextLabels[key];
              return (
                <button
                  key={key}
                  type="button"
                  className="richtext-btn"
                  onClick={() => runToolbarCommand(key)}
                  onMouseDown={(e) => e.preventDefault()}
                  title={toolbarLabel(key)}
                >
                  {label ?? key}
                </button>
              );
            })}
            <span
              className="richtext-btn"
              style={{ color: "var(--text-default, var(--color-text-primary))", pointerEvents: "none", marginRight: "-4px" }}
              aria-hidden
            >
              A+
            </span>
            <select
              className="richtext-btn richtext-fontsize"
              aria-label="Font size"
              title="Font size"
              onChange={(e) => runFontSize(e.target.value)}
              defaultValue="3"
              style={{
                height: "28px",
                minWidth: "72px",
                padding: "0 8px",
                fontSize: "14px",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                color: "var(--text-default, var(--color-text-primary))",
                border: "none",
                cursor: "pointer",
              }}
            >
              {FONT_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "4px 0",
    boxSizing: "border-box",
    lineHeight: 1.4,
  };

  return (
    <div style={style}>
      {children ?? (
        params.multiline ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={params.rows ?? 4}
            placeholder={params.placeholder}
            style={{ ...inputBaseStyle, minHeight: "0" }}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={params.placeholder}
            style={inputBaseStyle}
          />
        )
      )}
    </div>
  );
}


