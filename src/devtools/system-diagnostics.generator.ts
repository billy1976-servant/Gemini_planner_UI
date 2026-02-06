import fs from "fs";
import path from "path";

export function runSystemDiagnostics() {
  const report: string[] = [];
  report.push("# System Diagnostics Report\n");

  report.push("## Screens Found");
  const screensDir = path.join(process.cwd(), "public", "screens");
  if (fs.existsSync(screensDir)) {
    const screens = fs.readdirSync(screensDir);
    screens.forEach((s) => report.push(`- ${s}`));
  } else {
    report.push("- (public/screens not found)");
  }

  report.push("\n## TODO: Add registry, behavior, layout, state scans here");

  const outPath = path.join(
    process.cwd(),
    "src",
    "docs",
    "ARCHITECTURE_AUTOGEN",
    "SYSTEM_DIAGNOSTICS.generated.md"
  );
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, report.join("\n"));
}
