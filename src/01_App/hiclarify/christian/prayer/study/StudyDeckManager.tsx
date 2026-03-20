"use client";

import React, { useState, useCallback } from "react";
import type { StudyDeck, StudySlide } from "./StudySlide";
import {
  loadAllDecks,
  createDeck,
  addSlide,
  removeSlide,
  reorderSlides,
  loadDeck,
  updateDeck,
  deleteDeck,
} from "./study-deck-store";

export interface StudyDeckManagerProps {
  /** When user selects a deck to use in the room. */
  onSelectDeck?: (deck: StudyDeck | null) => void;
  /** Currently selected deck (e.g. active in room). */
  selectedDeckId?: string | null;
}

export function StudyDeckManager({ onSelectDeck, selectedDeckId }: StudyDeckManagerProps) {
  const [decks, setDecks] = useState<StudyDeck[]>(() => loadAllDecks());
  const [editingDeck, setEditingDeck] = useState<StudyDeck | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [addSlideImageUrl, setAddSlideImageUrl] = useState("");
  const [addSlideTitle, setAddSlideTitle] = useState("");
  const [addSlideNotes, setAddSlideNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [addSlideError, setAddSlideError] = useState<string | null>(null);

  const refreshDecks = useCallback(() => setDecks(loadAllDecks()), []);

  const handleCreateDeck = () => {
    const title = newDeckTitle.trim() || "Untitled deck";
    const deck = createDeck(title);
    setDecks(loadAllDecks());
    setNewDeckTitle("");
    setEditingDeck(deck);
  };

  const handleAddSlide = (deckId: string) => {
    setAddSlideError(null);
    let imageUrl = addSlideImageUrl.trim();
    if (imageFile) {
      try {
        const reader = new FileReader();
        reader.onerror = () => {
          setAddSlideError("Failed to read image");
        };
        reader.onload = () => {
          try {
            const result = reader.result;
            if (typeof result !== "string" || !result.startsWith("data:image")) {
              setAddSlideError("Invalid image file");
              return;
            }
            addSlide(deckId, {
              imageUrl: result,
              title: addSlideTitle.trim() || "Slide",
              notes: addSlideNotes.trim(),
            });
            refreshDecks();
            setEditingDeck(loadDeck(deckId));
            setAddSlideImageUrl("");
            setAddSlideTitle("");
            setAddSlideNotes("");
            setImageFile(null);
          } catch (e) {
            setAddSlideError("Failed to add slide");
          }
        };
        reader.readAsDataURL(imageFile);
      } catch (e) {
        setAddSlideError("Failed to read image");
      }
      return;
    }
    if (!imageUrl) return;
    if (imageUrl.startsWith("data:") && !imageUrl.startsWith("data:image")) {
      setAddSlideError("Invalid image format");
      return;
    }
    try {
      addSlide(deckId, {
        imageUrl,
        title: addSlideTitle.trim() || "Slide",
        notes: addSlideNotes.trim(),
      });
      refreshDecks();
      setEditingDeck(loadDeck(deckId));
      setAddSlideImageUrl("");
      setAddSlideTitle("");
      setAddSlideNotes("");
    } catch (e) {
      setAddSlideError("Failed to add slide (storage may be full)");
    }
  };

  const handleRemoveSlide = (deckId: string, slideId: string) => {
    removeSlide(deckId, slideId);
    refreshDecks();
    const deck = loadDeck(deckId);
    setEditingDeck(deck);
  };

  const handleMoveSlide = (deckId: string, fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    reorderSlides(deckId, fromIndex, toIndex);
    refreshDecks();
    setEditingDeck(loadDeck(deckId));
  };

  const styleSection = {
    padding: "0.5rem 0",
    borderBottom: "1px solid var(--prayer-card-border, rgba(148,163,184,0.2))",
  };
  const styleInput = {
    padding: "0.4rem 0.6rem",
    borderRadius: 8,
    border: "1px solid var(--prayer-card-border)",
    background: "var(--prayer-bg)",
    color: "var(--prayer-text)",
    fontSize: "0.85rem",
    width: "100%" as const,
  };
  const styleBtn = {
    padding: "0.4rem 0.75rem",
    borderRadius: 8,
    border: "1px solid var(--prayer-card-border)",
    background: "var(--prayer-play-bg)",
    color: "#fff",
    cursor: "pointer" as const,
    fontSize: "0.85rem",
  };

  return (
    <div className="study-deck-manager" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="prayer-metrics-label">Study slide decks</div>

      {/* Create new deck */}
      <section style={styleSection}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="New deck title"
            style={styleInput}
          />
          <button type="button" onClick={handleCreateDeck} style={styleBtn}>
            Create deck
          </button>
        </div>
      </section>

      {/* Deck list */}
      <section style={styleSection}>
        {decks.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)", margin: 0 }}>
            No decks yet. Create one above to add slides (images or scripture snapshots).
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {decks.map((deck) => (
              <li
                key={deck.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.35rem 0",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.875rem" }}>
                  {deck.title} ({deck.slides.length} slides)
                </span>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeck(editingDeck?.id === deck.id ? null : loadDeck(deck.id));
                    }}
                    style={{ ...styleBtn, background: "transparent", color: "var(--prayer-text)" }}
                  >
                    {editingDeck?.id === deck.id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDeck?.(selectedDeckId === deck.id ? null : deck)}
                    style={{
                      ...styleBtn,
                      background: selectedDeckId === deck.id ? "var(--prayer-play-bg)" : "transparent",
                      color: selectedDeckId === deck.id ? "#fff" : "var(--prayer-text)",
                    }}
                  >
                    {selectedDeckId === deck.id ? "Active" : "Use in room"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this deck?")) {
                        deleteDeck(deck.id);
                        refreshDecks();
                        if (editingDeck?.id === deck.id) setEditingDeck(null);
                        if (selectedDeckId === deck.id) onSelectDeck?.(null);
                      }
                    }}
                    style={{ ...styleBtn, background: "transparent", color: "#f87171" }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Edit deck: add slide */}
      {editingDeck && (
        <section style={styleSection}>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Add slide to &quot;{editingDeck.title}&quot;
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: "0.8rem" }}
            />
            <input
              type="text"
              value={addSlideImageUrl}
              onChange={(e) => setAddSlideImageUrl(e.target.value)}
              placeholder="Or paste image URL (data URL or http)"
              style={styleInput}
            />
            <input
              type="text"
              value={addSlideTitle}
              onChange={(e) => setAddSlideTitle(e.target.value)}
              placeholder="Slide title"
              style={styleInput}
            />
            <input
              type="text"
              value={addSlideNotes}
              onChange={(e) => setAddSlideNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={styleInput}
            />
            {addSlideError && (
              <p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>{addSlideError}</p>
            )}
            <button
              type="button"
              onClick={() => handleAddSlide(editingDeck.id)}
              disabled={!addSlideImageUrl.trim() && !imageFile}
              style={styleBtn}
            >
              Add slide
            </button>
          </div>

          {/* Slide list with reorder/remove */}
          <div style={{ marginTop: "1rem" }}>
            <div className="prayer-metrics-label" style={{ marginBottom: "0.35rem" }}>
              Slides ({editingDeck.slides.length})
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {editingDeck.slides.map((slide: StudySlide, index: number) => (
                <li
                  key={slide.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0",
                    borderBottom: "1px solid var(--prayer-card-border, rgba(148,163,184,0.1))",
                  }}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4 }}
                  />
                  <span style={{ flex: 1, fontSize: "0.8rem" }}>{slide.title || "Untitled"}</span>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(editingDeck.id, index, "up")}
                    disabled={index === 0}
                    style={{ ...styleBtn, padding: "0.25rem 0.4rem", fontSize: "0.75rem" }}
                  >
                    Γåæ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(editingDeck.id, index, "down")}
                    disabled={index === editingDeck.slides.length - 1}
                    style={{ ...styleBtn, padding: "0.25rem 0.4rem", fontSize: "0.75rem" }}
                  >
                    Γåô
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(editingDeck.id, slide.id)}
                    style={{ ...styleBtn, padding: "0.25rem 0.4rem", background: "transparent", color: "#f87171" }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
