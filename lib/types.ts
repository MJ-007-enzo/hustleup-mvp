export type UserRole = "job_seeker" | "job_owner" | "admin";

export type Tier =
  | "beginner"
  | "basic"
  | "premium"
  | "advanced";

export type OwnerPlan =
  | "free"
  | "starter"
  | "growth"
  | "pro"
  | "business";

export type Profile = {
  id: string;
  email: string | null;

  full_name: string;

  role: UserRole;

  tier: Tier;

  owner_plan: OwnerPlan;
  owner_plan_expires_at: string | null;

  occupation: string | null;
  skills: string | null;
  availability: string | null;
  expected_salary: string | null;

  company_name: string | null;

  resume_url: string | null;
  resume_filename: string | null;

  created_at: string;
};

export type Job = {
  id: string;

  owner_id: string;

  title: string;
  company_name: string;
  location: string;

  job_type: string;

  work_schedule: string;

  duration: string | null;

  salary_type: "hour" | "day" | "week" | "month";

  salary_amount: number;

  requirements: string | null;

  is_premium: boolean;

  require_resume: boolean;

  status: "open" | "closed";

  boost_type: string | null;

boost_expires_at: string | null;

urgent_tag: boolean;

urgent_expires_at: string | null;
  created_at: string;
};

export type Application = {
  id: string;

  job_id: string;

  applicant_id: string;

  status: string;

  resume_url: string | null;
  resume_filename: string | null;

  created_at: string;
};

export type WaitlistItem = {
  id: string;

  full_name: string;
  email: string;

  role: "job_seeker" | "job_owner";

  skills: string | null;

  score: number;

  status: "waiting" | "approved" | "rejected";

  created_at: string;
};