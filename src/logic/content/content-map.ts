import cleanup from "./cleanup.logic.json";
import { EDUCATION_FLOW } from "./education.flow";


export const CONTENT_MAP = {
  "construction-cleanup": cleanup,
  "education-flow": EDUCATION_FLOW,
};


export type ContentKey = keyof typeof CONTENT_MAP;
