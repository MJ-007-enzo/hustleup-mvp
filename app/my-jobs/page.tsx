"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";

type JobWithDetails = Job & {
  responsibilities?: string | null;
  who_can_apply?: string | null;
  benefits?: string | null;
  openings?: number | null;
  work_address?: string | null;
  contact_note?: string | null;
};

const premiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,90,31,0.14)",
  background:
    "radial-gradient(circle at 8% 8%, rgba(255,90,31,0.06), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  boxShadow: "0 24px 60px rgba(17,24,39,0.08)",
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

const formValueStyle: CSSProperties = {
  color: "var(--premium)",
  fontSize: "16px",
  fontWeight: 750,
  fontFamily: "inherit",
};

const textareaValueStyle: CSSProperties = {
  color: "var(--premium)",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.55,
};

function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function capitalizeSentences(value: string) {
  return value.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
}

function Pill({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "neutral" | "success" | "danger" | "premium";
}) {
  const styles: Record<string, CSSProperties> = {
    neutral: {
      background: "rgba(255,90,31,0.09)",
      color: "var(--brand-dark)",
      border: "1px solid rgba(255,90,31,0.15)",
    },
    success: {
      background: "rgba(16,185,129,0.11)",
      color: "#047857",
      border: "1px solid rgba(16,185,129,0.22)",
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      color: "#b91c1c",
      border: "1px solid rgba(239,68,68,0.2)",
    },
    premium: {
      background: "var(--premium-gradient)",
      color: "white",
      border: "1px solid rgba(17,24,39,0.1)",
      boxShadow: "0 14px 30px rgba(17,24,39,0.12)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        alignItems: "center",
        gap: variant === "premium" ? 7 : 0,
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 11,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...styles[variant],
      }}
    >
      {variant === "premium" && (
        <span
          style={{
            color: "#fbbf24",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      )}
      {children}
    </span>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(255,90,31,0.12)",
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
          fontSize: 11,
        }}
      >
        {label}
      </small>

      <strong
        style={{
          display: "block",
          color: "var(--premium)",
          fontWeight: 800,
          lineHeight: 1.3,
          fontSize: 14,
        }}
      >
        {value || "Not added"}
      </strong>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 30,
        minHeight: 210,
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

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: "var(--brand-soft)",
          color: "var(--brand-dark)",
          fontWeight: 900,
          marginBottom: 22,
          boxShadow: "0 10px 24px rgba(255,90,31,0.08)",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: 0,
          color: "var(--muted)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: 13,
        }}
      >
        {label}
      </p>

      <div
        className="stat"
        style={{
          marginTop: 14,
          marginBottom: 8,
          color: "var(--premium)",
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginBottom: 0,
          fontWeight: 700,
          lineHeight: 1.45,
        }}
      >
        {hint}
      </p>
    </div>
  );
}

