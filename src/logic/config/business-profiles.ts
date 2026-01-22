// src/logic/config/business-profiles.ts
// Business profile configurations - same engine, different content

export type BusinessProfile = {
  id: string;
  name: string;
  domain: string;
  signals: {
    [key: string]: {
      label: string;
      severity: "low" | "medium" | "high";
      affects: string[];
    };
  };
  exportSections: {
    immediateView: {
      title: string;
      sections: string[];
    };
    exportView: {
      title: string;
      sections: string[];
    };
  };
  content: {
    labels: Record<string, string>;
    explanations: Record<string, string>;
  };
};

export const BUSINESS_PROFILES: Record<string, BusinessProfile> = {
  "contractor-cleanup": {
    id: "contractor-cleanup",
    name: "Construction Cleanup",
    domain: "construction",
    signals: {
      profit_drain: {
        label: "Profit Drain",
        severity: "high",
        affects: ["timeline", "bid_quality", "profitability"],
      },
      safety_concern: {
        label: "Safety & Trust",
        severity: "high",
        affects: ["client_confidence", "referrals", "liability"],
      },
      appearance_impact: {
        label: "Appearance Impact",
        severity: "medium",
        affects: ["bids", "referrals", "closeouts"],
      },
      cleanup_needed: {
        label: "Cleanup Required",
        severity: "medium",
        affects: ["efficiency", "morale"],
      },
    },
    exportSections: {
      immediateView: {
        title: "Cleanup Impact Summary",
        sections: ["blockers", "opportunities", "signals"],
      },
      exportView: {
        title: "Contractor Cleanup Analysis",
        sections: ["summary", "steps", "actions", "checklist"],
      },
    },
    content: {
      labels: {
        profit_drain: "Daily cleanup time drains profit",
        safety_concern: "Clean sites reduce safety risk",
        appearance_impact: "Appearance influences bids",
      },
      explanations: {
        profit_drain: "Time spent on cleanup reduces billable hours and profit margins.",
        safety_concern: "Messy sites increase safety risks and reduce client trust.",
        appearance_impact: "Professional appearance directly impacts bid success and referrals.",
      },
    },
  },
  // TODO: Add more business profiles
  // "adu-build": { ... },
  // "remodel": { ... },
  // "guitar-marketing": { ... },
};

export function getBusinessProfile(businessId: string): BusinessProfile | null {
  return BUSINESS_PROFILES[businessId] || null;
}

export function resolveBusinessProfile(context: Record<string, any>): BusinessProfile {
  const businessType = context.businessType || context.domain || "contractor-cleanup";
  return getBusinessProfile(businessType) || BUSINESS_PROFILES["contractor-cleanup"];
}
