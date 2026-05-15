"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UserRole = "seeker" | "owner" | "admin" | string;

type Profile = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  role?: UserRole | null;
  is_verified?: boolean | null;
  verified?: boolean | null;
  city?: string | null;
  location?: string | null;
  skills?: string | null;
  availability?: string | null;
  expected_salary?: string | null;
  salary_expectation?: string | null;
  profile_score?: number | null;
  completion_score?: number | null;
  created_at?: string | null;
};

type Job = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  title?: string | null;
  company?: string | null;
  company_name?: string | null;
  description?: string | null;
  requirements?: string | null;
  category?: string | null;
  job_type?: string | null;
  type?: string | null;
  location?: string | null;
  city?: string | null;
  salary?: string | number | null;
  salary_text?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  timing?: string | null;
  availability?: string | null;
  is_premium?: boolean | null;
  premium?: boolean | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

type Application = {
  id: string;
  job_id: string;
  seeker_id?: string | null;
  user_id?: string | null;
  owner_id?: string | null;
  status?: string | null;
  message?: string | null;
  created_at?: string | null;
};

type ApplicationWithData = Application & {
  job?: Job | null;
  seeker?: Profile | null;
};

const STATUS_OPTIONS = ["applied", "shortlisted", "rejected", "hired"];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getDisplayName(profile?: Profile | null) {
  return profile?.full_name || profile?.name || "Unknown user";
}

function getProfileLocation(profile?: Profile | null) {
  return profile?.city || profile?.location || "Location not mentioned";
}

function getProfileSalary(profile?: Profile | null) {
  return (
    profile?.expected_salary ||
    profile?.salary_expectation ||
    "Salary expectation not mentioned"
  );
}

function getProfileScore(profile?: Profile | null) {
  if (typeof profile?.profile_score === "number") return profile.profile_score;
  if (typeof profile?.completion_score === "number") return profile.completion_score;
  return null;
}

function getJobOwnerId(job?: Job | null) {
  return job?.owner_id || job?.user_id || "";
}

function getJobCompany(job?: Job | null) {
  return job?.company || job?.company_name || "Company not mentioned";
}

function getJobLocation(job?: Job | null) {
  return job?.location || job?.city || "Location not mentioned";
}

function getJobType(job?: Job | null) {
  return job?.job_type || job?.type || "Job type not mentioned";
}

function getJobSalaryText(job?: Job | null) {
  if (!job) return "Salary not mentioned";

  if (job.salary_text) return job.salary_text;

  if (typeof job.salary === "string" && job.salary.trim()) {
    return job.salary;
  }

  if (typeof job.salary === "number") {
    return `₹${job.salary.toLocaleString("en-IN")}`;
  }

  const min = typeof job.salary_min === "number" ? job.salary_min : null;
  const max = typeof job.salary_max === "number" ? job.salary_max : null;

  if (min !== null && max !== null) {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  }

  if (min !== null) {
    return `From ₹${min.toLocaleString("en-IN")}`;
  }

  if (max !== null) {
    return `Up to ₹${max.toLocaleString("en-IN")}`;
  }

  return "Salary not mentioned";
}

function isPremiumJob(job?: Job | null) {
  return Boolean(job?.is_premium || job?.premium);
}

function isVerifiedProfile(profile?: Profile | null) {
  return Boolean(profile?.is_verified || profile?.verified);
}

function formatDate(date?: string | null) {
  if (!date) return "Recently";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "Recently";
  }
}

function statusLabel(status?: string | null) {
  const safeStatus = normalize(status || "applied");

  if (safeStatus === "shortlisted") return "Shortlisted";
  if (safeStatus === "rejected") return "Rejected";
  if (safeStatus === "hired") return "Hired";

  return "Applied";
}

