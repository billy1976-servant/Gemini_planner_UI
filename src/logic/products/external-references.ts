/**
 * External References - Safe, whitelisted external sources
 * 
 * Features:
 * - Only allow whitelisted domains
 * - Store external references with url, quoted snippet, publication name/date
 * - UI shows disclaimers: "Third-party source; verify details."
 * - No sentiment scoring, no "best" claims
 * 
 * IMPORTANT: This is OPTIONAL and must be explicitly enabled
 */

export type ExternalReference = {
  id: string;
  url: string;
  quotedSnippet: string; // Exact quoted text (no AI rewrite)
  publicationName?: string; // Publication/source name
  publicationDate?: string; // ISO date string
  domain: string; // Extracted domain for validation
  addedAt: string; // ISO timestamp when added
  verified: boolean; // Whether domain is whitelisted
};

export type WhitelistConfig = {
  enabled: boolean; // Must be explicitly enabled
  allowedDomains: string[]; // Whitelisted domains (e.g., ["example.com", "trusted-source.org"])
  requireVerification: boolean; // Whether to require domain verification
};

/**
 * Default whitelist configuration (disabled by default)
 */
export const DEFAULT_WHITELIST: WhitelistConfig = {
  enabled: false, // Disabled by default - must be explicitly enabled
  allowedDomains: [
    // Add trusted domains here when enabled
    // Example: "example.com", "trusted-source.org"
  ],
  requireVerification: true,
};

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, ""); // Remove www. prefix
  } catch {
    return null;
  }
}

/**
 * Check if domain is whitelisted
 */
export function isDomainWhitelisted(
  domain: string,
  config: WhitelistConfig
): boolean {
  if (!config.enabled) {
    return false; // External references disabled
  }

  if (config.allowedDomains.length === 0) {
    return false; // No domains whitelisted
  }

  // Exact match or subdomain match
  return config.allowedDomains.some((allowed) => {
    if (domain === allowed) {
      return true;
    }
    // Allow subdomains (e.g., "blog.example.com" matches "example.com")
    return domain.endsWith(`.${allowed}`);
  });
}

/**
 * Validate external reference
 */
export function validateExternalReference(
  reference: Omit<ExternalReference, "id" | "domain" | "addedAt" | "verified">,
  config: WhitelistConfig
): {
  valid: boolean;
  error?: string;
  domain?: string;
} {
  // Check if external references are enabled
  if (!config.enabled) {
    return {
      valid: false,
      error: "External references are not enabled",
    };
  }

  // Validate URL
  if (!reference.url || !reference.url.startsWith("http")) {
    return {
      valid: false,
      error: "Invalid URL",
    };
  }

  // Extract domain
  const domain = extractDomain(reference.url);
  if (!domain) {
    return {
      valid: false,
      error: "Could not extract domain from URL",
    };
  }

  // Check if domain is whitelisted
  if (!isDomainWhitelisted(domain, config)) {
    return {
      valid: false,
      error: `Domain "${domain}" is not whitelisted`,
      domain,
    };
  }

  // Validate quoted snippet
  if (!reference.quotedSnippet || reference.quotedSnippet.trim().length === 0) {
    return {
      valid: false,
      error: "Quoted snippet is required",
      domain,
    };
  }

  return {
    valid: true,
    domain,
  };
}

/**
 * Create external reference (with validation)
 */
export function createExternalReference(
  reference: Omit<ExternalReference, "id" | "domain" | "addedAt" | "verified">,
  config: WhitelistConfig = DEFAULT_WHITELIST
): ExternalReference | null {
  const validation = validateExternalReference(reference, config);
  
  if (!validation.valid) {
    console.warn("[ExternalReference] Validation failed:", validation.error);
    return null;
  }

  const domain = validation.domain!;

  return {
    id: generateReferenceId(reference.url),
    url: reference.url,
    quotedSnippet: reference.quotedSnippet,
    publicationName: reference.publicationName,
    publicationDate: reference.publicationDate,
    domain,
    addedAt: new Date().toISOString(),
    verified: isDomainWhitelisted(domain, config),
  };
}

/**
 * Generate deterministic ID for external reference
 */
function generateReferenceId(url: string): string {
  // Simple hash function (deterministic)
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ext_${Math.abs(hash).toString(36)}`;
}

/**
 * Get whitelist configuration (can be loaded from config file or env)
 */
export function getWhitelistConfig(): WhitelistConfig {
  // Try to load from config file
  try {
    const { EXTERNAL_REFERENCE_CONFIG } = require("./external-reference-config");
    return EXTERNAL_REFERENCE_CONFIG;
  } catch {
    // Fallback to default (disabled)
    return DEFAULT_WHITELIST;
  }
}

/**
 * Update whitelist configuration
 */
export function updateWhitelistConfig(
  updates: Partial<WhitelistConfig>
): WhitelistConfig {
  return {
    ...DEFAULT_WHITELIST,
    ...updates,
  };
}
