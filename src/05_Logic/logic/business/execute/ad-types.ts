/**
 * Ad definition types for execute layer.
 * Schema matches JSON in Business_Files/<businessId>/ads/*.json
 * No defaults; validation throws on invalid data.
 */

export type AdDefinitionStatus = "active" | "paused";

export interface AdDefinition {
  id: string;
  campaignId: string;
  variantId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  displayUrl: string;
  callToAction: string;
  onboardingFlowId?: string;
  status: AdDefinitionStatus;
}

const VALID_STATUSES: AdDefinitionStatus[] = ["active", "paused"];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function validateAdDefinition(data: unknown): AdDefinition {
  if (data == null || typeof data !== "object") {
    throw new Error("Ad definition must be an object");
  }
  const o = data as Record<string, unknown>;

  const id = o.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Ad definition must have non-empty string id");
  }

  const campaignId = o.campaignId;
  if (typeof campaignId !== "string" || campaignId.trim() === "") {
    throw new Error("Ad definition must have non-empty string campaignId");
  }

  const variantId = o.variantId;
  if (typeof variantId !== "string" || variantId.trim() === "") {
    throw new Error("Ad definition must have non-empty string variantId");
  }

  const headlines = o.headlines;
  if (!isStringArray(headlines)) {
    throw new Error("Ad definition must have headlines as array of strings");
  }

  const descriptions = o.descriptions;
  if (!isStringArray(descriptions)) {
    throw new Error("Ad definition must have descriptions as array of strings");
  }

  const finalUrl = o.finalUrl;
  if (typeof finalUrl !== "string") {
    throw new Error("Ad definition must have string finalUrl");
  }

  const displayUrl = o.displayUrl;
  if (typeof displayUrl !== "string") {
    throw new Error("Ad definition must have string displayUrl");
  }

  const callToAction = o.callToAction;
  if (typeof callToAction !== "string") {
    throw new Error("Ad definition must have string callToAction");
  }

  const status = o.status;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as AdDefinitionStatus)) {
    throw new Error(`Ad definition status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const onboardingFlowId = o.onboardingFlowId;
  if (onboardingFlowId != null && typeof onboardingFlowId !== "string") {
    throw new Error("Ad definition onboardingFlowId must be string if present");
  }

  return {
    id: id.trim(),
    campaignId: campaignId.trim(),
    variantId: variantId.trim(),
    headlines: [...headlines],
    descriptions: [...descriptions],
    finalUrl: String(finalUrl),
    displayUrl: String(displayUrl),
    callToAction: String(callToAction),
    status: status as AdDefinitionStatus,
    ...(onboardingFlowId != null && String(onboardingFlowId).trim() !== ""
      ? { onboardingFlowId: String(onboardingFlowId).trim() }
      : {}),
  };
}
