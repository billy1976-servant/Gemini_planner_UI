/** Deck length modes: filter `screens[]` without duplicating JSON decks. */

export type DeckSlideMode = "short" | "long";

export function parseDeckSlideMode(raw: string | null | undefined): DeckSlideMode {
  const t = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (t === "short") return "short";
  return "long";
}

export function screenVisibleInDeckMode(
  screen: { modes?: DeckSlideMode[] },
  activeMode: DeckSlideMode
): boolean {
  const modes = screen.modes;
  if (modes == null || modes.length === 0) return true;
  return modes.includes(activeMode);
}

export function filterScreensByDeckMode<T extends { modes?: DeckSlideMode[] }>(
  screens: T[],
  activeMode: DeckSlideMode
): T[] {
  return screens.filter((s) => screenVisibleInDeckMode(s, activeMode));
}

/** Parse `deckMode` from Next.js `searchParams`. */
export function parseDeckModeFromSearchParams(sp: Record<string, string | string[] | undefined>): DeckSlideMode {
  const raw = sp.deckMode;
  const s =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw) && typeof raw[0] === "string"
        ? raw[0]
        : "";
  return parseDeckSlideMode(s);
}
