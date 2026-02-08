# ORGAN_EXPANSION_CONTRACT.generated.md

How organs are expanded into sections: expandOrgansInDocument path, slot mapping, variant selection, organ layout ↔ section layout. Code-derived only.

---

## Entry path (expandOrgansInDocument)

| Step | File | Function / expression |
|------|------|------------------------|
| Page (JSON branch) | src/app/page.tsx | rawChildren = renderNode?.children; children = assignSectionInstanceKeys(rawChildren); docForOrgans = { meta, nodes: children }; expandedDoc = expandOrgansInDocument(docForOrgans, loadOrganVariant, organInternalLayoutOverrides); finalChildren = boundDoc.nodes ?? children; renderNode = { ...renderNode, children: finalChildren } |
| Document shape for page | src/app/page.tsx | docForOrgans has .nodes (array of top-level section/organ nodes). expandOrgansInDocument expects SiteSkinDocument: .nodes and/or .regions (array of { id, role, nodes }) |
| Expand implementation | src/organs/resolve-organs.ts | expandOrgansInDocument(doc, loadOrganVariant, overrides) → expandOrgans(doc.nodes, ...) and if doc.regions, expandOrgans(r.nodes, ...) per region |

---

## Organ node detection and variant selection

| Concept | Implementation | File |
|---------|----------------|------|
| Is organ node | type lowercase trimmed === "organ" | src/organs/resolve-organs.ts isOrganNode() |
| organId | node.organId ?? "" | src/organs/resolve-organs.ts expandOrgans() |
| instanceKey | node.id ?? "" (for overrides) | src/organs/resolve-organs.ts expandOrgans() |
| variantId | overrides[instanceKey] ?? overrides[organId] ?? node.variant ?? "default" | src/organs/resolve-organs.ts expandOrgans() |
| loadOrganVariant | loadOrganVariant(organId, variantId) → variant root node (compound tree) or null | src/organs/organ-registry.ts loadOrganVariant(); VARIANTS[normalizedOrgan][normalizedVariant] ?? VARIANTS[normalizedOrgan]["default"] |

---

## Slot mapping (organ expansion)

No slot mapping inside resolve-organs. Organ node is replaced by the variant tree root; variant JSON is a single compound subtree. Slot resolution is in applySkinBindings (type "slot" + slotKey from data). Organ expansion only: replace node with merged variant; no slot names inside expandOrgans.

---

## Merge order (organ node + variant)

| Source | Merged into | File |
|--------|-------------|------|
| variant (layout, params, content) then node (layout, params, content) | deepMergeTarget(variant, variant.layout, variant.params, variant.content, n.layout, n.params, n.content); merged.id = n.id ?? merged.id | src/organs/resolve-organs.ts expandOrgans() |
| internalLayoutId | merged.params = { ...mergedParams, internalLayoutId: variantId } | src/organs/resolve-organs.ts expandOrgans() |
| Children | merged.children = expandOrgans(merged.children, loadOrganVariant, overrides) (recursive) | src/organs/resolve-organs.ts expandOrgans() |

---

## Organ layout vs section layout

| Layer | File | Behavior |
|-------|------|----------|
| Section layout id | src/engine/core/json-renderer.tsx applyProfileToNode | Section layout id: override (store) → node.layout → template defaultSectionLayoutId. Passed as layout prop to Section compound. |
| Organ internal layout | src/compounds/ui/12-molecules/section.compound.tsx | If role in getOrganLayoutOrganIds(): resolveInternalLayoutId(role, params.internalLayoutId); loadOrganVariant(role, internalLayoutId ?? "default"); organMoleculeLayout = variantParams?.moleculeLayout; effectiveDef = { ...layoutDef, moleculeLayout: organMoleculeLayout ?? layoutDef.moleculeLayout }. Section layout (containerWidth, split, background) from resolveLayout(layout); inner moleculeLayout overridden by organ variant when section is organ. |
| Overrides | src/app/page.tsx | organInternalLayoutOverrides = getOrganInternalLayoutOverridesForScreen(screenKey); passed to expandOrgansInDocument as overrides (instanceKey/organId → variantId). After expand, params.internalLayoutId = variantId so Section compound uses it for resolveInternalLayoutId. |

---

## assignSectionInstanceKeys (before expand)

| File | Behavior |
|------|----------|
| src/organs/resolve-organs.ts | assignSectionInstanceKeys(nodes): each node gets id = node.id ?? `section-${index}`. Returns new array. Used so section/organ override maps (sectionLayoutPresetOverrides, organInternalLayoutOverrides) are keyed by stable instance. |

---

## loadOrganVariant source (organ-registry)

| File | Behavior |
|------|----------|
| src/organs/organ-registry.ts | VARIANTS: Record&lt;organId, Record&lt;variantId, rootNode&gt;&gt;. organId/variantId normalized to lowercase trim. getOrganIds(), getVariantIds(organId), getOrganLabel(organId). Variants imported from src/organs/{header,hero,nav,footer,content-section,features-grid,gallery,testimonials,pricing,faq,cta}/variants/*.json. |

---

## expandOrgansInDocument input/output

| Input | Output |
|-------|--------|
| doc with .nodes and/or .regions | New doc; doc.nodes = expandOrgans(doc.nodes, ...); doc.regions = regions.map(r => ({ ...r, nodes: expandOrgans(r.nodes, ...) })). |
| Node type "organ" | Replaced by merged variant root (or original node if loadOrganVariant returns null). |
| Node not organ | Cloned; children recursively expandOrgans. |
