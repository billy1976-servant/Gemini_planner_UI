import assert from "assert";
import {
  buildIdMaps,
  normalizeTxtAuthoringRawId,
  parseBlueprint,
  parseContent,
} from "./parse-blueprint-content";

function testNormalize() {
  assert.strictEqual(normalizeTxtAuthoringRawId("1.2.3"), "1.2.3");
  assert.strictEqual(normalizeTxtAuthoringRawId("S1.0"), "1.0");
  assert.strictEqual(normalizeTxtAuthoringRawId("s2.5"), "2.5");
  assert.strictEqual(normalizeTxtAuthoringRawId(""), null);
  assert.strictEqual(normalizeTxtAuthoringRawId("bad"), null);
}

function testBlueprintHierarchyAndBinding() {
  const bp = `
1.0 | Root | Section [title]
  1.1 | Child | Card [body]
    [state.bind: journal.think]
  1.2 | Next | Button [label]
    -> 1.0
`;
  const { nodes, sequenceOrder } = parseBlueprint(bp);
  assert.strictEqual(sequenceOrder, null);
  assert.strictEqual(nodes.length, 3);
  assert.strictEqual(nodes[0].rawId, "1.0");
  assert.strictEqual(nodes[0].indent, 0);
  assert.strictEqual(nodes[1].rawId, "1.1");
  assert.strictEqual(nodes[1].indent, 2);
  assert.deepStrictEqual(nodes[1].state, [{ type: "bind", key: "journal.think" }]);
  assert.strictEqual(nodes[2].target, "1.0");
}

function testBlueprintSPrefixMatchesContent() {
  const bp = `S1.0 | Track | Section [title]
  1.1 | Nav | Stepper [steps]
`;
  const { nodes } = parseBlueprint(bp);
  assert.strictEqual(nodes[0].rawId, "1.0");
  assert.strictEqual(nodes[1].rawId, "1.1");
  const ct = parseContent(`1.0 Track (Section)
- title: "Hello"

1.1 Nav (Stepper)
- steps: "a,b"
`);
  assert.strictEqual(ct["1.0"].title, "Hello");
  assert.strictEqual(ct["1.1"].steps, "a,b");
}

function testLogicLine() {
  const bp = `
1.0 | SaveFoo | Button [label]
  (logic.action: state:journal.add)
`;
  const { nodes } = parseBlueprint(bp);
  assert.deepStrictEqual(nodes[0].logic, [{ type: "action", expr: "state:journal.add" }]);
}

function testIdMaps() {
  const { nodes } = parseBlueprint(`1.0 | My Node | Section [title]`);
  const { idMap, rawByName, targetToRaw } = buildIdMaps(nodes);
  assert.strictEqual(idMap["1.0"], "|MyNode");
  assert.strictEqual(rawByName["My Node"], "1.0");
  assert.strictEqual(targetToRaw["1.0"], "1.0");
}

function main() {
  testNormalize();
  testBlueprintHierarchyAndBinding();
  testBlueprintSPrefixMatchesContent();
  testLogicLine();
  testIdMaps();
  console.log("parse-blueprint-content.test.ts OK");
}

main();
