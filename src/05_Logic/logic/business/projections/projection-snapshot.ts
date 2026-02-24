/**
 * ProjectionSnapshot — stamped projection for later accuracy comparison.
 */

export interface ProjectionSnapshot {
  id: string;
  timestamp: number;
  region?: string;
  hour?: number;
  projectedBudget: number;
  projectedROAS: number;
  projectedCPA: number;
}

export interface ProjectionSnapshotWithMeta extends ProjectionSnapshot {
  createdAt: number;
}
