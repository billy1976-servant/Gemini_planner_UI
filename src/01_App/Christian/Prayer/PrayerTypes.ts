/**
 * Shared types for the Prayer Audio Platform.
 * All code lives under Gospel/Prayer — no dependencies on structure engine or resolver.
 */

export interface Group {
  id: string;
  name: string;
  slug: string;
  /** Relative path for logo image (e.g. group-logos/abc.png), served via API */
  logo: string;
  accentColor: string;
  description: string;
  /** User id (e.g. email) who created the group */
  createdBy?: string;
}

export interface Prayer {
  id: string;
  title: string;
  description: string;
  prayerText: string;
  audioUrl: string;
  createdAt: string;
  published: boolean;
  /** Total play events; persisted in store */
  totalListeners?: number;
  /** Shared content type for cross-linking (e.g. teaching, scripture, discussion) */
  contentType?: "prayer" | "teaching" | "scripture" | "discussion";
  /** Group this prayer belongs to; omitted for global prayers */
  groupId?: string;
  /** Organization (tenant) this prayer belongs to */
  organizationId?: string;
  /** User who recorded (e.g. email from session) */
  userId?: string;
  /** Display name for feed */
  userName?: string;
  /** Duration in seconds */
  duration?: number;
  /** Origin of this prayer (e.g. uploaded file vs live room recording) */
  source?: string;
  /** Live room id when source === "live_room" */
  roomId?: string;
  /** Human-readable participant names for live room recordings */
  participants?: string[];
  /** Optional saved study pages attached to a live recording replay. */
  studyPages?: {
    id: string;
    title: string;
    createdAt: string;
    timestampSec?: number;
  }[];
}

export interface PrayerListResponse {
  prayers: Prayer[];
}

export interface PrayerUploadPayload {
  title: string;
  description: string;
  prayerText: string;
  /** FormData will include the file under key "audio" */
}

export function isPrayer(value: unknown): value is Prayer {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.prayerText === "string" &&
    typeof o.audioUrl === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.published === "boolean"
  );
}
