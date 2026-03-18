import fs from "fs";


const manifests = {
  core: "orchestrator/manifests/manifest-core.json",
  ui: "orchestrator/manifests/manifest-ui.json",
  components: "orchestrator/manifests/manifest-components.json",
  screens: "orchestrator/manifests/manifest-screens.json"
};


const out: any = {
  $kind: "hicurv.rosetta-merged",
  mergedAt: new Date().toISOString(),
  manifests: {}
};


for (const key of Object.keys(manifests)) {
  try {
    const file = fs.readFileSync(manifests[key], "utf-8");
    out.manifests[key] = JSON.parse(file);
  } catch (e) {
    out.manifests[key] = { error: "missing" };
  }
}


fs.writeFileSync(
  "public/manifests.json",
  JSON.stringify(out, null, 2)
);


console.log("✔ Merged → public/manifests.json");
