"use client";

import React, { useState } from "react";
import { createGuidedPrayer } from "../api/prayer-api";

const CATEGORIES = [
  "Government",
  "Persecuted Church",
  "Family",
  "Church",
  "Community",
  "Global Missions",
  "General",
];

export function GuidedPrayerCreate() {
  const [title, setTitle] = useState("");
  const [scripture, setScripture] = useState("");
  const [focus, setFocus] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setLoading(true);
    setSuccess(false);
    try {
      await createGuidedPrayer({
        title: title.trim(),
        scripture: scripture.trim() || undefined,
        focus: focus.trim() || undefined,
        category: category || "General",
      });
      setSuccess(true);
      setTitle("");
      setScripture("");
      setFocus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prayer-card" style={{ maxWidth: "420px", marginTop: "1.5rem" }}>
      <h2 className="prayer-title" style={{ marginBottom: "1rem" }}>Create guided prayer</h2>
      <form onSubmit={handleSubmit} className="prayer-upload-form">
        <label htmlFor="guided-title">Title *</label>
        <input
          id="guided-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pray for our nation"
          required
        />
        <label htmlFor="guided-category">Category</label>
        <select
          id="guided-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ marginBottom: "0.75rem" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label htmlFor="guided-scripture">Scripture</label>
        <textarea
          id="guided-scripture"
          value={scripture}
          onChange={(e) => setScripture(e.target.value)}
          placeholder="Bible passage or reference…"
          rows={3}
        />
        <label htmlFor="guided-focus">Focus</label>
        <textarea
          id="guided-focus"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="What to pray for…"
          rows={3}
        />
        {error && <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>}
        {success && <p style={{ color: "#86efac", fontSize: "0.875rem", marginBottom: "0.75rem" }}>Guided prayer created.</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create guided prayer"}
        </button>
      </form>
    </div>
  );
}
