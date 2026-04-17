/**
 * Generic 01_App learn platform — identity and catalog types (Phase 1).
 * Deck JSON shape for runtime remains the landing `screens[]` contract; this layer only resolves files.
 */

export type DeckVersionKey = string;

export type DeckRef = {
  appKey: string;
  flowKey: string;
  versionKey: DeckVersionKey;
  schemaKey?: string;
};

/** One row in the platform catalog (all flows discovered under src/01_App). */
/** Serializable row for `/landing-2` flow picker (Phase 2.5). */
export type DeckCatalogFlowPick = {
  appKey: string;
  flowKey: string;
  title: string;
};

export type DeckCatalogEntry = {
  deckRef: Pick<DeckRef, "appKey" | "flowKey"> & {
    defaultVersion: DeckVersionKey;
  };
  title: string;
  availableVersions: DeckVersionKey[];
  /** Repo-relative POSIX path from repo root, e.g. `src/01_App/.../learn/<flow>`. */
  flowRootRelPath: string;
  /** Absolute flow folder path on disk (server only). */
  flowRootAbsPath: string;
};

export type DeckResolveMetadata = {
  deckRef: DeckRef;
  flowRootRelPath: string;
  versionFileRelPath: string;
  schemaFileRelPath?: string;
  /** Derived from flow folder name for builder / clients. */
  title: string;
  availableVersions: DeckVersionKey[];
  allowedSchemas?: string[];
};

export type DeckResolveResult =
  | {
      ok: true;
      metadata: DeckResolveMetadata;
      /** Present when `includeBody` is true. */
      deck?: unknown;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };
