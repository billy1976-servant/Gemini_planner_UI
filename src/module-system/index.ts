/**
 * Business Module Tree System — public API.
 * Additive layer: trees live outside the compiler; blueprint/content/app.json
 * are generated from trees.
 */

export { getModule, getAllModules, getModuleIds, type ModuleId, type ModuleDef } from "./module-registry";
export { treeToBlueprint, filterTreeBySections } from "./module-tree";
export { treeToContent } from "./module-autofill";
export {
  generateFiles,
  getGeneratedScreenPath,
  GENERATED_APPS_BASE,
  type GenerateOptions,
} from "./generate-app";
export type { SectionTree, TreeNode, TreeNodeKind } from "./tree-types";
export { businessTree, educationTree, governmentTree, personalTree } from "./trees";
