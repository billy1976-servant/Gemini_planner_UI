// scripts/generate-schema.ts
import fs from "fs";
import path from "path";
import ts from "typescript";


const ATOMS_DIR = path.join(process.cwd(), "src/components/atoms");
const OUT_FILE = path.join(process.cwd(), "src/components/atoms/atom-schema.json");


function extractPropsFromFile(filePath: string) {
  const source = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );


  const props: Record<string, string> = {};


  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.parameters.length > 0 &&
      node.parameters[0].name.getText() === "props"
    ) {
      const typeNode = node.parameters[0].type;


      if (typeNode && ts.isTypeLiteralNode(typeNode)) {
        for (const member of typeNode.members) {
          if (ts.isPropertySignature(member)) {
            const key = member.name.getText();
            const value = member.type?.getText() || "any";
            props[key] = value;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }


  visit(source);
  return props;
}


function generateSchema() {
  const files = fs
    .readdirSync(ATOMS_DIR)
    .filter((f) => f.endsWith(".tsx"));


  const schema: Record<string, any> = {};


  for (const file of files) {
    const atomName = file.replace(".tsx", "");
    const fullPath = path.join(ATOMS_DIR, file);


    // extract actual props
    const extracted = extractPropsFromFile(fullPath);


    // add universal props
    const mergedProps = {
      ...extracted,
      params: "any",
      style: "any",
    };


    // alphabetize props
    const sortedProps = Object.keys(mergedProps)
      .sort()
      .reduce((a, k) => ({ ...a, [k]: mergedProps[k] }), {});


    schema[atomName] = {
      props: sortedProps,
      events: ["onClick", "onChange"],
      children: true,
    };
  }


  // alphabetize atoms
  const sortedAtoms = Object.keys(schema)
    .sort()
    .reduce((a, k) => ({ ...a, [k]: schema[k] }), {});


  fs.writeFileSync(OUT_FILE, JSON.stringify(sortedAtoms, null, 2));
  console.log("✅ Atom schema generated →", OUT_FILE);
}


generateSchema();


