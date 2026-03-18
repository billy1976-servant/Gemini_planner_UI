/**
 * In-memory store for projection snapshots (v1).
 * Optional: persist to JSON log file for server restarts.
 */

import type { ProjectionSnapshotWithMeta } from "./projection-snapshot";

const store: ProjectionSnapshotWithMeta[] = [];
const MAX_SNAPSHOTS = 500;

export function appendProjectionSnapshot(snapshot: ProjectionSnapshotWithMeta): void {
  store.push(snapshot);
  if (store.length > MAX_SNAPSHOTS) store.shift();
}

export function getProjectionSnapshots(): ProjectionSnapshotWithMeta[] {
  return [...store];
}

export function getProjectionSnapshotById(id: string): ProjectionSnapshotWithMeta | undefined {
  return store.find((s) => s.id === id);
}

export function clearProjectionSnapshots(): void {
  store.length = 0;
}