function statusClass(status?: string | null) {
  const safeStatus = normalize(status || "applied");

  if (safeStatus === "shortlisted") {
    return "bg-blue-100 text-blue-700";
  }

  if (safeStatus === "rejected") {
    return "bg-red-100 text-red-700";
  }

  if (safeStatus === "hired") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-orange-100 text-[#E8500A]";
}

export default function ApplicationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<ApplicationWithData[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithData | null>(null);

  const role = profile?.role || "seeker";
  const isAdmin = role === "admin";
  const isOwner = role === "owner" || role === "admin";
  const isSeeker = !isOwner;

  useEffect(() => {
    loadPageData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPageData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadPageData() {
    setLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setApplications([]);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      const currentProfile = profileData as Profile | null;
      setProfile(currentProfile);

      const currentRole = currentProfile?.role || "seeker";

      if (currentRole === "owner") {
        await loadOwnerApplications(currentUser.id, false);
      } else if (currentRole === "admin") {
        await loadOwnerApplications(currentUser.id, true);
      } else {
        await loadSeekerApplications(currentUser.id);
      }
    } catch (error) {
      console.error("Applications page load error:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSeekerApplications(currentUserId: string) {
    const { data: applicationData, error: applicationError } = await supabase
      .from("applications")
      .select("*")
      .or(`seeker_id.eq.${currentUserId},user_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (applicationError) {
      console.error("Seeker applications load error:", applicationError);
      setApplications([]);
      return;
    }

    const rawApplications = (applicationData as Application[]) || [];

    const jobIds = Array.from(
      new Set(rawApplications.map((application) => application.job_id).filter(Boolean))
    );

    let jobsById: Record<string, Job> = {};

    if (jobIds.length > 0) {
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .in("id", jobIds);

      if (jobsError) {
        console.error("Jobs for seeker applications load error:", jobsError);
      } else {
        jobsById = ((jobsData as Job[]) || []).reduce<Record<string, Job>>((acc, job) => {
          acc[job.id] = job;
          return acc;
        }, {});
      }
    }

    const hydratedApplications: ApplicationWithData[] = rawApplications.map(
      (application) => ({
        ...application,
        job: jobsById[application.job_id] || null,
        seeker: null,
      })
    );

    setApplications(hydratedApplications);
  }

  async function loadOwnerApplications(currentUserId: string, adminMode: boolean) {
    let jobsQuery = supabase.from("jobs").select("*");

    if (!adminMode) {
      jobsQuery = jobsQuery.or(`owner_id.eq.${currentUserId},user_id.eq.${currentUserId}`);
    }

    const { data: jobsData, error: jobsError } = await jobsQuery.order("created_at", {
      ascending: false,
    });

    if (jobsError) {
      console.error("Owner jobs load error:", jobsError);
      setApplications([]);
      return;
    }

    const ownerJobs = (jobsData as Job[]) || [];
    const jobIds = ownerJobs.map((job) => job.id);

    if (jobIds.length === 0) {
      setApplications([]);
      return;
    }

    const { data: applicationData, error: applicationError } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (applicationError) {
      console.error("Owner applications load error:", applicationError);
      setApplications([]);
      return;
    }

    const rawApplications = (applicationData as Application[]) || [];

    const seekerIds = Array.from(
      new Set(
        rawApplications
          .map((application) => application.seeker_id || application.user_id)
          .filter(Boolean) as string[]
      )
    );

    let profilesById: Record<string, Profile> = {};

    if (seekerIds.length > 0) {
      const { data: seekerData, error: seekerError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", seekerIds);

      if (seekerError) {
        console.error("Seekers load error:", seekerError);
      } else {
        profilesById = ((seekerData as Profile[]) || []).reduce<Record<string, Profile>>(
          (acc, seeker) => {
            acc[seeker.id] = seeker;
            return acc;
          },
          {}
        );
      }
    }

    const jobsById = ownerJobs.reduce<Record<string, Job>>((acc, job) => {
      acc[job.id] = job;
      return acc;
    }, {});

    const hydratedApplications: ApplicationWithData[] = rawApplications.map(
      (application) => {
        const seekerId = application.seeker_id || application.user_id || "";

        return {
          ...application,
          job: jobsById[application.job_id] || null,
          seeker: profilesById[seekerId] || null,
        };
      }
    );

    setApplications(hydratedApplications);
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const q = normalize(search);

      const job = application.job;
      const seeker = application.seeker;

      const searchableText = [
        job?.title,
        getJobCompany(job),
        getJobLocation(job),
        job?.category,
        getJobType(job),
        getDisplayName(seeker),
        seeker?.email,
        seeker?.skills,
        getProfileLocation(seeker),
        application.status,
      ]
        .map(normalize)
        .join(" ");

      const searchMatch = !q || searchableText.includes(q);

      const statusMatch =
        statusFilter === "all" ||
        normalize(application.status || "applied") === normalize(statusFilter);

      return searchMatch && statusMatch;
    });
  }, [applications, search, statusFilter]);

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter(
      (application) => normalize(application.status || "applied") === "applied"
    ).length;
    const shortlisted = applications.filter(
      (application) => normalize(application.status) === "shortlisted"
    ).length;
    const hired = applications.filter(
      (application) => normalize(application.status) === "hired"
    ).length;
    const rejected = applications.filter(
      (application) => normalize(application.status) === "rejected"
    ).length;

    return {
      total,
      applied,
      shortlisted,
      hired,
      rejected,
    };
  }, [applications]);

  async function updateApplicationStatus(application: ApplicationWithData, status: string) {
    setActionLoadingId(application.id);

    try {
      const { data, error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", application.id)
        .select()
        .single();

      if (error) {
        console.error("Application status update error:", error);
        alert(error.message || "Failed to update application status.");
        return;
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id
            ? {
                ...item,
                ...(data as Application),
              }
            : item
        )
      );

      setSelectedApplication((prev) =>
        prev && prev.id === application.id
          ? {
              ...prev,
              ...(data as Application),
            }
          : prev
      );
    } catch (error) {
      console.error("Application status update error:", error);
      alert("Something went wrong while updating the application.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteApplication(application: ApplicationWithData) {
    const confirmed = window.confirm("Are you sure you want to delete this application?");
    if (!confirmed) return;

    setActionLoadingId(application.id);

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", application.id);

      if (error) {
        console.error("Application delete error:", error);
        alert(error.message || "Failed to delete application.");
        return;
      }

      setApplications((prev) => prev.filter((item) => item.id !== application.id));
      setSelectedApplication(null);
    } catch (error) {
      console.error("Application delete error:", error);
      alert("Something went wrong while deleting the application.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#151515] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#E8500A]">
              Login required
            </p>
            <h1 className="mt-3 text-3xl font-black">Please login first</h1>
            <p className="mt-3 text-sm leading-6 text-black/60">
              You need to login to view your applications and manage job applicants.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-6 text-[#151515] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#151515] via-[#231A14] to-[#E8500A] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-orange-100">
                HustleUp Applications
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                {isOwner ? "Manage applicants" : "Track your applications"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">
                {isOwner
                  ? "Review students who applied to your jobs, shortlist strong candidates, reject weak fits, or mark hired applicants."
                  : "See the jobs you applied for and track whether you are applied, shortlisted, rejected, or hired."}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-orange-50">Total applications</p>
              <p className="text-3xl font-black">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">
              Total
            </p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">
              Applied
            </p>
            <p className="mt-2 text-3xl font-black text-[#E8500A]">{stats.applied}</p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">
              Shortlisted
            </p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {stats.shortlisted}
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">
              Hired
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{stats.hired}</p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-black/40">
              Rejected
            </p>
            <p className="mt-2 text-3xl font-black text-red-600">{stats.rejected}</p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isOwner
                  ? "Search applicant, job, city, skill..."
                  : "Search job, company, city, status..."
              }
              className="w-full rounded-2xl border border-black/10 bg-[#FAF9F6] px-4 py-3 text-sm outline-none transition focus:border-[#E8500A] focus:ring-4 focus:ring-[#E8500A]/10"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#FAF9F6] px-4 py-3 text-sm outline-none transition focus:border-[#E8500A] focus:ring-4 focus:ring-[#E8500A]/10"
            >
              <option value="all">All status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="rounded-2xl bg-[#151515] px-6 py-3 text-sm font-black text-white transition hover:bg-[#E8500A]"
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-3xl border border-black/10 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black">No applications found</h2>
            <p className="mt-2 text-sm text-black/60">
              {applications.length === 0
                ? isOwner
                  ? "No one has applied to your jobs yet."
                  : "You have not applied to any jobs yet."
                : "Try changing the search or status filter."}
            </p>
            {applications.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-full bg-[#E8500A] px-6 py-3 text-sm font-black text-white transition hover:bg-[#151515]"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredApplications.map((application) => {
              const job = application.job;
              const seeker = application.seeker;
              const busy = actionLoadingId === application.id;

              return (
                <article
                  key={application.id}
                  className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            application.status
                          )}`}
                        >
                          {statusLabel(application.status)}
                        </span>

                        {isPremiumJob(job) && (
                          <span className="rounded-full bg-[#E8500A] px-3 py-1 text-xs font-black text-white">
                            Premium Job
                          </span>
                        )}

                        {isOwner && isVerifiedProfile(seeker) && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                            Verified Applicant
                          </span>
                        )}
                      </div>

                      <h2 className="line-clamp-2 text-xl font-black leading-tight">
                        {job?.title || "Deleted / unavailable job"}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-black/60">
                        {isOwner
                          ? `Applicant: ${getDisplayName(seeker)}`
                          : getJobCompany(job)}
                      </p>
                    </div>

                    <p className="shrink-0 text-right text-xs font-bold text-black/40">
                      {formatDate(application.created_at)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#FAF9F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                        Job location
                      </p>
                      <p className="mt-1 font-black">{getJobLocation(job)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#FAF9F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                        Salary
                      </p>
                      <p className="mt-1 font-black">{getJobSalaryText(job)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#FAF9F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                        Type
                      </p>
                      <p className="mt-1 font-black">{getJobType(job)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#FAF9F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                        Category
                      </p>
                      <p className="mt-1 font-black">{job?.category || "Not mentioned"}</p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="mt-4 rounded-2xl bg-[#FAF9F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                        Applicant details
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-black/70">
                        <p>
                          <span className="font-black text-black">Email:</span>{" "}
                          {seeker?.email || "Not available"}
                        </p>
                        <p>
                          <span className="font-black text-black">City:</span>{" "}
                          {getProfileLocation(seeker)}
                        </p>
                        <p>
                          <span className="font-black text-black">Skills:</span>{" "}
                          {seeker?.skills || "Not mentioned"}
                        </p>
                        <p>
                          <span className="font-black text-black">Expected salary:</span>{" "}
                          {getProfileSalary(seeker)}
                        </p>
                      </div>
                    </div>
                  )}

                  {isSeeker && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-black/60">
                      {job?.description || "No job description available."}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="flex-1 rounded-2xl border border-black/10 px-4 py-3 text-sm font-black transition hover:border-[#E8500A] hover:text-[#E8500A]"
                    >
                      View Details
                    </button>

                    {isOwner && (
                      <select
                        value={application.status || "applied"}
                        disabled={busy}
                        onChange={(event) =>
                          updateApplicationStatus(application, event.target.value)
                        }
                        className="flex-1 rounded-2xl border border-black/10 bg-[#151515] px-4 py-3 text-sm font-black text-white outline-none transition hover:bg-[#E8500A] disabled:cursor-wait disabled:opacity-70"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    )}

                    {(isAdmin || isSeeker) && (
                      <button
                        onClick={() => deleteApplication(application)}
                        disabled={busy}
                        className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                      >
                        {busy ? "Deleting..." : isSeeker ? "Withdraw" : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                      selectedApplication.status
                    )}`}
                  >
                    {statusLabel(selectedApplication.status)}
                  </span>

                  {isPremiumJob(selectedApplication.job) && (
                    <span className="rounded-full bg-[#E8500A] px-3 py-1 text-xs font-black text-white">
                      Premium Job
                    </span>
                  )}

                  {isOwner && isVerifiedProfile(selectedApplication.seeker) && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      Verified Applicant
                    </span>
                  )}
                </div>

                <h2 className="text-3xl font-black leading-tight">
                  {selectedApplication.job?.title || "Deleted / unavailable job"}
                </h2>

                <p className="mt-2 text-sm font-semibold text-black/60">
                  {isOwner
                    ? `Applicant: ${getDisplayName(selectedApplication.seeker)}`
                    : getJobCompany(selectedApplication.job)}
                </p>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="rounded-full bg-black/5 px-4 py-2 text-sm font-black transition hover:bg-black hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Application date
                </p>
                <p className="mt-1 font-black">
                  {formatDate(selectedApplication.created_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Job location
                </p>
                <p className="mt-1 font-black">
                  {getJobLocation(selectedApplication.job)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Job salary
                </p>
                <p className="mt-1 font-black">
                  {getJobSalaryText(selectedApplication.job)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Job type
                </p>
                <p className="mt-1 font-black">{getJobType(selectedApplication.job)}</p>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Category
                </p>
                <p className="mt-1 font-black">
                  {selectedApplication.job?.category || "Not mentioned"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Timing
                </p>
                <p className="mt-1 font-black">
                  {selectedApplication.job?.timing ||
                    selectedApplication.job?.availability ||
                    "Not mentioned"}
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="mt-6 rounded-3xl bg-[#FAF9F6] p-5">
                <h3 className="text-lg font-black">Applicant profile</h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Name
                    </p>
                    <p className="mt-1 font-black">
                      {getDisplayName(selectedApplication.seeker)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Email
                    </p>
                    <p className="mt-1 font-black">
                      {selectedApplication.seeker?.email || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      City
                    </p>
                    <p className="mt-1 font-black">
                      {getProfileLocation(selectedApplication.seeker)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Expected salary
                    </p>
                    <p className="mt-1 font-black">
                      {getProfileSalary(selectedApplication.seeker)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Availability
                    </p>
                    <p className="mt-1 font-black">
                      {selectedApplication.seeker?.availability || "Not mentioned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Profile score
                    </p>
                    <p className="mt-1 font-black">
                      {getProfileScore(selectedApplication.seeker) !== null
                        ? `${getProfileScore(selectedApplication.seeker)}%`
                        : "Not available"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                      Skills
                    </p>
                    <p className="mt-1 font-black">
                      {selectedApplication.seeker?.skills || "Not mentioned"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-black">Job description</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-black/70">
                {selectedApplication.job?.description || "No description available."}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-black">Requirements</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-black/70">
                {selectedApplication.job?.requirements || "No requirements available."}
              </p>
            </div>

            {selectedApplication.message && (
              <div className="mt-6">
                <h3 className="text-lg font-black">Application message</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-black/70">
                  {selectedApplication.message}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isOwner && (
                <>
                  <select
                    value={selectedApplication.status || "applied"}
                    disabled={actionLoadingId === selectedApplication.id}
                    onChange={(event) =>
                      updateApplicationStatus(selectedApplication, event.target.value)
                    }
                    className="flex-1 rounded-2xl border border-black/10 bg-[#151515] px-5 py-4 text-sm font-black text-white outline-none transition hover:bg-[#E8500A] disabled:cursor-wait disabled:opacity-70"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>

                  {isAdmin && (
                    <button
                      onClick={() => deleteApplication(selectedApplication)}
                      disabled={actionLoadingId === selectedApplication.id}
                      className="flex-1 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                    >
                      {actionLoadingId === selectedApplication.id
                        ? "Deleting..."
                        : "Delete Application"}
                    </button>
                  )}
                </>
              )}

              {isSeeker && (
                <button
                  onClick={() => deleteApplication(selectedApplication)}
                  disabled={actionLoadingId === selectedApplication.id}
                  className="flex-1 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {actionLoadingId === selectedApplication.id
                    ? "Withdrawing..."
                    : "Withdraw Application"}
                </button>
              )}

              <button
                onClick={() => setSelectedApplication(null)}
                className="flex-1 rounded-2xl border border-black/10 px-5 py-4 text-sm font-black transition hover:border-[#E8500A] hover:text-[#E8500A]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}