"use client";

import React from "react";

export default function OSBBar() {
  const onFocus = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("osb:open"));
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        display: "flex",
        justifyContent: "center",
        padding: "12px 16px",
        background: "var(--app-bg, #fff)",
      }}
    >
      <input
        type="text"
        placeholder="Search or add..."
        onFocus={onFocus}
        readOnly
        aria-label="Open command bar"
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "14px 20px",
          fontSize: "16px",
          fontWeight: 400,
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "24px",
          outline: "none",
          background: "var(--input-bg, #f5f5f5)",
          color: "var(--color-text, #1a1a1a)",
        }}
      />
    </div>
  );
}
