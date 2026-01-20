import cleanup from "./cleanup.logic.json";


export const CONTENT_MAP = {
  "construction-cleanup": cleanup
};


export type ContentKey = keyof typeof CONTENT_MAP;
