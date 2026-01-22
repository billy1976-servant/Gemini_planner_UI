/**
 * Presentation Model - Output contract for all presentation engines
 * Defines how a flow should be presented (ordering, grouping, emphasis)
 * without changing the underlying flow content or logic
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type { PresentationModelContract, PresentationGroupContract } from "@/system/contracts/SystemContract";

// PresentationModel must satisfy PresentationModelContract
export type PresentationModel = PresentationModelContract;

export type PresentationGroup = PresentationGroupContract;
