"use client";

/**
 * AppShellDirector — stateless resolver layer.
 * Reads state + config; outputs directorProps and experience/profile/archetype.
 * No dispatchState, no navigate, no feature names, no business logic.
 */

import React, { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import {
  getDefaultDirectorProps,
  PRIMITIVE_KEYS,
  type DirectorProps,
} from "./primitive-registry";
import type {
  AppSchema,
  ModeProfileConfig,
  ModeProfilesMap,
  Archetype,
  DirectorContextValue,
} from "./director-types";
import { DirectorContext } from "./DirectorContext";

import modeProfilesJson from "../../config/mode-profiles.json";

const MODE_PROFILES = modeProfilesJson as ModeProfilesMap;

const DEFAULT_PROFILE_NAME = "adult";
const DEFAULT_ARCHETYPE: Archetype = "collection";
const DEFAULT_EXPERIENCE = "website";

/** Flatten a mode profile config into a single partial DirectorProps. */
function flattenProfile(profile: ModeProfileConfig | undefined): Partial<DirectorProps> {
  if (!profile) return {};
  const flat: Partial<DirectorProps> = {};
  const blocks = [
    profile.visualProfile,
    profile.interactionProfile,
    profile.behaviorProfile,
    profile.densityProfile,
    profile.safetyProfile,
  ];
  for (const block of blocks) {
    if (block && typeof block === "object") {
      for (const key of Object.keys(block)) {
        if (PRIMITIVE_KEYS.includes(key as keyof DirectorProps)) {
          (flat as Record<string, unknown>)[key] = (block as Record<string, unknown>)[key];
        }
      }
    }
  }
  return flat;
}

/** Merge defaults + profile overrides + schema primitives (schema wins last). */
function mergeDirectorProps(
  defaults: DirectorProps,
  profileOverrides: Partial<DirectorProps>,
  schemaPrimitives?: Partial<DirectorProps>
): DirectorProps {
  const merged = { ...defaults };
  for (const key of PRIMITIVE_KEYS) {
    if (profileOverrides[key as keyof DirectorProps] !== undefined) {
      merged[key as keyof DirectorProps] = profileOverrides[key as keyof DirectorProps];
    }
    if (schemaPrimitives && schemaPrimitives[key as keyof DirectorProps] !== undefined) {
      merged[key as keyof DirectorProps] = schemaPrimitives[key as keyof DirectorProps];
    }
  }
  return merged;
}

export type AppShellDirectorProps = {
  screenPath: string;
  appSchema?: AppSchema | null;
  children: React.ReactNode;
};

export function AppShellDirector({ screenPath, appSchema, children }: AppShellDirectorProps) {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);

  const value = useMemo((): DirectorContextValue => {
    const values = stateSnapshot?.values ?? {};
    const profileName =
      (typeof values.profileName === "string" && values.profileName) || DEFAULT_PROFILE_NAME;
    const experience =
      (typeof values.experience === "string" && values.experience) ||
      (layoutSnapshot as { experience?: string })?.experience ||
      DEFAULT_EXPERIENCE;
    const archetype: Archetype =
      appSchema?.archetype && typeof appSchema.archetype === "string"
        ? appSchema.archetype
        : DEFAULT_ARCHETYPE;

    const profileConfig = MODE_PROFILES[profileName] ?? MODE_PROFILES[DEFAULT_PROFILE_NAME];
    const profileOverrides = flattenProfile(profileConfig);
    const defaults = getDefaultDirectorProps();
    const schemaPrimitives = appSchema?.primitives ?? appSchema?.defaults;
    const directorProps = mergeDirectorProps(defaults, profileOverrides, schemaPrimitives);

    return {
      directorProps,
      experience,
      profileName,
      archetype,
    };
  }, [stateSnapshot, layoutSnapshot, appSchema]);

  return (
    <DirectorContext.Provider value={value}>
      {children}
    </DirectorContext.Provider>
  );
}

export type { DirectorContextValue } from "./director-types";
