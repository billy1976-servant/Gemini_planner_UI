export const module25X = {
    questions: [
      { key: "hasAds", weight: 10 },
      { key: "monthlySpend", weight: 20 },
    ],
  
  
    calculators: [
      {
        key: "roiLift",
        formula: "state.monthlySpend * 0.15",
      },
    ],
  
  
    flow: {
      rules: [
        { when: "intentScore", min: 20, goto: "showResults" },
      ],
      default: "educate",
    },
  };
  