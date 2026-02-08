// src/content/content-map.ts
// Simple, dumb, reliable content lookup
// No engines. No parsing. No magic.


export const CONTENT_MAP: Record<string, string> = {
    "1.1.button.label": "Join",
    "2.1.button.label": "Submit",
  };
  
  
  export function getContent(key: string): string {
    return CONTENT_MAP[key] ?? key;
  }
  
  
  