export default function MyJobsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [editingJob, setEditingJob] = useState<JobWithDetails | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, []);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "open").length;
  }, [jobs]);

  const premiumJobs = useMemo(() => {
    return jobs.filter((job) => job.is_premium).length;
  }, [jobs]);

  async function loadPage() {
    setCheckingAccess(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      setCheckingAccess(false);
      return;
    }

    const myProfile = profileData as Profile;
    setProfile(myProfile);

    if (myProfile.role !== "job_owner" && myProfile.role !== "admin") {
      setCheckingAccess(false);
      return;
    }

    let query = supabase.from("jobs").select("*");

    if (myProfile.role !== "admin") {
      query = query.eq("owner_id", authData.user.id);
    }

    const { data: jobData, error: jobError } = await query.order("created_at", {
      ascending: false,
    });

    if (jobError) {
      setMessage(jobError.message);
      setCheckingAccess(false);
      return;
    }

    setJobs((jobData ?? []) as JobWithDetails[]);
    setCheckingAccess(false);
  }

  function updateEditField<K extends keyof JobWithDetails>(
    key: K,
    value: JobWithDetails[K]
  ) {
    if (!editingJob) return;
    setEditingJob({ ...editingJob, [key]: value });
  }

  async function saveJob(event: FormEvent) {
    event.preventDefault();

    if (!editingJob) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("jobs")
      .update({
        title: editingJob.title,
        company_name: editingJob.company_name,
        location: editingJob.location,
        job_type: editingJob.job_type,
        duration: editingJob.duration,
        salary_type: editingJob.salary_type,
        salary_amount: editingJob.salary_amount,
        requirements: editingJob.requirements,
        is_premium: editingJob.is_premium,
        status: editingJob.status,
        responsibilities: editingJob.responsibilities,
        who_can_apply: editingJob.who_can_apply,
        benefits: editingJob.benefits,
        openings: editingJob.openings,
        work_address: editingJob.work_address,
        contact_note: editingJob.contact_note,
      })
      .eq("id", editingJob.id);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job updated successfully.");
    setEditingJob(null);
    loadPage();
  }

  async function deleteJob(job: JobWithDetails) {
    const confirmed = window.confirm(
      `Delete "${job.title}"? This will also remove related applications.`
    );

    if (!confirmed) return;

    setDeletingJobId(job.id);
    setMessage("");

    const { error } = await supabase.from("jobs").delete().eq("id", job.id);

    setDeletingJobId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job deleted successfully.");
    loadPage();
  }

  if (checkingAccess) {
    return (
      <main className="container">
        <p>Checking jobs...</p>
      </main>
    );
  }

  if (profile?.role !== "job_owner" && profile?.role !== "admin") {
    return (
      <main className="container">
        <span className="badge">Access blocked</span>

        <h1>You cannot manage jobs.</h1>

        <p>
          Your current role is <strong>{profile?.role}</strong>. Only job owners
          and admins can manage posted jobs.
        </p>

        <div className="actions">
          <Link className="btn btn-primary" href="/jobs">
            Browse jobs
          </Link>

          <Link className="btn" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 22,
          alignItems: "stretch",
          marginBottom: 26,
        }}
      >
        <div>
          <span className="badge">Job management</span>

          <h1>
            {profile.role === "admin" ? "Manage all jobs." : "Manage your jobs."}
          </h1>

          <p className="hero-copy">
            Edit job details, update salary, close listings, mark premium jobs,
            or delete old test jobs.
          </p>

          <div className="actions">
            <Link
              className="btn btn-primary"
              style={primaryButtonStyle}
              href="/post-job"
            >
              Post new job
            </Link>

            <Link
              className="btn"
              style={secondaryButtonStyle}
              href="/applications"
            >
              View applicants
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginBottom: 28 }}>
        <StatCard
          label="Total jobs"
          value={jobs.length}
          hint={
            profile.role === "admin"
              ? "All platform listings."
              : "Jobs posted by you."
          }
          icon="💼"
        />

        <StatCard
          label="Open jobs"
          value={openJobs}
          hint="Listings currently visible to job seekers."
          icon="↗"
        />

        <StatCard
          label="Premium jobs"
          value={premiumJobs}
          hint="Listings highlighted with premium priority."
          icon="⭐"
        />
      </section>

      {message && (
        <div
          className={`notice ${
            message.includes("successfully") ? "success" : "error"
          }`}
          style={{ marginBottom: 22 }}
        >
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <section
          className="card"
          style={{
            ...premiumCardStyle,
            borderRadius: 30,
            padding: 30,
          }}
        >
          <span className="tag">No jobs yet</span>

          <h3 style={{ marginTop: 14 }}>No posted jobs found.</h3>

          <p>Create a job first, then you can edit or delete it here.</p>

          <div className="actions">
            <Link
              className="btn btn-primary"
              style={primaryButtonStyle}
              href="/post-job"
            >
              Post a job
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 22,
          }}
        >
          {jobs.map((job) => (
            <article
              key={job.id}
              style={{
                ...premiumCardStyle,
                borderRadius: 30,
                padding: 24,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0 0 auto 0",
                  height: 5,
                  background: job.is_premium
                    ? "var(--brand-gradient)"
                    : job.status === "open"
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {job.is_premium && <Pill variant="premium">Premium</Pill>}

                  <Pill variant={job.status === "open" ? "success" : "neutral"}>
                    {job.status}
                  </Pill>
                </div>

                <Pill>{job.job_type || "Job"}</Pill>
              </div>

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  color: "var(--premium)",
                  fontSize: "clamp(30px, 4vw, 44px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.05em",
                }}
              >
                {job.title}
              </h2>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 18,
                  color: "var(--muted)",
                  fontSize: 16,
                }}
              >
                <strong style={{ color: "var(--premium)" }}>
                  {job.company_name}
                </strong>
                {" · "}
                {job.location}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <InfoTile
                  label="Salary"
                  value={`₹${job.salary_amount}/${job.salary_type}`}
                />

                <InfoTile label="Timing" value={job.duration || "Flexible"} />

                <InfoTile label="Openings" value={job.openings || 1} />
              </div>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 28,
                  color: "var(--muted)",
                  fontWeight: 650,
                  lineHeight: 1.6,
                  minHeight: 52,
                }}
              >
                {job.requirements || "No requirements added."}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <button
                  className="btn"
                  style={secondaryButtonStyle}
                  onClick={() => setEditingJob(job)}
                >
                  Edit job
                </button>

                <button
                  className="btn"
                  style={dangerButtonStyle}
                  onClick={() => deleteJob(job)}
                  disabled={deletingJobId === job.id}
                >
                  {deletingJobId === job.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {editingJob && (
        <div
          onClick={() => setEditingJob(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(17,24,39,0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <form
            onSubmit={saveJob}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "min(920px, 100%)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 30,
              padding: 28,
              border: "1px solid rgba(255,90,31,0.18)",
              background:
                "radial-gradient(circle at 8% 6%, rgba(255,90,31,0.12), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.96))",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.35), 0 18px 44px rgba(255,90,31,0.12)",
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

            <button
              type="button"
              onClick={() => setEditingJob(null)}
              aria-label="Close edit job"
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(255,90,31,0.16)",
                background: "rgba(255,255,255,0.88)",
                color: "var(--premium)",
                fontSize: 24,
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 12px 28px rgba(17,24,39,0.1)",
              }}
            >
              ×
            </button>

            <span className="badge">Edit job</span>

            <h2
              style={{
                marginTop: 14,
                paddingRight: 50,
                color: "var(--premium)",
              }}
            >
              {editingJob.title}
            </h2>

            <div className="form">
              <label className="label">
                Job title
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.title}
                  onChange={(event) =>
                    updateEditField(
                      "title",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <label className="label">
                Company / shop name
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.company_name}
                  onChange={(event) =>
                    updateEditField(
                      "company_name",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <label className="label">
                Location
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.location}
                  onChange={(event) =>
                    updateEditField(
                      "location",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <div className="grid grid-2">
                <label className="label">
                  Job type
                  <input
                    className="input"
                    style={formValueStyle}
                    value={editingJob.job_type}
                    onChange={(event) =>
                      updateEditField(
                        "job_type",
                        capitalizeWords(event.target.value)
                      )
                    }
                  />
                </label>

                <label className="label">
                  Duration / timing
                  <input
                    className="input"
                    style={formValueStyle}
                    value={editingJob.duration ?? ""}
                    onChange={(event) =>
                      updateEditField("duration", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label className="label">
                  Salary type
                  <select
                    className="select"
                    style={formValueStyle}
                    value={editingJob.salary_type}
                    onChange={(event) =>
                      updateEditField(
                        "salary_type",
                        event.target.value as JobWithDetails["salary_type"]
                      )
                    }
                  >
                    <option value="hour">Per hour</option>
                    <option value="day">Per day</option>
                    <option value="week">Per week</option>
                    <option value="month">Per month</option>
                  </select>
                </label>

                <label className="label">
                  Salary amount
                  <input
                    className="input"
                    style={formValueStyle}
                    type="number"
                    min={1}
                    value={editingJob.salary_amount}
                    onChange={(event) =>
                      updateEditField(
                        "salary_amount",
                        Number(event.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <label className="label">
                Requirements
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.requirements ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "requirements",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Responsibilities
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.responsibilities ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "responsibilities",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Who can apply?
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.who_can_apply ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "who_can_apply",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Benefits / perks
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.benefits ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "benefits",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <div className="grid grid-2">
                <label className="label">
                  Openings
                  <input
                    className="input"
                    style={formValueStyle}
                    type="number"
                    min={1}
                    value={editingJob.openings ?? 1}
                    onChange={(event) =>
                      updateEditField("openings", Number(event.target.value))
                    }
                  />
                </label>

                <label className="label">
                  Status
                  <select
                    className="select"
                    style={formValueStyle}
                    value={editingJob.status}
                    onChange={(event) =>
                      updateEditField(
                        "status",
                        event.target.value as JobWithDetails["status"]
                      )
                    }
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>

              <label className="label">
                Work address / area
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.work_address ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "work_address",
                      capitalizeWords(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Contact note
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.contact_note ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "contact_note",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label
                className="label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={editingJob.is_premium}
                  onChange={(event) =>
                    updateEditField("is_premium", event.target.checked)
                  }
                />
                Mark as premium listing
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={secondaryButtonStyle}
                  onClick={() => setEditingJob(null)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}