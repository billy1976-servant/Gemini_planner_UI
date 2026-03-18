/**
 * Industry Assumption Library
 * 
 * Contains declared baseline assumptions, NOT inferred data.
 * All assumptions must have:
 * - Source citations (URL + label)
 * - Default ranges (min / max / median)
 * - Editable flags (user-adjustable later)
 * 
 * NO LOGIC HERE. DATA ONLY.
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

export type IndustryModelId = "cleanup" | "skincare" | "instruments" | "education" | "events";

export interface AssumptionVariable {
  id: string;
  label: string;
  description: string;
  unit: string;
  defaultRange: {
    min: number;
    max: number;
    median: number;
  };
  source: {
    url: string;
    label: string;
    snippet?: string;
  };
  editable: boolean; // Can user adjust this?
  researchFactIds?: string[]; // Optional: Reference to research facts
}

export interface IndustryModel {
  id: IndustryModelId;
  name: string;
  description: string;
  variables: Record<string, AssumptionVariable>;
  source: {
    url: string;
    label: string;
  };
}

/**
 * Industry Assumption Library
 * Deterministic baseline assumptions for each industry
 */
export const ASSUMPTION_LIBRARY: Readonly<Record<IndustryModelId, IndustryModel>> = {
  cleanup: {
    id: "cleanup",
    name: "Contractor Cleanup Services",
    description: "Assumptions for construction/contractor cleanup operations",
    variables: {
      avg_time_loss: {
        id: "avg_time_loss",
        label: "Average Daily Time Loss",
        description: "Average time lost per day due to cleanup inefficiencies",
        unit: "hours",
        defaultRange: {
          min: 0.5,
          max: 3.0,
          median: 1.5,
        },
        source: {
          url: "https://example.com/cleanup-research",
          label: "Construction Industry Time Study 2023",
          snippet: "Average cleanup time ranges from 0.5 to 3 hours per day",
        },
        editable: true,
      },
      avg_wage_range: {
        id: "avg_wage_range",
        label: "Average Hourly Wage",
        description: "Average hourly wage for cleanup workers",
        unit: "USD/hour",
        defaultRange: {
          min: 15,
          max: 35,
          median: 25,
        },
        source: {
          url: "https://example.com/wage-data",
          label: "BLS Occupational Employment Statistics",
          snippet: "Median hourly wage for construction cleanup: $25/hour",
        },
        editable: true,
      },
      exposure_frequency: {
        id: "exposure_frequency",
        label: "Daily Exposure Frequency",
        description: "Number of times per day workers are exposed to cleanup tasks",
        unit: "times/day",
        defaultRange: {
          min: 1,
          max: 10,
          median: 5,
        },
        source: {
          url: "https://example.com/exposure-study",
          label: "Construction Site Exposure Analysis",
          snippet: "Workers typically perform cleanup tasks 3-7 times per day",
        },
        editable: true,
      },
      safety_incident_rate: {
        id: "safety_incident_rate",
        label: "Safety Incident Rate",
        description: "Rate of safety incidents related to cleanup inefficiencies",
        unit: "incidents/year",
        defaultRange: {
          min: 0,
          max: 5,
          median: 1,
        },
        source: {
          url: "https://example.com/safety-data",
          label: "OSHA Construction Safety Statistics",
          snippet: "Average 1-2 safety incidents per year related to site cleanup",
        },
        editable: true,
      },
    },
    source: {
      url: "https://example.com/cleanup-industry-model",
      label: "Contractor Cleanup Industry Model v1.0",
    },
  },
  skincare: {
    id: "skincare",
    name: "Skincare Products",
    description: "Assumptions for skincare product evaluation",
    variables: {
      irritation_rate: {
        id: "irritation_rate",
        label: "Product Irritation Rate",
        description: "Percentage of users experiencing irritation",
        unit: "percent",
        defaultRange: {
          min: 0,
          max: 15,
          median: 5,
        },
        source: {
          url: "https://example.com/skincare-research",
          label: "Dermatology Product Safety Study",
          snippet: "Average irritation rate: 3-7% for standard products",
        },
        editable: true,
      },
      application_time: {
        id: "application_time",
        label: "Daily Application Time",
        description: "Time required for daily skincare routine",
        unit: "minutes",
        defaultRange: {
          min: 5,
          max: 30,
          median: 15,
        },
        source: {
          url: "https://example.com/skincare-time",
          label: "Skincare Routine Time Study",
          snippet: "Average daily skincare routine: 10-20 minutes",
        },
        editable: true,
      },
      sensitivity_rate: {
        id: "sensitivity_rate",
        label: "Skin Sensitivity Rate",
        description: "Percentage of population with sensitive skin",
        unit: "percent",
        defaultRange: {
          min: 20,
          max: 50,
          median: 35,
        },
        source: {
          url: "https://example.com/sensitivity-data",
          label: "Dermatology Population Study",
          snippet: "Approximately 35% of population has sensitive skin",
        },
        editable: false,
        researchFactIds: ["health_001", "health_003"], // Skin barrier and long-term exposure
      },
      daily_exposure_frequency: {
        id: "daily_exposure_frequency",
        label: "Daily Exposure Frequency",
        description: "Number of times per day product is used",
        unit: "times/day",
        defaultRange: {
          min: 1,
          max: 10,
          median: 5,
        },
        source: {
          url: "https://example.com/exposure-frequency",
          label: "Daily Usage Patterns Study",
          snippet: "Average daily usage: 3-7 times per day",
        },
        editable: true,
        researchFactIds: ["exposure_001"], // CDC handwashing frequency
      },
      skin_barrier_impact: {
        id: "skin_barrier_impact",
        label: "Skin Barrier Impact",
        description: "Impact on skin barrier function (0 = no impact, 10 = severe disruption)",
        unit: "scale",
        defaultRange: {
          min: 0,
          max: 10,
          median: 3,
        },
        source: {
          url: "https://example.com/barrier-impact",
          label: "Skin Barrier Research",
          snippet: "pH-balanced formulations reduce barrier disruption",
        },
        editable: true,
        researchFactIds: ["health_001", "health_002"], // Barrier disruption and pH balance
      },
      long_term_exposure_accumulation: {
        id: "long_term_exposure_accumulation",
        label: "Long-term Exposure Accumulation (Years)",
        description: "Years of daily exposure before significant impact",
        unit: "years",
        defaultRange: {
          min: 1,
          max: 10,
          median: 5,
        },
        source: {
          url: "https://example.com/long-term-exposure",
          label: "Long-term Exposure Study",
          snippet: "5+ years of daily exposure increases risk",
        },
        editable: true,
        researchFactIds: ["health_003"], // Long-term exposure research
      },
    },
    source: {
      url: "https://example.com/skincare-industry-model",
      label: "Skincare Industry Model v1.0",
    },
  },
  instruments: {
    id: "instruments",
    name: "Musical Instruments",
    description: "Assumptions for musical instrument evaluation",
    variables: {
      practice_frequency: {
        id: "practice_frequency",
        label: "Weekly Practice Frequency",
        description: "Average number of practice sessions per week",
        unit: "sessions/week",
        defaultRange: {
          min: 1,
          max: 7,
          median: 4,
        },
        source: {
          url: "https://example.com/music-research",
          label: "Musician Practice Habits Study",
          snippet: "Average musician practices 3-5 times per week",
        },
        editable: true,
      },
      instrument_lifespan: {
        id: "instrument_lifespan",
        label: "Average Instrument Lifespan",
        description: "Expected lifespan of instrument with proper care",
        unit: "years",
        defaultRange: {
          min: 5,
          max: 50,
          median: 20,
        },
        source: {
          url: "https://example.com/instrument-lifespan",
          label: "Musical Instrument Longevity Study",
          snippet: "Quality instruments last 15-25 years with proper maintenance",
        },
        editable: false,
      },
      maintenance_cost: {
        id: "maintenance_cost",
        label: "Annual Maintenance Cost",
        description: "Average annual cost of instrument maintenance",
        unit: "USD/year",
        defaultRange: {
          min: 50,
          max: 500,
          median: 200,
        },
        source: {
          url: "https://example.com/maintenance-costs",
          label: "Instrument Maintenance Cost Survey",
          snippet: "Average annual maintenance: $150-250",
        },
        editable: true,
        researchFactIds: ["longevity_001"], // Maintenance extends lifespan
      },
      wood_aging_resonance: {
        id: "wood_aging_resonance",
        label: "Wood Aging and Resonance Stability",
        description: "Years for wood to develop improved resonance characteristics",
        unit: "years",
        defaultRange: {
          min: 5,
          max: 15,
          median: 10,
        },
        source: {
          url: "https://example.com/wood-aging",
          label: "Wood Resonance Research",
          snippet: "Aged wood (10+ years) develops improved resonance",
        },
        editable: false,
        researchFactIds: ["materials_001", "materials_004"], // Solid wood and aged wood
      },
      hardware_durability: {
        id: "hardware_durability",
        label: "Hardware Durability",
        description: "Expected lifespan of hardware components",
        unit: "years",
        defaultRange: {
          min: 15,
          max: 25,
          median: 20,
        },
        source: {
          url: "https://example.com/hardware-durability",
          label: "Hardware Durability Study",
          snippet: "High-quality hardware maintains functionality for 20+ years",
        },
        editable: false,
        researchFactIds: ["materials_002"], // Hardware durability research
      },
      finish_longevity: {
        id: "finish_longevity",
        label: "Finish Longevity",
        description: "Years before finish aging affects appearance",
        unit: "years",
        defaultRange: {
          min: 10,
          max: 15,
          median: 12.5,
        },
        source: {
          url: "https://example.com/finish-aging",
          label: "Finish Aging Research",
          snippet: "Nitrocellulose finishes age over 10-15 years",
        },
        editable: false,
        researchFactIds: ["materials_003"], // Finish aging research
      },
      maintenance_frequency: {
        id: "maintenance_frequency",
        label: "Maintenance Frequency",
        description: "Recommended maintenance frequency to extend lifespan",
        unit: "times/year",
        defaultRange: {
          min: 1,
          max: 2,
          median: 1,
        },
        source: {
          url: "https://example.com/maintenance-frequency",
          label: "Maintenance Guidelines",
          snippet: "Annual maintenance extends lifespan by 30-50%",
        },
        editable: true,
        researchFactIds: ["longevity_001"], // Maintenance impact research
      },
    },
    source: {
      url: "https://example.com/instruments-industry-model",
      label: "Musical Instruments Industry Model v1.0",
    },
  },
  education: {
    id: "education",
    name: "Educational Services",
    description: "Assumptions for educational service evaluation",
    variables: {
      study_time_per_week: {
        id: "study_time_per_week",
        label: "Weekly Study Time",
        description: "Average hours per week spent studying",
        unit: "hours/week",
        defaultRange: {
          min: 5,
          max: 20,
          median: 10,
        },
        source: {
          url: "https://example.com/education-research",
          label: "Student Study Habits Survey",
          snippet: "Average student studies 8-12 hours per week",
        },
        editable: true,
      },
      completion_rate: {
        id: "completion_rate",
        label: "Course Completion Rate",
        description: "Percentage of students who complete courses",
        unit: "percent",
        defaultRange: {
          min: 40,
          max: 90,
          median: 65,
        },
        source: {
          url: "https://example.com/completion-data",
          label: "Online Education Completion Study",
          snippet: "Average completion rate: 60-70%",
        },
        editable: false,
      },
    },
    source: {
      url: "https://example.com/education-industry-model",
      label: "Education Industry Model v1.0",
    },
  },
  events: {
    id: "events",
    name: "Event Planning",
    description: "Assumptions for event planning services",
    variables: {
      planning_hours: {
        id: "planning_hours",
        label: "Average Planning Hours",
        description: "Hours required to plan a typical event",
        unit: "hours",
        defaultRange: {
          min: 10,
          max: 100,
          median: 40,
        },
        source: {
          url: "https://example.com/event-research",
          label: "Event Planning Time Study",
          snippet: "Average event planning: 30-50 hours",
        },
        editable: true,
      },
      stress_level: {
        id: "stress_level",
        label: "Event Planning Stress Level",
        description: "Subjective stress level (1-10 scale)",
        unit: "scale",
        defaultRange: {
          min: 3,
          max: 9,
          median: 6,
        },
        source: {
          url: "https://example.com/stress-study",
          label: "Event Planning Stress Survey",
          snippet: "Average stress level: 5-7 on 10-point scale",
        },
        editable: true,
      },
    },
    source: {
      url: "https://example.com/events-industry-model",
      label: "Event Planning Industry Model v1.0",
    },
  },
} as const;

/**
 * Get an industry model by ID
 */
export function getIndustryModel(id: IndustryModelId): IndustryModel {
  return ASSUMPTION_LIBRARY[id];
}

/**
 * Get all industry models
 */
export function getAllIndustryModels(): IndustryModel[] {
  return Object.values(ASSUMPTION_LIBRARY);
}

/**
 * Get a variable from an industry model
 */
export function getAssumptionVariable(
  industryId: IndustryModelId,
  variableId: string
): AssumptionVariable | null {
  const model = ASSUMPTION_LIBRARY[industryId];
  return model?.variables[variableId] || null;
}
