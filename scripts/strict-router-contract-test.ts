import { resolveStrictLowercaseRoute } from "../src/lib/routing/strict-lowercase-router";

function runOk(host: string, route: string, file: string) {
  const res = resolveStrictLowercaseRoute(host, [route, file]);
  console.log("OK", { type: res.type, path: res.path });
}

function runThrows(name: string, fn: () => void) {
  try {
    fn();
    console.log("FAIL_EXPECTED_THROW", name);
  } catch (e: any) {
    console.log("THREW", name, e?.message ?? String(e));
  }
}

runOk("learn.containercreations.com", "landing", "landing-v5");
runOk("christian.hiclarify.com", "prayer", "prayer-app");

runThrows("uppercase_route", () => {
  resolveStrictLowercaseRoute("learn.containercreations.com", ["Landing", "landing-v5"]);
});

runThrows("missing_file", () => {
  resolveStrictLowercaseRoute("learn.containercreations.com", ["landing", "does-not-exist"]);
});

