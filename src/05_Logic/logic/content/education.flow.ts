// src/logic/content/education.flow.ts
// Engine-owned education flow content
// All user-facing text, steps, choices, outcomes, and progress semantics are defined here

export type EducationOutcome = {
  signals: string[]; // Semantic signals (e.g., "profit_drain", "safety_concern")
  blockers?: string[]; // Things preventing progress
  opportunities?: string[]; // Things that increase value
  severity?: "low" | "medium" | "high";
  affects?: string[]; // What this impacts (e.g., ["timeline", "bid_quality"])
};

export type EducationChoice = {
  id: string;
  label: string;
  kind: "understand" | "unsure" | "more" | "yes" | "no";
  outcome: EducationOutcome;
};

export type EducationStep = {
  id: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  choices: EducationChoice[]; // Required for all steps
};

export type EducationFlow = {
  id: string;
  title: string;
  steps: EducationStep[];
};

export const EDUCATION_FLOW: EducationFlow = {
  id: "education",
  title: "Why This Matters",
  steps: [
    {
      id: "profit-drain",
      title: "Profit Drain",
      body: "Cleanup time quietly drains profit daily.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
      imageAlt: "Profit loss visualization",
      choices: [
        {
          id: "next",
          label: "Next",
          kind: "understand",
          outcome: {
            signals: ["profit_drain"],
            opportunities: ["profit_drain_understood"],
            severity: "high",
            affects: ["timeline", "bid_quality", "profitability"],
          },
        },
      ],
    },
    {
      id: "safety-trust",
      title: "Safety & Trust",
      body: "Clean sites reduce safety risk and improve trust.",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop",
      imageAlt: "Clean and safe construction site",
      choices: [
        {
          id: "understand",
          label: "I understand",
          kind: "understand",
          outcome: {
            signals: ["safety_concern"],
            opportunities: ["safety_trust_understood"],
            severity: "high",
            affects: ["client_confidence", "referrals", "liability"],
          },
        },
        {
          id: "need_more_info",
          label: "Need more info",
          kind: "more",
          outcome: {
            signals: ["safety_concern"],
            blockers: ["safety_trust_needs_help"],
            severity: "medium",
            affects: ["client_confidence"],
          },
        },
        {
          id: "disagree",
          label: "Not a priority",
          kind: "unsure",
          outcome: {
            signals: ["safety_concern"],
            blockers: ["safety_trust_blocked"],
            severity: "high",
            affects: ["client_confidence", "liability"],
          },
        },
      ],
    },
    {
      id: "appearance-impact",
      title: "Appearance Impact",
      body: "Appearance influences bids, referrals, and closeouts.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop",
      imageAlt: "Professional site appearance",
      choices: [
        {
          id: "next",
          label: "Next",
          kind: "understand",
          outcome: {
            signals: ["appearance_impact"],
            opportunities: ["appearance_impact_understood"],
            severity: "medium",
            affects: ["bids", "referrals", "closeouts"],
          },
        },
      ],
    },
  ],
};
