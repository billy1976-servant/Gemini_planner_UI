/**
 * Types for study slide deck system.
 * Each slide can be an uploaded image, scripture snapshot, or screenshot.
 */

export interface StudySlide {
  id: string;
  /** Data URL or blob URL for the slide image. */
  imageUrl: string;
  title: string;
  notes: string;
  createdAt: string;
  /** Optional order index within deck (0-based). */
  order?: number;
}

export interface StudyDeck {
  id: string;
  title: string;
  slides: StudySlide[];
  createdAt: string;
  updatedAt: string;
}
