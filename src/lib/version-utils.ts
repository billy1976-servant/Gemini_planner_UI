export function parseVersionFromSegment(segment: string | undefined | null): number | null {
  if (!segment) return null;
  const raw = segment.toString().trim().toLowerCase();
  if (!raw) return null;
  const stripped = raw.replace(/^v(ersion)?/, "");
  const num = parseInt(stripped, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function extractVersionFromFilename(filename: string): number | null {
  if (!filename) return null;
  const base = filename.replace(/\.[^/.]+$/, "");
  const match = base.match(/[-_](\d+)(?:$|[^0-9])/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function normalizeIdentifier(input: string): string {
  return input.toLowerCase().replace(/[_-]/g, "");
}

