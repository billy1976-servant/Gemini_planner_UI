// src/lib/layout/index.ts
// Layout experience profiles (single JSON authority: presentation-profiles.json)

import presentationProfiles from "./presentation-profiles.json";

const layoutProfiles: Record<string, any> = presentationProfiles as Record<string, any>;

export default layoutProfiles;


