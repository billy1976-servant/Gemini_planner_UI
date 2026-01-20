// src/layout/index.ts
// ------------------------------------------------------
// Layout Experience Registry
// Plain data only — NO LOGIC
// ------------------------------------------------------


import website from "./presentation/website.profile.json";
import app from "./presentation/app.profile.json";
import learning from "./presentation/learning.profile.json";


/**
 * Layout experience profiles
 * Keys MUST match layoutState.preset values
 */
const layoutProfiles: Record<string, any> = {
  website,
  app,
  learning,
};


export default layoutProfiles;


