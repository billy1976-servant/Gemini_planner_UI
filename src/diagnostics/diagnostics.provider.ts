import fs from "fs";
import path from "path";

// Utility
function ok(x) { return x ? "✓" : "✗"; }
function safeImport(label: string, relPath: string) {
  try {
    const full = path.resolve(process.cwd(), "src", relPath);
    const mod = require(full);
    return { ok: true, mod };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export const DiagnosticsProvider = {
  getAll() {
    const results = [];

    // -------------------------------
    // CORE MODULES (corrected paths)
    // -------------------------------

    const registry = safeImport("Registry", "engine/core/registry");
    results.push({
      label: "Registry Loaded",
      status: ok(registry.ok),
      exports: registry.ok ? Object.keys(registry.mod) : null,
    });

    const renderer = safeImport("JsonRenderer", "engine/core/json-renderer");
    results.push({
      label: "JsonRenderer Loaded",
      status: ok(renderer.ok),
      exports: renderer.ok ? Object.keys(renderer.mod) : null,
    });

    const loader = safeImport("ScreenLoader", "engine/core/screen-loader");
    let smoke = false;
    if (loader.ok && loader.mod.loadScreen) {
      try {
        loader.mod.loadScreen("demo");
        smoke = true;
      } catch {}
    }
    results.push({
      label: "ScreenLoader Loaded",
      status: ok(loader.ok),
      smoke: ok(smoke),
      exports: loader.ok ? Object.keys(loader.mod) : null,
    });

    // -------------------------------
    // BEHAVIOR ENGINES
    // -------------------------------

    const behaviorEngines = [
      { label: "Semantics", path: "behavior/semantics/semantic.engine" },
      { label: "Sequences", path: "behavior/sequences/sequence.engine" },
      { label: "Progression", path: "behavior/progression/progression.engine" },
      { label: "Binding", path: "behavior/binding/binding.engine" },
      { label: "Timecore", path: "behavior/timecore/timecore.engine" },
    ];

    for (const item of behaviorEngines) {
      const imp = safeImport(item.label, item.path);
      let smoke = false;

      if (imp.ok) {
        const fn = Object.values(imp.mod).find((x) => typeof x === "function");
        if (fn) {
          try {
            fn({});
            smoke = true;
          } catch {}
        }
      }

      results.push({
        label: `Behavior / ${item.label}`,
        status: ok(imp.ok),
        exports: imp.ok ? Object.keys(imp.mod) : null,
        smoke: ok(smoke),
      });
    }

    // -------------------------------
    // FULL PIPELINE STATUS
    // -------------------------------

    const full =
      registry.ok &&
      renderer.ok &&
      loader.ok &&
      behaviorEngines.every((e) => safeImport(e.label, e.path).ok);

    results.push({
      label: "FULL ENGINE PIPELINE",
      status: ok(full),
    });

    return results;
  },
};

