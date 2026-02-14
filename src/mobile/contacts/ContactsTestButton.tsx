"use client";

import { useState } from "react";
import { useDeviceContacts } from "./useDeviceContacts";

export default function ContactsTestButton() {
  const { supported, fetchContacts, loading, contacts, error } = useDeviceContacts();
  const [pickedCount, setPickedCount] = useState<number | null>(null);

  const handlePick = async () => {
    const list = await fetchContacts(10);
    setPickedCount(list.length);
  };

  if (!supported) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={handlePick}
        disabled={loading}
        style={{
          padding: "6px 12px",
          fontSize: 12,
          border: "1px solid #333",
          borderRadius: 6,
          background: "#fff",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "…" : "Pick Contacts"}
      </button>
      {pickedCount !== null && (
        <span style={{ fontSize: 11, color: "#666" }}>
          {pickedCount} picked
          {contacts[0]?.name ? ` — first: ${contacts[0].name}` : ""}
        </span>
      )}
      {error && <span style={{ fontSize: 11, color: "#c00" }}>{error}</span>}
    </div>
  );
}
