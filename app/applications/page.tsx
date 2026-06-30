"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";
import { ownerPlanLimits } from "@/lib/ownerPlans";
import {
  canViewContacts,
  maskEmail,
  maskPhone,
  maskText,
} from "@/lib/contactAccess";

type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "hired";

type ApplicationRow = {
  id: string;
  job_id: string;
  seeker_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
};

type UpgradedProfile = Profile & {
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  is_verified?: boolean | null;
};

type ApplicationView = ApplicationRow & {
  job?: Job;
  seeker?: UpgradedProfile;
};

type StatusFilter = "all" | ApplicationStatus;

const cardSoftStyle: CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--card)",
  boxShadow: "var(--shadow)",
};

const actionButtonStyle: CSSProperties = {
  minHeight: 48,
  borderRadius: 16,
  padding: "0 18px",
  fontWeight: 850,
  fontSize: 14,
  boxShadow: "0 12px 28px rgba(17,24,39,0.08)",
};

const secondaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  border: "1px solid rgba(255,90,31,0.16)",
  color: "var(--premium)",
};

const disabledButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  border: "1px solid rgba(255,90,31,0.16)",
  color: "var(--premium)",
  opacity: 1,
  cursor: "not-allowed",
};

const dangerButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "linear-gradient(180deg, #fff7f7, #fff1f1)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#b91c1c",
};

const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  boxShadow:
    "0 18px 40px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
};

function getStatusVisual(status: ApplicationStatus) {
  if (status === "applied") {
    return {
      icon: "↗",
      color: "#92400e",
      background: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.22)",
    };
  }

  if (status === "shortlisted") {
    return {
      icon: "★",
      color: "#1d4ed8",
      background: "rgba(59,130,246,0.1)",
      border: "1px solid rgba(59,130,246,0.2)",
    };
  }

  if (status === "hired") {
    return {
      icon: "✓",
      color: "#047857",
      background: "rgba(16,185,129,0.11)",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }

  return {
    icon: "×",
    color: "#b91c1c",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
  };
}

