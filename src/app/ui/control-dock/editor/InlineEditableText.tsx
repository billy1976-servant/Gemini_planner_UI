"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

export type InlineEditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
};

export default function InlineEditableText({
  value,
  onChange,
  isEditing,
  as: As = "span",
  className,
  style,
  multiline = false,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const startEditing = useCallback(() => {
    if (!isEditing) return;
    setDraft(value);
    setEditing(true);
  }, [isEditing, value]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value);
    }
  }, [draft, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        setDraft(value);
        setEditing(false);
        inputRef.current?.blur();
      }
    },
    [multiline, commit, value]
  );

  if (!isEditing) {
    return (
      <As className={className} style={style}>
        {value || "\u00a0"}
      </As>
    );
  }

  if (editing) {
    const isHeader = As === "h1" || As === "h2" || As === "h3";
    const baseInputStyle: React.CSSProperties = {
      display: "block",
      width: "100%",
      minWidth: 60,
      minHeight: "1.5em",
      lineHeight: 1.4,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      letterSpacing: "normal",
      padding: "2px 4px",
      fontFamily: "inherit",
      border: "1px solid var(--color-accent, #1a73e8)",
      borderRadius: 4,
      outline: "none",
      boxSizing: "border-box",
      ...style,
    };
    if (isHeader) {
      baseInputStyle.fontSize = "inherit";
      baseInputStyle.fontWeight = "inherit";
      baseInputStyle.lineHeight = 1.4;
    }
    const displayValue = draft;
    const placeholder = "Type text...";
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={className}
          style={baseInputStyle}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={className}
        style={baseInputStyle}
      />
    );
  }

  return (
    <As
      className={className}
      style={{
        ...style,
        cursor: "pointer",
        borderBottom: "1px dashed var(--color-text-secondary, #5f6368)",
      }}
      onClick={startEditing}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEditing();
        }
      }}
      aria-label="Click to edit"
    >
      {value || " "}
    </As>
  );
}
