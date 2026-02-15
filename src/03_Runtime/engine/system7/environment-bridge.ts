/**
 * Environment bridge: aggregates sensor reads for System7 environment channel.
 * When sensors capability is on, universal-engine-adapter can call getEnvironmentPayload()
 * and pass the result into System7. Sensor stubs already return safe shapes when disallowed.
 */

import { readDevice } from "./sensors/device";
import { readLocation } from "./sensors/location";
import { readScreen } from "./sensors/screen";
import { readBattery } from "./sensors/battery";
import { readNetwork } from "./sensors/network";

export type EnvironmentPayload = {
  device: ReturnType<typeof readDevice>;
  location: ReturnType<typeof readLocation>;
  screen: ReturnType<typeof readScreen>;
  battery: ReturnType<typeof readBattery>;
  network: ReturnType<typeof readNetwork>;
};

/**
 * Returns environment payload by aggregating allowed sensor reads.
 * Call from adapter when routing to environment channel and sensors capability is on.
 */
export function getEnvironmentPayload(): EnvironmentPayload {
  return {
    device: readDevice(),
    location: readLocation(),
    screen: readScreen(),
    battery: readBattery(),
    network: readNetwork(),
  };
}
