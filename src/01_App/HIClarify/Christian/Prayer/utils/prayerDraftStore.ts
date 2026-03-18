/**
 * Client-side draft/snapshot store for Prayer recordings.
 * Uses IndexedDB so drafts (including blob) persist across reloads.
 * Lets users save a snapshot and return later to re-edit and publish.
 */

const DB_NAME = "prayer-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

export interface PrayerDraft {
  id: string;
  title: string;
  description: string;
  prayerText: string;
  mediaType: "audio" | "video" | "screen";
  createdAt: string;
  /** In-memory only when loading; IndexedDB stores blob by id in separate field */
  blob?: Blob | null;
}

export interface PrayerDraftMeta {
  id: string;
  title: string;
  description: string;
  prayerText: string;
  mediaType: "audio" | "video" | "screen";
  createdAt: string;
  hasBlob: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

function genId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getDraftList(): Promise<PrayerDraftMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result || []) as { id: string; title: string; description: string; prayerText: string; mediaType: string; createdAt: string; blob?: Blob }[];
      resolve(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          prayerText: r.prayerText,
          mediaType: r.mediaType as PrayerDraftMeta["mediaType"],
          createdAt: r.createdAt,
          hasBlob: !!r.blob,
        }))
      );
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getDraft(id: string): Promise<PrayerDraft | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      const row = req.result as (PrayerDraft & { blob?: Blob }) | undefined;
      if (!row) {
        resolve(null);
        return;
      }
      resolve({
        id: row.id,
        title: row.title,
        description: row.description,
        prayerText: row.prayerText,
        mediaType: row.mediaType,
        createdAt: row.createdAt,
        blob: row.blob ?? null,
      });
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveDraft(draft: {
  title: string;
  description: string;
  prayerText: string;
  mediaType: "audio" | "video" | "screen";
  blob?: Blob | null;
  id?: string;
}): Promise<PrayerDraftMeta> {
  const id = draft.id || genId();
  const createdAt = new Date().toISOString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record = {
      id,
      title: draft.title,
      description: draft.description,
      prayerText: draft.prayerText,
      mediaType: draft.mediaType,
      createdAt,
      blob: draft.blob ?? undefined,
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve({
        id,
        title: record.title,
        description: record.description,
        prayerText: record.prayerText,
        mediaType: record.mediaType,
        createdAt: record.createdAt,
        hasBlob: !!record.blob,
      });
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
