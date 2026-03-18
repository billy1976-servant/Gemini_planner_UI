/**
 * Universal Identity — single identity source for the platform.
 * All identity must resolve through this module; no module may create its own user identity.
 */

export * from "./types";
export * from "./user-store";
export * from "./org-store";
// For API routes use: import { requireOrgRole } from "@/lib/universal-identity/auth-helpers"
export { requireAuthenticatedUser, requireOrgMembership } from "./auth-helpers";
export type { AuthResult, OrgMembershipResult } from "./auth-helpers";
