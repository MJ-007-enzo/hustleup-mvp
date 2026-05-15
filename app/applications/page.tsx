"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";

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

export default function ApplicationsPage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    setMessage("");

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
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    const myProfile = profileData as UpgradedProfile;
    setProfile(myProfile);

    if (myProfile.role === "job_seeker") {
      await loadSeekerApplications(userId);
    } else {
      await loadOwnerApplications(userId, myProfile.role === "admin");
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
      setMessage(appError.message);
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
        setMessage(jobError.message);
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

  async function loadOwnerApplications(userId: string, isAdmin: boolean) {
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
      setMessage(jobError.message);
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
      setMessage(appError.message);
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
        setMessage(seekerError.message);
        return;
      }

      seekers = (seekerData ?? []) as UpgradedProfile[];
    }

    const finalData = appRows.map((app) => ({
      ...app,
      job: jobs.find((job) => job.id === app.job_id),
      seeker: seekers.find((seeker) => seeker.id === app.seeker_id),
    }));

    setApplications(finalData);
  }

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setMessage("");
    setUpdatingId(applicationId);

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    setUpdatingId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
    );

    setMessage(`Application marked as ${status}.`);
  }

  function statusLabel(status: ApplicationStatus) {
    if (status === "applied") return "Applied";
    if (status === "shortlisted") return "Shortlisted";
    if (status === "hired") return "Hired";
    return "Rejected";
  }

  function statusClass(status: ApplicationStatus) {
    return `application-status application-status-${status}`;
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

  function seekerTimeline(status: ApplicationStatus) {
    const steps: ApplicationStatus[] = ["applied", "shortlisted", "hired"];
    const rejected = status === "rejected";

    return (
      <div className="status-timeline">
        {steps.map((step) => {
          const active =
            !rejected &&
            (status === step ||
              (status === "shortlisted" && step === "applied") ||
              (status === "hired" &&
                (step === "applied" || step === "shortlisted")));

          return (
            <div
              className={`timeline-step ${active ? "timeline-active" : ""}`}
              key={step}
            >
              <span>{active ? "✓" : ""}</span>
              <p>{statusLabel(step)}</p>
            </div>
          );
        })}

        {rejected && (
          <div className="timeline-step timeline-rejected">
            <span>×</span>
            <p>Rejected</p>
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

        <div className="jobs-summary-card">
          <span className="tag">Total applications</span>
          <div className="stat">{applications.length}</div>
          <p>
            {profile?.role === "job_seeker"
              ? "applications submitted"
              : "applications received"}
          </p>
        </div>
      </section>

      {message && (
        <div
          className={`notice ${
            message.includes("marked") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <section className="application-stats-grid">
        <button
          className={`application-stat-card ${
            statusFilter === "all" ? "application-stat-active" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <span>All</span>
          <strong>{counts.all}</strong>
        </button>

        <button
          className={`application-stat-card ${
            statusFilter === "applied" ? "application-stat-active" : ""
          }`}
          onClick={() => setStatusFilter("applied")}
        >
          <span>Applied</span>
          <strong>{counts.applied}</strong>
        </button>

        <button
          className={`application-stat-card ${
            statusFilter === "shortlisted" ? "application-stat-active" : ""
          }`}
          onClick={() => setStatusFilter("shortlisted")}
        >
          <span>Shortlisted</span>
          <strong>{counts.shortlisted}</strong>
        </button>

        <button
          className={`application-stat-card ${
            statusFilter === "hired" ? "application-stat-active" : ""
          }`}
          onClick={() => setStatusFilter("hired")}
        >
          <span>Hired</span>
          <strong>{counts.hired}</strong>
        </button>

        <button
          className={`application-stat-card ${
            statusFilter === "rejected" ? "application-stat-active" : ""
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <span>Rejected</span>
          <strong>{counts.rejected}</strong>
        </button>
      </section>

      {filteredApplications.length === 0 ? (
        <section className="card">
          <span className="tag">No applications</span>
          <h3>No matching applications found.</h3>
          <p>
            {profile?.role === "job_seeker"
              ? "Apply to jobs from the Jobs page. Your application status will appear here."
              : "When job seekers apply to your jobs, their applications will appear here."}
          </p>
        </section>
      ) : (
        <section className="applications-list">
          {filteredApplications.map((app) => {
            const completionScore = profileCompletion(app.seeker);

            return (
              <article className="application-card" key={app.id}>
                <div className="application-card-header">
                  <div>
                    <span className={statusClass(app.status)}>
                      {statusLabel(app.status)}
                    </span>

                    <h2>{app.job?.title || "Unknown job"}</h2>

                    <p>
                      <strong>
                        {app.job?.company_name || "Unknown company"}
                      </strong>
                      {" · "}
                      {app.job?.location || "Location not available"}
                    </p>
                  </div>

                  <div className="application-date">
                    <small>Applied on</small>
                    <strong>{formatDate(app.created_at)}</strong>
                  </div>
                </div>

                {profile?.role === "job_seeker" ? (
                  <div className="seeker-application-view">
                    <div className="job-modal-grid">
                      <div>
                        <small>Salary</small>
                        <strong>
                          {app.job
                            ? `₹${app.job.salary_amount}/${app.job.salary_type}`
                            : "Not available"}
                        </strong>
                      </div>

                      <div>
                        <small>Timing</small>
                        <strong>{app.job?.duration || "Flexible"}</strong>
                      </div>

                      <div>
                        <small>Job type</small>
                        <strong>{app.job?.job_type || "Not available"}</strong>
                      </div>
                    </div>

                    <div className="job-modal-section">
                      <h3>Your application progress</h3>
                      {seekerTimeline(app.status)}
                    </div>

                    <p className="application-help-text">
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
                  <div className="owner-application-view">
                    <div className="applicant-profile-card upgraded-applicant-card">
                      <div className="applicant-avatar">
                        {(app.seeker?.full_name || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div className="applicant-main-info">
                        <div className="applicant-name-row">
                          <h3>
                            {app.seeker?.full_name || "Unknown applicant"}
                          </h3>

                          {app.seeker?.is_verified && (
                            <span className="verified-badge">Verified</span>
                          )}
                        </div>

                        <p>{app.seeker?.email || "Email not available"}</p>

                        <div className="applicant-profile-score">
                          <span>
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

                    <div className="job-modal-grid">
                      <div>
                        <small>Skills</small>
                        <strong>{app.seeker?.skills || "Not added"}</strong>
                      </div>

                      <div>
                        <small>Availability</small>
                        <strong>
                          {app.seeker?.availability || "Not added"}
                        </strong>
                      </div>

                      <div>
                        <small>Expected salary</small>
                        <strong>
                          {app.seeker?.expected_salary || "Not added"}
                        </strong>
                      </div>

                      <div>
                        <small>Location</small>
                        <strong>{app.seeker?.location || "Not added"}</strong>
                      </div>

                      <div>
                        <small>Phone</small>
                        <strong>{app.seeker?.phone || "Not added"}</strong>
                      </div>

                      <div>
                        <small>Occupation</small>
                        <strong>
                          {app.seeker?.occupation || "Not added"}
                        </strong>
                      </div>
                    </div>

                    <div className="job-modal-section">
                      <h3>Applicant bio</h3>
                      <p>{app.seeker?.bio || "No bio added."}</p>
                    </div>

                    <div className="job-modal-section">
                      <h3>Experience</h3>
                      <p>{app.seeker?.experience || "No experience added."}</p>
                    </div>

                    <div className="job-modal-section">
                      <h3>Portfolio / proof</h3>
                      {app.seeker?.portfolio_url ? (
                        <a
                          className="profile-link"
                          href={app.seeker.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open portfolio
                        </a>
                      ) : (
                        <p>No portfolio link added.</p>
                      )}
                    </div>

                    <div className="job-modal-section">
                      <h3>Applicant message</h3>
                      <p>{app.message || "No message added."}</p>
                    </div>

                    <div className="application-actions">
                      {app.status === "applied" && (
                        <>
                          <button
                            className="btn"
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
                            className="btn danger-btn"
                            onClick={() => updateStatus(app.id, "rejected")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id
                              ? "Updating..."
                              : "Reject"}
                          </button>

                          <button
                            className="btn btn-primary"
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
                            className="btn danger-btn"
                            onClick={() => updateStatus(app.id, "rejected")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id
                              ? "Updating..."
                              : "Reject"}
                          </button>

                          <button
                            className="btn btn-primary"
                            onClick={() => updateStatus(app.id, "hired")}
                            disabled={updatingId === app.id}
                          >
                            {updatingId === app.id ? "Updating..." : "Hire"}
                          </button>
                        </>
                      )}

                      {app.status === "hired" && (
                        <button className="btn btn-primary" disabled>
                          Already hired
                        </button>
                      )}

                      {app.status === "rejected" && (
                        <button className="btn danger-btn" disabled>
                          Rejected
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}