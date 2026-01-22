/**
 * Fetch HTML - Server-safe fetch with retries
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - User-Agent headers
 * - Timeout handling
 * - Error handling
 */

export type FetchOptions = {
  retries?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  timeout?: number; // Request timeout in ms (default: 10000)
  userAgent?: string; // Custom user agent
  headers?: Record<string, string>; // Additional headers
};

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  retries: 3,
  retryDelay: 1000,
  timeout: 10000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  headers: {},
};

/**
 * Fetch HTML with retries and error handling
 */
export async function fetchHtml(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, opts);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      if (!html || html.length === 0) {
        throw new Error("Empty response");
      }
      
      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on last attempt
      if (attempt < opts.retries) {
        const delay = opts.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `[fetchHtml] Attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms...`,
          lastError.message
        );
        await sleep(delay);
      }
    }
  }
  
  throw new Error(
    `Failed to fetch ${url} after ${opts.retries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: Required<FetchOptions>
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": options.userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${options.timeout}ms`);
    }
    throw error;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
