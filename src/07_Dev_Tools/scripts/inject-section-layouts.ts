/**
 * Script to scan all JSON screen files and inject "layout": "content-stack"
 * for sections missing the layout property.
 * 
 * This ensures deterministic fallback behavior before runtime resolution.
 */

import * as fs from "fs";
import * as path from "path";

interface SectionNode {
  type: string;
  id?: string;
  role?: string;
  layout?: string;
  children?: SectionNode[];
  [key: string]: any;
}

function isSectionNode(node: any): boolean {
  return (
    node &&
    typeof node === "object" &&
    (node.type === "Section" ||
      node.type === "section" ||
      (typeof node.type === "string" && node.type.toLowerCase() === "section"))
  );
}

function injectLayoutForSections(node: any, path: string[] = []): { modified: boolean; count: number } {
  let modified = false;
  let count = 0;

  if (!node || typeof node !== "object") {
    return { modified, count };
  }

  // Check if this is a section node missing layout
  if (isSectionNode(node) && !node.layout) {
    node.layout = "content-stack";
    modified = true;
    count++;
    console.log(
      `  ✓ Injected layout for section at path: ${path.join(".")} (id: ${node.id || "none"}, role: ${node.role || "none"})`
    );
  }

  // Recursively process children
  if (Array.isArray(node.children)) {
    node.children.forEach((child: any, index: number) => {
      const childPath = [...path, `children[${index}]`];
      const result = injectLayoutForSections(child, childPath);
      if (result.modified) {
        modified = true;
      }
      count += result.count;
    });
  }

  // Also check root-level arrays (for screen files with children array at root)
  if (Array.isArray(node) && path.length === 0) {
    node.forEach((item: any, index: number) => {
      const result = injectLayoutForSections(item, [`[${index}]`]);
      if (result.modified) {
        modified = true;
      }
      count += result.count;
    });
  }

  return { modified, count };
}

function processJsonFile(filePath: string): { modified: boolean; count: number } {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    console.log(`\nProcessing: ${filePath}`);
    const result = injectLayoutForSections(data, []);

    if (result.modified) {
      // Write back with 2-space indentation
      const updatedContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, updatedContent + "\n", "utf-8");
      console.log(`  ✓ Updated file (${result.count} section(s) modified)`);
    } else {
      console.log(`  - No changes needed`);
    }

    return result;
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error);
    return { modified: false, count: 0 };
  }
}

function findJsonFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other common ignore directories
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== "dist" &&
        file !== "build"
      ) {
        findJsonFiles(filePath, fileList);
      }
    } else if (file.endsWith(".json")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  const appsJsonDir = path.join(process.cwd(), "src/01_App/apps-json");
  
  if (!fs.existsSync(appsJsonDir)) {
    console.error(`Directory not found: ${appsJsonDir}`);
    process.exit(1);
  }

  console.log("Scanning for JSON screen files...");
  const jsonFiles = findJsonFiles(appsJsonDir);
  console.log(`Found ${jsonFiles.length} JSON file(s)\n`);

  let totalModified = 0;
  let totalCount = 0;
  const modifiedFiles: string[] = [];

  jsonFiles.forEach((filePath) => {
    const result = processJsonFile(filePath);
    if (result.modified) {
      totalModified++;
      totalCount += result.count;
      modifiedFiles.push(filePath);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log(`  Files processed: ${jsonFiles.length}`);
  console.log(`  Files modified: ${totalModified}`);
  console.log(`  Total sections fixed: ${totalCount}`);
  
  if (modifiedFiles.length > 0) {
    console.log("\nModified files:");
    modifiedFiles.forEach((file) => {
      console.log(`  - ${file}`);
    });
  }
  
  console.log("\n✓ Injection complete!");
}

if (require.main === module) {
  main();
}

export { processJsonFile, injectLayoutForSections };
