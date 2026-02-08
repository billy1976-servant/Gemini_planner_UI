// scripts/generate-allfiles-dump.ts
import fs from "fs";
import path from "path";


// -----------------------
// Build clean human tree
// -----------------------
function buildTree(dir: string, level: number = 0): string {
  const indent = " ".repeat(level * 4);
  let out = `${indent}${path.basename(dir)}/\n`;
  const items = fs.readdirSync(dir, { withFileTypes: true });


  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      out += buildTree(full, level + 1);
    } else {
      out += `${" ".repeat((level + 1) * 4)}${item.name}\n`;
    }
  }
  return out;
}


// -----------------------
// Collect all files (recursive)
// -----------------------
type CollectedFile = {
  path: string;
  content: string;
};


function collectFiles(dir: string): CollectedFile[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let result: CollectedFile[] = [];


  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      result = result.concat(collectFiles(full));
    } else {
      const rel = full.replace(process.cwd() + path.sep, "");
      const content = fs.readFileSync(full, "utf8");
      result.push({ path: rel, content });
    }
  }
  return result;
}


// -----------------------
// Main
// -----------------------
const SRC_DIR = path.join(process.cwd(), "src");
const MANIFEST_DIR = path.join(process.cwd(), "public", "manifests");
const OUT_FILE = path.join(MANIFEST_DIR, "project-all.txt");


if (!fs.existsSync(MANIFEST_DIR)) {
  fs.mkdirSync(MANIFEST_DIR, { recursive: true });
}


// -----------------------
// Header Metadata
// -----------------------
const allFilesFlat = collectFiles(SRC_DIR);
const allSections = fs
  .readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();


let out = "";
out += "====================================\n";
out += " HI CURV — COMPLETE PROJECT DUMP\n";
out += "====================================\n\n";
out += `Generated: ${new Date().toISOString()}\n`;
out += `Sections: ${allSections.length}\n`;
out += `Total Files: ${allFilesFlat.length}\n\n\n`;


// -----------------------
// 1. GLOBAL TREE
// -----------------------
out += "====================================\n";
out += " GLOBAL PROJECT TREE (/src)\n";
out += "====================================\n\n";
out += buildTree(SRC_DIR);
out += "\n\n";


// -----------------------
// 2. SECTIONS WITH EXPORT BLOCKS
// -----------------------
out += "====================================\n";
out += " PROJECT SECTIONS — EXPLICIT EXPORTS\n";
out += "====================================\n";


for (const section of allSections) {
  const sectionDir = path.join(SRC_DIR, section);
  const files = collectFiles(sectionDir);


  out += "\n\n";
  out += "####################################\n";
  out += ` EXPORT: SRC/${section.toUpperCase()}\n`;
  out += "####################################\n\n";


  out += `Section Path: /src/${section}\n`;
  out += `File Count: ${files.length}\n\n`;


  // Mini tree
  out += `-- TREE: /src/${section}\n\n`;
  out += buildTree(sectionDir, 1);
  out += "\n";


  // Files in this section
  let index = 1;
  for (const file of files) {
    out += "\n------------------------------------\n";
    out += ` FILE ${index} of ${files.length}\n`;
    out += ` PATH: ${file.path}\n`;
    out += "------------------------------------\n\n";
    out += file.content;
    if (!file.content.endsWith("\n")) out += "\n";
    index++;
  }


  out += "\n####################################\n";
  out += ` END EXPORT: SRC/${section.toUpperCase()}\n`;
  out += "####################################\n";
}




// -----------------------
// Write single TXT dump
// -----------------------
fs.writeFileSync(OUT_FILE, out, "utf8");
console.log("✓ project-all.txt generated at public/manifests/project-all.txt");


// -----------------------
// 3. PER-SECTION SINGLE FILE DUMPS
// -----------------------
for (const section of allSections) {
  const sectionDir = path.join(SRC_DIR, section);
  const files = collectFiles(sectionDir);


  let sectionOut = "";
  sectionOut += "====================================\n";
  sectionOut += ` HI CURV — ${section.toUpperCase()} DUMP\n`;
  sectionOut += "====================================\n\n";
  sectionOut += `Generated: ${new Date().toISOString()}\n`;
  sectionOut += `Section: ${section}\n`;
  sectionOut += `Total Files: ${files.length}\n\n\n`;


  // Section tree
  sectionOut += "====================================\n";
  sectionOut += ` TREE: ${section}\n`;
  sectionOut += "====================================\n\n";
  sectionOut += buildTree(sectionDir, 0);
  sectionOut += "\n\n";


  // Files
  let index = 1;
  for (const file of files) {
    sectionOut += "\n------------------------------------\n";
    sectionOut += ` FILE ${index} of ${files.length}: ${file.path}\n`;
    sectionOut += "------------------------------------\n\n";
    sectionOut += file.content;
    if (!file.content.endsWith("\n")) sectionOut += "\n";
    index++;
  }


  const sectionFile = path.join(
    MANIFEST_DIR,
    `${section}.txt`
  );


  fs.writeFileSync(sectionFile, sectionOut, "utf8");
  console.log(`✓ ${section}.txt generated`);
}


