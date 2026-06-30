export type OwnerPlan =
  | "free"
  | "starter"
  | "growth"
  | "pro"
  | "business";

export function ownerPlanLimits(plan?: OwnerPlan | string | null) {
  switch (plan) {
    case "starter":
      return {
        activeJobs: 2,
        applicantVisibility: 25,
        resumeDownloads: 10,
        boosts: 0,
      };

    case "growth":
      return {
        activeJobs: 7,
        applicantVisibility: 200,
        resumeDownloads: 50,
        boosts: 2,
      };

    case "pro":
      return {
        activeJobs: 20,
        applicantVisibility: 1000,
        resumeDownloads: 200,
        boosts: 5,
      };

    case "business":
      return {
        activeJobs: Number.MAX_SAFE_INTEGER,
        applicantVisibility: Number.MAX_SAFE_INTEGER,
        resumeDownloads: Number.MAX_SAFE_INTEGER,
        boosts: Number.MAX_SAFE_INTEGER,
      };

    default:
      return {
        activeJobs: 1,
        applicantVisibility: 10,
        resumeDownloads: 0,
        boosts: 0,
      };
  }
}