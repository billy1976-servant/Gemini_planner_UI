// src/ux/index.ts

import ux from "./ux.json";
import modes from "./modes.json";
import driver from "./driver.json";

export const UXConfig = {
  ...ux,
  modes,
  driver
};

