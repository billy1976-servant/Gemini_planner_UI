export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
