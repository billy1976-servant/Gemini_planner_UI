import { CONTENT_MAP, ContentKey } from "./content-map";


export function resolveContent(key: ContentKey) {
  return structuredClone(CONTENT_MAP[key]);
}
