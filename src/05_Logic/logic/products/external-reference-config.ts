/**
 * External Reference Configuration
 * 
 * This file allows you to configure whitelisted domains for external references.
 * 
 * IMPORTANT: External references are DISABLED by default.
 * To enable:
 * 1. Set enabled: true
 * 2. Add trusted domains to allowedDomains array
 * 3. Restart the application
 */

import type { WhitelistConfig } from "./external-references";

/**
 * Configure external reference whitelist
 * 
 * Example configuration:
 * 
 * export const EXTERNAL_REFERENCE_CONFIG: WhitelistConfig = {
 *   enabled: true,
 *   allowedDomains: [
 *     "example.com",
 *     "trusted-source.org",
 *     "reviews.example.com", // Subdomains are allowed
 *   ],
 *   requireVerification: true,
 * };
 */

export const EXTERNAL_REFERENCE_CONFIG: WhitelistConfig = {
  enabled: false, // DISABLED by default - set to true to enable
  allowedDomains: [
    // Add trusted domains here when enabled
    // Example:
    // "example.com",
    // "trusted-source.org",
  ],
  requireVerification: true,
};
