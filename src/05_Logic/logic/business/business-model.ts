/**
 * Business model — UI/API only. No engine logic.
 */

export type DataSourceType = "google" | "csv";

export interface Business {
  id: string;
  name: string;
  dataSourceType: DataSourceType;
  configuration: Record<string, unknown>;
}

export const DEFAULT_BUSINESSES: Business[] = [
  { id: "default", name: "Google Ads", dataSourceType: "google", configuration: {} },
  { id: "csv-placeholder", name: "CSV Upload", dataSourceType: "csv", configuration: {} },
];

const businessList: Business[] = [...DEFAULT_BUSINESSES];

export function getBusinessById(id: string): Business | undefined {
  return businessList.find((b) => b.id === id);
}

export function listBusinesses(): Business[] {
  return [...businessList];
}
