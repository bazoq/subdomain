export const PLAN_PERIODS = ["DAY", "MONTH", "QUARTER", "YEAR"] as const;
export type PlanPeriod = (typeof PLAN_PERIODS)[number];
export const PLAN_PERIOD_LABELS: Record<PlanPeriod, string> = { DAY: "Per day", MONTH: "Per month", QUARTER: "Per quarter (3 months)", YEAR: "Per year" };

export const CLASS_LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"] as const;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
