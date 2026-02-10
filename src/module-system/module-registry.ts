/**
 * Module Registry — Maps module IDs to master trees and default config.
 * Used by the tree generator and content autofill. Trees remain external.
 */

import type { SectionTree } from "./tree-types";
import { businessTree } from "./trees/business.tree";
import { educationTree } from "./trees/education.tree";
import { governmentTree } from "./trees/government.tree";
import { personalTree } from "./trees/personal.tree";

export type ModuleId =
  | "dentist"
  | "contractor"
  | "doctor"
  | "school"
  | "gov"
  | "personal";

export interface ModuleDef {
  id: ModuleId;
  label: string;
  /** Which master tree this module uses. */
  tree: SectionTree;
  /** Section names enabled by default (empty = all). */
  defaultSections: string[];
  /** Placeholders for content templates (e.g. {{businessName}}, {{industry}}). */
  placeholders: Record<string, string>;
}

const registry: Record<ModuleId, ModuleDef> = {
  dentist: {
    id: "dentist",
    label: "Dentist",
    tree: businessTree,
    defaultSections: ["RootSection", "HeroSection", "AboutSection", "ServicesSection", "ContactSection", "BookingSection", "FooterBlock"],
    placeholders: {
      businessName: "Dental Practice",
      industry: "Dental",
      location: "Your City",
    },
  },
  contractor: {
    id: "contractor",
    label: "Contractor",
    tree: businessTree,
    defaultSections: ["RootSection", "HeroSection", "AboutSection", "ServicesSection", "ContactSection", "BookingSection", "FooterBlock"],
    placeholders: {
      businessName: "Contracting Services",
      industry: "Contracting",
      location: "Your City",
    },
  },
  doctor: {
    id: "doctor",
    label: "Doctor",
    tree: businessTree,
    defaultSections: ["RootSection", "HeroSection", "AboutSection", "ServicesSection", "ContactSection", "BookingSection", "FooterBlock"],
    placeholders: {
      businessName: "Medical Practice",
      industry: "Healthcare",
      location: "Your City",
    },
  },
  school: {
    id: "school",
    label: "School",
    tree: educationTree,
    defaultSections: ["RootSection", "WelcomeSection", "CurriculumSection", "ResourcesSection", "ContactSection", "FooterBlock"],
    placeholders: {
      businessName: "School Name",
      industry: "Education",
      location: "Your City",
    },
  },
  gov: {
    id: "gov",
    label: "Government",
    tree: governmentTree,
    defaultSections: ["RootSection", "OverviewSection", "ServicesSection", "FormsSection", "ContactSection", "FooterBlock"],
    placeholders: {
      businessName: "Department Name",
      industry: "Government",
      location: "Your City",
    },
  },
  personal: {
    id: "personal",
    label: "Personal",
    tree: personalTree,
    defaultSections: ["RootSection", "DashboardSection", "EntrySection", "HistorySection", "FooterBlock"],
    placeholders: {
      businessName: "My Journal",
      industry: "Personal",
      location: "",
    },
  },
};

export function getModule(id: ModuleId): ModuleDef {
  const def = registry[id];
  if (!def) throw new Error(`Unknown module: ${id}`);
  return def;
}

export function getAllModules(): ModuleDef[] {
  return Object.values(registry);
}

export function getModuleIds(): ModuleId[] {
  return Object.keys(registry) as ModuleId[];
}
