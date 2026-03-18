/**
 * Business list for workspace dropdown.
 * Reads from business-model today; can be replaced with folder/registry source later.
 */

import { listBusinesses, getBusinessById } from "@/logic/business/business-model";
import type { Business } from "@/logic/business/business-model";

export function useBusinesses(): {
  businesses: Business[];
  getBusiness: (id: string) => Business | undefined;
} {
  return {
    businesses: listBusinesses(),
    getBusiness: getBusinessById,
  };
}
