/**
 * Local persistence for study slide decks.
 * Uses localStorage so hosts can build decks before a session.
 * Key: prayer-study-decks
 */

import type { StudyDeck, StudySlide } from "./StudySlide";

const STORAGE_KEY = "prayer-study-decks";

function getDecks(): StudyDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyDeck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDecks(decks: StudyDeck[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // ignore
  }
}

export function createDeck(title: string): StudyDeck {
  const now = new Date().toISOString();
  const deck: StudyDeck = {
    id: crypto.randomUUID(),
    title: title || "Untitled deck",
    slides: [],
    createdAt: now,
    updatedAt: now,
  };
  const decks = getDecks();
  decks.push(deck);
  saveDecks(decks);
  return deck;
}

export function addSlide(deckId: string, slide: Omit<StudySlide, "id" | "createdAt" | "order">): StudySlide | null {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;
  const now = new Date().toISOString();
  const order = deck.slides.length;
  const newSlide: StudySlide = {
    ...slide,
    id: crypto.randomUUID(),
    createdAt: now,
    order,
  };
  deck.slides.push(newSlide);
  deck.updatedAt = now;
  saveDecks(decks);
  return newSlide;
}

export function removeSlide(deckId: string, slideId: string): boolean {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return false;
  const idx = deck.slides.findIndex((s) => s.id === slideId);
  if (idx === -1) return false;
  deck.slides.splice(idx, 1);
  deck.slides.forEach((s, i) => {
    s.order = i;
  });
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return true;
}

export function reorderSlides(deckId: string, fromIndex: number, toIndex: number): boolean {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return false;
  if (fromIndex < 0 || fromIndex >= deck.slides.length || toIndex < 0 || toIndex >= deck.slides.length) return false;
  const [removed] = deck.slides.splice(fromIndex, 1);
  deck.slides.splice(toIndex, 0, removed!);
  deck.slides.forEach((s, i) => {
    s.order = i;
  });
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return true;
}

export function loadDeck(deckId: string): StudyDeck | null {
  const decks = getDecks();
  return decks.find((d) => d.id === deckId) ?? null;
}

export function loadAllDecks(): StudyDeck[] {
  return getDecks();
}

export function updateDeck(deckId: string, updates: Partial<Pick<StudyDeck, "title">>): StudyDeck | null {
  const decks = getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;
  if (updates.title != null) deck.title = updates.title;
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return deck;
}

export function deleteDeck(deckId: string): boolean {
  const decks = getDecks().filter((d) => d.id !== deckId);
  if (decks.length === getDecks().length) return false;
  saveDecks(decks);
  return true;
}
