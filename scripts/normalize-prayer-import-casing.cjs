const fs = require("fs");
const path = require("path");

const roots = [
  path.join(process.cwd(), "src", "01_App", "hiclarify", "christian", "prayer"),
  path.join(process.cwd(), "src", "components", "prayer"),
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    const out = src
      .replace(/PrayerTypes/g, "prayertypes")
      .replace(/utils\/formatTime/g, "utils/formattime");
    if (out !== src) fs.writeFileSync(file, out, "utf8");
  }
}
