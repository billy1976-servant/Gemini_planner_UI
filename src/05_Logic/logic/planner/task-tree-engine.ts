/**
 * Task tree engine — build folder/subfolder/category index from StructureTreeNode. Pure; no state.
 */

import type { StructureTreeNode } from "@/logic/engines/structure/structure.types";

export type FolderSubfolderCategory = {
  folderId: string;
  folderName: string;
  subfolderId: string;
  subfolderName: string;
  categoryId: string;
  categoryName: string;
};

/** Top-level folders (direct children of root, e.g. life). */
export function foldersList(tree: StructureTreeNode[]): { id: string; name: string }[] {
  const root = tree.find((n) => n.children?.length);
  if (!root?.children) return tree.map((n) => ({ id: n.id, name: n.name }));
  return root.children.map((c) => ({ id: c.id, name: c.name }));
}

/** Subfolders under each folder (folderId -> { id, name }[]). */
export function subByFolder(tree: StructureTreeNode[]): Record<string, { id: string; name: string }[]> {
  const out: Record<string, { id: string; name: string }[]> = {};
  const root = tree.find((n) => n.children?.length);
  if (!root?.children) return out;
  for (const folder of root.children) {
    const subs = Array.isArray(folder.children)
      ? folder.children.map((c) => ({ id: c.id, name: c.name }))
      : [{ id: folder.id, name: folder.name }];
    out[folder.id] = subs;
  }
  return out;
}

/** Categories under each subfolder (subfolderId -> { id, name }[]). Leaf = category. */
export function catBySub(tree: StructureTreeNode[]): Record<string, { id: string; name: string }[]> {
  const out: Record<string, { id: string; name: string }[]> = {};
  const root = tree.find((n) => n.children?.length);
  if (!root?.children) return out;
  for (const folder of root.children) {
    const subs = folder.children ?? [{ id: folder.id, name: folder.name }];
    for (const sub of subs) {
      const cats = Array.isArray(sub.children)
        ? sub.children.map((c) => ({ id: c.id, name: c.name }))
        : [{ id: sub.id, name: sub.name }];
      out[sub.id] = cats;
    }
  }
  return out;
}

/** Flatten tree to folder → subfolder → category list for matcher/template. */
export function flattenTreeToFSC(tree: StructureTreeNode[]): FolderSubfolderCategory[] {
  const result: FolderSubfolderCategory[] = [];
  const root = tree.find((n) => n.children?.length);
  if (!root?.children) return result;
  for (const folder of root.children) {
    const subs = folder.children ?? [{ id: folder.id, name: folder.name }];
    for (const sub of subs) {
      const cats = sub.children ?? [{ id: sub.id, name: sub.name }];
      for (const cat of cats) {
        result.push({
          folderId: folder.id,
          folderName: folder.name,
          subfolderId: sub.id,
          subfolderName: sub.name,
          categoryId: cat.id,
          categoryName: cat.name,
        });
      }
    }
  }
  return result;
}