export default function ApplicationsPage() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hiddenApplicants, setHiddenApplicants] = useState(0);
  const [visibleApplicantLimit, setVisibleApplicantLimit] = useState<number | null>(null);
  const [ownerLimits, setOwnerLimits] = useState(ownerPlanLimits("free"));

  useEffect(() => {
    loadPage();
  }, []);

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: applications.length,
      applied: applications.filter((app) => app.status === "applied").length,
      shortlisted: applications.filter((app) => app.status === "shortlisted")
        .length,
      hired: applications.filter((app) => app.status === "hired").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    };
  }, [applications]);

  async function loadPage() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const userId = authData.user.id;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      showToast(profileError.message, "error");
      setLoading(false);
      return;
    }

    const myProfile = profileData as UpgradedProfile;
    setProfile(myProfile);

    if (myProfile.role === "job_seeker") {
      await loadSeekerApplications(userId);
    } else {
      await loadOwnerApplications(userId, myProfile.role === "admin", myProfile);
    }

    setLoading(false);
  }

  async function loadSeekerApplications(userId: string) {
    const { data: appData, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("seeker_id", userId)
      .order("created_at", { ascending: false });

    if (appError) {
      showToast(appError.message, "error");
      return;
    }

    const appRows = (appData ?? []) as ApplicationRow[];
    const jobIds = appRows.map((app) => app.job_id);

    let jobs: Job[] = [];

    if (jobIds.length > 0) {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .in("id", jobIds);

      if (jobError) {
        showToast(jobError.message, "error");
        return;
      }

      jobs = (jobData ?? []) as Job[];
    }

    const finalData = appRows.map((app) => ({
      ...app,
      job: jobs.find((job) => job.id === app.job_id),
    }));

    setApplications(finalData);
  }

  async function loadOwnerApplications(userId: string, isAdmin: boolean, myProfile: UpgradedProfile) {
    let jobsQuery = supabase.from("jobs").select("*");

    if (!isAdmin) {
      jobsQuery = jobsQuery.eq("owner_id", userId);
    }

  const { data: jobData, error: jobError } = await jobsQuery.order(
    "created_at",
    {
      ascending: false,
    }
  );

  if (jobError) {
    showToast(jobError.message, "error");
    return;
  }

  const jobs = (jobData ?? []) as Job[];
  const jobIds = jobs.map((job) => job.id);

  if (jobIds.length === 0) {
    setApplications([]);
    return;
  }

  const { data: appData, error: appError } = await supabase
    .from("applications")
    .select("*")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  if (appError) {
    showToast(appError.message, "error");
    return;
  }

  const appRows = (appData ?? []) as ApplicationRow[];
  const seekerIds = appRows.map((app) => app.seeker_id);

  let seekers: UpgradedProfile[] = [];

  if (seekerIds.length > 0) {
    const { data: seekerData, error: seekerError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", seekerIds);

    if (seekerError) {
      showToast(seekerError.message, "error");
      return;
    }

    seekers = (seekerData ?? []) as UpgradedProfile[];
  }

  const finalData = appRows.map((app) => ({
    ...app,
    job: jobs.find((job) => job.id === app.job_id),
    seeker: seekers.find((seeker) => seeker.id === app.seeker_id),
  }));

  // Admins can always see everything
  if (isAdmin) {
    setApplications(finalData);
    return;
  }

  // Read owner's plan
  const planLimits = ownerPlanLimits(myProfile.owner_plan);

  setOwnerLimits(planLimits);

  const visibleLimit = planLimits.applicantVisibility;

  setVisibleApplicantLimit(visibleLimit);

  const visibleApplications = finalData.slice(0, visibleLimit);

  setApplications(visibleApplications);

  setHiddenApplicants(
    Math.max(0, finalData.length - visibleApplications.length)
  );
}

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdatingId(applicationId);

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    setUpdatingId(null);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
    );

    if (status === "shortlisted") {
      showToast("Application shortlisted successfully.", "success");
      return;
    }

    if (status === "rejected") {
      showToast("Application rejected successfully.", "success");
      return;
    }

    if (status === "hired") {
      showToast("Application marked as hired successfully.", "success");
      return;
    }

    showToast(`Application marked as ${status}.`, "success");
  }

  function statusLabel(status: ApplicationStatus) {
    if (status === "applied") return "Applied";
    if (status === "shortlisted") return "Shortlisted";
    if (status === "hired") return "Hired";
    return "Rejected";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function profileCompletion(seeker?: UpgradedProfile) {
    if (!seeker) return 0;

    const fields = [
      seeker.full_name,
      seeker.email,
      seeker.occupation,
      seeker.skills,
      seeker.availability,
      seeker.expected_salary,
      seeker.location,
      seeker.phone,
      seeker.bio,
      seeker.experience,
    ];

    const filled = fields.filter(
      (field) => field && field.trim().length > 0
    ).length;

    return Math.round((filled / fields.length) * 100);
  }

  function profileQualityLabel(score: number) {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Strong";
    if (score >= 45) return "Average";
    return "Incomplete";
  }

  function StatusPill({ status }: { status: ApplicationStatus }) {
    const visual = getStatusVisual(status);

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          width: "fit-content",
          padding: "8px 12px",
          borderRadius: 999,
          background: visual.background,
          border: visual.border,
          color: visual.color,
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        <span>{visual.icon}</span>
        {statusLabel(status)}
      </span>
    );
  }

  function StatButton({
    label,
    count,
    filter,
  }: {
    label: string;
    count: number;
    filter: StatusFilter;
  }) {
    const active = statusFilter === filter;

    return (
      <button
        onClick={() => setStatusFilter(filter)}
        style={{
          minHeight: 92,
          border: active
            ? "1px solid rgba(255,90,31,0.48)"
            : "1px solid rgba(255,90,31,0.14)",
          borderRadius: 24,
          background: active
            ? "var(--surface)"
            : "var(--card)",
          boxShadow: active
            ? "0 20px 50px rgba(255,90,31,0.12), 0 12px 28px rgba(17,24,39,0.08)"
            : "0 14px 34px rgba(17,24,39,0.055)",
          padding: 18,
          cursor: "pointer",
          textAlign: "left",
          transition:
            "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        }}
      >
        <span
          style={{
            display: "block",
            color: active ? "var(--brand-dark)" : "var(--muted)",
            fontWeight: 850,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          {label}
        </span>

        <strong
          style={{
            display: "block",
            color: active ? "var(--brand)" : "var(--premium)",
            fontSize: 30,
            lineHeight: 1,
          }}
        >
          {count}
        </strong>
      </button>
    );
  }

  function InfoTile({
    label,
    value,
  }: {
    label: string;
    value: string | number | undefined | null;
  }) {
    return (
      <div
        style={{
          padding: 15,
          borderRadius: 18,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 24px rgba(17,24,39,0.035)",
        }}
      >
        <small
          style={{
            display: "block",
            color: "var(--muted)",
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 6,
          }}
        >
          {label}
        </small>

        <strong
          style={{
            display: "block",
            color: "var(--premium)",
            fontWeight: 800,
            lineHeight: 1.35,
          }}
        >
          {value || "Not added"}
        </strong>
      </div>
    );
  }

  function DetailBlock({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 24px rgba(17,24,39,0.035)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 16,
            color: "var(--premium)",
          }}
        >
          {title}
        </h3>

        <div
          style={{
            color: "var(--muted)",
            fontWeight: 650,
            lineHeight: 1.55,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  function seekerTimeline(status: ApplicationStatus) {
    const steps: ApplicationStatus[] = ["applied", "shortlisted", "hired"];
    const rejected = status === "rejected";

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: rejected
            ? "repeat(4, minmax(0, 1fr))"
            : "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginTop: 12,
        }}
      >
        {steps.map((step) => {
          const active =
            !rejected &&
            (status === step ||
              (status === "shortlisted" && step === "applied") ||
              (status === "hired" &&
                (step === "applied" || step === "shortlisted")));

          const visual = getStatusVisual(active ? step : "applied");

          return (
            <div
              key={step}
              style={{
                padding: "14px 10px",
                borderRadius: 18,
                textAlign: "center",
                background: active
                  ? visual.background
                  : "var(--surface)",
                border: active
                  ? visual.border
                  : "1px solid rgba(17,24,39,0.08)",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 8px",
                  background: active ? "var(--brand-soft)" : "#ffffff",
                  color: active ? "var(--brand-dark)" : "var(--muted)",
                  border: "1px solid rgba(255,90,31,0.12)",
                  fontWeight: 900,
                }}
              >
                {active ? "✓" : ""}
              </span>

              <p
                style={{
                  margin: 0,
                  color: active ? "var(--premium)" : "var(--muted)",
                  fontWeight: 750,
                  fontSize: 13,
                }}
              >
                {statusLabel(step)}
              </p>
            </div>
          );
        })}

        {rejected && (
          <div
            style={{
              padding: "14px 10px",
              borderRadius: 18,
              textAlign: "center",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 8px",
                background: "#fff1f1",
                color: "#b91c1c",
                border: "1px solid rgba(239,68,68,0.18)",
                fontWeight: 900,
              }}
            >
              ×
            </span>

            <p
              style={{
                margin: 0,
                color: "#b91c1c",
                fontWeight: 750,
                fontSize: 13,
              }}
            >
              Rejected
            </p>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading applications...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="applications-hero">
        <div>
          <span className="badge">Applications</span>

          <h1>
            {profile?.role === "job_seeker"
              ? "Track your applications."
              : "Manage applicants."}
          </h1>

          <p className="hero-copy">
            {profile?.role === "job_seeker"
              ? "See where every application stands — applied, shortlisted, hired, or rejected."
              : "Review students who applied to your jobs, shortlist strong candidates, reject weak fits, or mark hired applicants."}
          </p>
        </div>

        <div
          className="jobs-summary-card"
          style={{
            ...cardSoftStyle,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 5,
              background: "var(--brand-gradient)",
            }}
          />

          <span className="tag">Total applications</span>

          <div className="stat">{applications.length}</div>

          <p>
            {profile?.role === "job_seeker"
              ? "applications submitted"
              : "applications received"}
          </p>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatButton label="All" count={counts.all} filter="all" />
        <StatButton label="Applied" count={counts.applied} filter="applied" />
        <StatButton
          label="Shortlisted"
          count={counts.shortlisted}
          filter="shortlisted"
        />
        <StatButton label="Hired" count={counts.hired} filter="hired" />
        <StatButton
          label="Rejected"
          count={counts.rejected}
          filter="rejected"
        />
      </section>

      {filteredApplications.length === 0 ? (
        <section
          className="card"
          style={{
            ...cardSoftStyle,
            borderRadius: 28,
            padding: 28,
          }}
        >
          <span className="tag">No applications</span>
          <h3>No matching applications found.</h3>
          <p>
            {profile?.role === "job_seeker"
              ? "Apply to jobs from the Jobs page. Your application status will appear here."
              : "When job seekers apply to your jobs, their applications will appear here."}
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gap: 22,
          }}
        >
          {filteredApplications.map((app) => {
            const completionScore = profileCompletion(app.seeker);
            const contactsUnlocked =
  profile?.role === "admin" ||
  canViewContacts(profile?.owner_plan);

            return (
              <article
                key={app.id}
                style={{
                  ...cardSoftStyle,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 30,
                  padding: 26,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "0 0 auto 0",
                    height: 5,
                    background:
                      app.status === "hired"
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : app.status === "rejected"
                          ? "linear-gradient(90deg, #ef4444, #fb7185)"
                          : "var(--brand-gradient)",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 18,
                    flexWrap: "wrap",
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <StatusPill status={app.status} />

                    <h2
                      style={{
                        marginTop: 14,
                        marginBottom: 8,
                        color: "var(--premium)",
                      }}
                    >
                      {app.job?.title || "Unknown job"}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "var(--muted)",
                      }}
                    >
                      <strong>
                        {app.job?.company_name || "Unknown company"}
                      </strong>
                      {" · "}
                      {app.job?.location || "Location not available"}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      minWidth: 140,
                    }}
                  >
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        fontWeight: 850,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: 5,
                      }}
                    >
                      Applied on
                    </small>

                    <strong
                      style={{
                        color: "var(--premium)",
                      }}
                    >
                      {formatDate(app.created_at)}
                    </strong>
                  </div>
                </div>

                {profile?.role === "job_seeker" ? (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: 12,
                        marginBottom: 18,
                      }}
                    >
                      <InfoTile
                        label="Salary"
                        value={
                          app.job
                            ? `₹${app.job.salary_amount}/${app.job.salary_type}`
                            : "Not available"
                        }
                      />

                      <InfoTile
                        label="Timing"
                        value={app.job?.duration || "Flexible"}
                      />

                      <InfoTile
                        label="Job type"
                        value={app.job?.job_type || "Not available"}
                      />
                    </div>

                    <DetailBlock title="Your application progress">
                      {seekerTimeline(app.status)}
                    </DetailBlock>

                    <p
                      style={{
                        marginTop: 16,
                        marginBottom: 0,
                        padding: "14px 16px",
                        borderRadius: 18,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                        fontWeight: 650,
                        lineHeight: 1.55,
                      }}
                    >
                      {app.status === "applied" &&
                        "Your application has been sent. Wait for the job owner to review it."}
                      {app.status === "shortlisted" &&
                        "Good sign. You are shortlisted. The job owner may contact you next."}
                      {app.status === "hired" &&
                        "Congratulations. You have been marked as hired for this opportunity."}
                      {app.status === "rejected" &&
                        "This application was rejected. Keep applying to better matching jobs."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: 16,
                        borderRadius: 22,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 20,
                          display: "grid",
                          placeItems: "center",
                          background: "var(--premium-gradient)",
                          color: "white",
                          fontWeight: 950,
                          fontSize: 22,
                          boxShadow: "0 14px 30px rgba(17,24,39,0.16)",
                          flexShrink: 0,
                        }}
                      >
                        {(app.seeker?.full_name || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              color: "var(--premium)",
                            }}
                          >
                            {app.seeker?.full_name || "Unknown applicant"}
                          </h3>

                          {app.seeker?.is_verified && (
                            <span className="verified-badge">Verified</span>
                          )}
                        </div>

                        <p
                          style={{
                            marginTop: 5,
                            marginBottom: 10,
                            color: "var(--muted)",
                          }}
                        >
                         {contactsUnlocked
  ? app.seeker?.email || "Email not available"
  : maskEmail(app.seeker?.email)}
                        </p>

                        <div>
                          <span
                            style={{
                              display: "block",
                              color: "var(--muted)",
                              fontWeight: 750,
                              fontSize: 13,
                              marginBottom: 8,
                            }}
                          >
                            Profile: {completionScore}% ·{" "}
                            {profileQualityLabel(completionScore)}
                          </span>

                          <div className="profile-score-bar">
                            <div
                              style={{
                                width: `${completionScore}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <InfoTile label="Skills" value={app.seeker?.skills} />
                      <InfoTile
                        label="Availability"
                        value={app.seeker?.availability}
                      />
                      <InfoTile
                        label="Expected salary"
                        value={app.seeker?.expected_salary}
                      />
                      <InfoTile label="Location" value={app.seeker?.location} />
                      <InfoTile
  label="Phone"
  value={
    contactsUnlocked
      ? app.seeker?.phone
      : maskPhone(app.seeker?.phone)
  }
/>
                      <InfoTile
                        label="Occupation"
                        value={app.seeker?.occupation}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        marginBottom: 18,
                      }}
                    >
                      <DetailBlock title="Applicant bio">
                        <p style={{ margin: 0 }}>
                          {app.seeker?.bio || "No bio added."}
                        </p>
                      </DetailBlock>

                      <DetailBlock title="Experience">
                        <p style={{ margin: 0 }}>
                          {app.seeker?.experience || "No experience added."}
                        </p>
                      </DetailBlock>

                      <DetailBlock title="🌐 Portfolio">
  {!app.seeker?.portfolio_url ? (
    <p style={{ margin: 0 }}>No portfolio added.</p>
  ) : contactsUnlocked ? (
    <a
      className="profile-link"
      href={app.seeker.portfolio_url}
      target="_blank"
      rel="noreferrer"
    >
      Open Portfolio
    </a>
  ) : (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          padding: 14,
          borderRadius: 14,
          background: "rgba(255,90,31,0.08)",
          border: "1px solid rgba(255,90,31,0.18)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: "var(--premium)",
            marginBottom: 8,
          }}
        >
          🔒 Portfolio Locked
        </div>

        <div
          style={{
            color: "var(--muted)",
            marginBottom: 14,
          }}
        >
          {maskText(app.seeker.portfolio_url)}
        </div>

        <p
          style={{
            margin: "0 0 14px",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          Upgrade to <strong>Starter</strong> to unlock applicant contact
          details and portfolio links.
        </p>

        <a
          href="/pricing"
          className="btn btn-primary"
        >
          Upgrade Plan
        </a>
      </div>
    </div>
  )}
</DetailBlock>
                      <DetailBlock title="Resume">
                        {app.seeker?.resume_url ? (
                          ownerLimits.resumeDownloads ? (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    display: "block",
                                    color: "var(--premium)",
                                    marginBottom: 4,
                                  }}
                                >
                                  {app.seeker.resume_filename || "Resume.pdf"}
                                </strong>

                                <span
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: 14,
                                  }}
                                >
                                  Resume uploaded
                                </span>
                              </div>

                              <a
                                href={app.seeker.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                              >
                                ⬇ Download Resume
                              </a>
                            </div>
                          ) : (
                            <div
                              style={{
                                textAlign: "center",
                                padding: 18,
                                borderRadius: 18,
                                background: "rgba(255,90,31,0.06)",
                                border: "1px solid rgba(255,90,31,0.18)",
                              }}
                            >
                              <div style={{ fontSize: 34 }}>🔒</div>

                              <h4 style={{ margin: "10px 0" }}>
                                Resume Locked
                              </h4>

                              <p
                                style={{
                                  marginBottom: 16,
                                }}
                              >
                                Upgrade to Starter or above to download resumes.
                              </p>

                              <a
                                href="/pricing"
                                className="btn btn-primary"
                              >
                                Upgrade Plan
                              </a>
                            </div>
                          )
                        ) : (
                          <p style={{ margin: 0 }}>
                            No resume uploaded.
                          </p>
                        )}
                      </DetailBlock>

                      <DetailBlock title="Applicant message">
                        <p style={{ margin: 0 }}>
                          {app.message || "No message added."}
                        </p>
                      </DetailBlock>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        paddingTop: 4,
                      }}
                    >
                      {app.status === "applied" && (
                        <>
                          <button
                            className="btn"
                            style={secondaryButtonStyle}
                            onClick={() =>
                              updateStatus(app.id, "shortlisted")
                            }
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id
                              ? "Updating..."
                              : "Shortlist"}
                          </button>

                          <button
                            className="btn"
                            style={dangerButtonStyle}
                            onClick={() => updateStatus(app.id, "rejected")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? "Updating..." : "Reject"}
                          </button>

                          <button
                            className="btn btn-primary"
                            style={primaryButtonStyle}
                            onClick={() => updateStatus(app.id, "hired")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? "Updating..." : "Hire"}
                          </button>
                        </>
                      )}

                      {app.status === "shortlisted" && (
                        <>
                          <button
                            className="btn"
                            style={dangerButtonStyle}
                            onClick={() => updateStatus(app.id, "rejected")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? "Updating..." : "Reject"}
                          </button>

                          <button
                            className="btn btn-primary"
                            style={primaryButtonStyle}
                            onClick={() => updateStatus(app.id, "hired")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? "Updating..." : "Hire"}
                          </button>
                        </>
                      )}

                      {app.status === "hired" && (
                        <button
                          className="btn"
                          style={disabledButtonStyle}
                          disabled
                        >
                          Already hired
                        </button>
                      )}

                      {app.status === "rejected" && (
                        <button
                          className="btn"
                          style={dangerButtonStyle}
                          disabled
                        >
                          Rejected
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {profile?.role === "job_owner" && hiddenApplicants > 0 && (
  <section
    className="card"
    style={{
      borderRadius: 30,
      padding: 30,
      textAlign: "center",
      border: "1px solid rgba(255,90,31,0.22)",
      background:
        "radial-gradient(circle at top, rgba(255,90,31,0.12), transparent 34%), var(--card)",
      boxShadow: "0 24px 70px rgba(17,24,39,0.12)",
    }}
  >
    <div style={{ fontSize: 54, marginBottom: 14 }}>🔒</div>

    <h2>{hiddenApplicants} more applicants hidden</h2>

    <p>
      Your <strong>{profile.owner_plan.toUpperCase()}</strong> plan currently
      shows only <strong>{visibleApplicantLimit}</strong> applicants.
    </p>

    <p>
      Upgrade your owner plan to view more applicants, unlock resumes, and hire
      faster.
    </p>

    <div
      style={{
        display: "grid",
        gap: 10,
        margin: "24px auto",
        maxWidth: 420,
        textAlign: "left",
      }}
    >
      <div>✅ Starter: 25 applicants visible</div>
      <div>✅ Growth: 200 applicants visible</div>
      <div>✅ Pro: 1000 applicants visible</div>
    </div>

    <a className="btn btn-primary" href="/pricing">
      Upgrade Plan
    </a>
  </section>
)}
        </section>
      )}
    </main>
  );
}
