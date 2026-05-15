"use client";

import { FormEvent, useEffect, useState } from "react";
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
          <a className="btn btn-primary" href="/jobs">
            Browse jobs
          </a>
          <a className="btn" href="/dashboard">
            Go to dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="manage-jobs-hero">
        <div>
          <span className="badge">Job management</span>
          <h1>{profile.role === "admin" ? "Manage all jobs." : "Manage your jobs."}</h1>
          <p className="hero-copy">
            Edit job details, update salary, close listings, mark premium jobs,
            or delete old test jobs.
          </p>
        </div>

        <div className="jobs-summary-card">
          <span className="tag">Active control</span>
          <div className="stat">{jobs.length}</div>
          <p>{profile.role === "admin" ? "total jobs" : "jobs posted by you"}</p>
        </div>
      </section>

      {message && (
        <div
          className={`notice ${
            message.includes("successfully") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <section className="jobs-grid">
        {jobs.length === 0 && (
          <div className="card empty-jobs-card">
            <span className="tag">No jobs yet</span>
            <h3>No posted jobs found.</h3>
            <p>Create a job first, then you can edit or delete it here.</p>
            <a className="btn btn-primary" href="/post-job">
              Post a job
            </a>
          </div>
        )}

        {jobs.map((job) => (
          <article
            className={`my-job-card ${job.is_premium ? "job-card-premium" : ""}`}
            key={job.id}
          >
            <div className="job-card-top">
              <span className={job.is_premium ? "premium-pill" : "open-pill"}>
                {job.is_premium ? "Premium" : "Open"}
              </span>

              <span className="job-date">{job.status}</span>
            </div>

            <h2>{job.title}</h2>

            <div className="job-company">
              <span>{job.company_name}</span>
              <span>•</span>
              <span>{job.location}</span>
            </div>

            <div className="job-meta-grid">
              <div>
                <small>Salary</small>
                <strong>₹{job.salary_amount}/{job.salary_type}</strong>
              </div>

              <div>
                <small>Timing</small>
                <strong>{job.duration || "Flexible"}</strong>
              </div>

              <div>
                <small>Openings</small>
                <strong>{job.openings || 1}</strong>
              </div>
            </div>

            <p className="job-requirements">
              {job.requirements || "No requirements added."}
            </p>

            <div className="job-card-actions">
              <button className="btn" onClick={() => setEditingJob(job)}>
                Edit job
              </button>

              <button
                className="btn danger-btn"
                onClick={() => deleteJob(job)}
                disabled={deletingJobId === job.id}
              >
                {deletingJobId === job.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </section>

      {editingJob && (
        <div className="job-modal-backdrop" onClick={() => setEditingJob(null)}>
          <form className="job-modal edit-job-modal" onSubmit={saveJob} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="job-modal-close"
              onClick={() => setEditingJob(null)}
              aria-label="Close edit job"
            >
              ×
            </button>

            <span className="badge">Edit job</span>
            <h2>{editingJob.title}</h2>

            <div className="form">
              <label className="label">
                Job title
                <input
                  className="input"
                  value={editingJob.title}
                  onChange={(e) => updateEditField("title", e.target.value)}
                  required
                />
              </label>

              <label className="label">
                Company / shop name
                <input
                  className="input"
                  value={editingJob.company_name}
                  onChange={(e) => updateEditField("company_name", e.target.value)}
                  required
                />
              </label>

              <label className="label">
                Location
                <input
                  className="input"
                  value={editingJob.location}
                  onChange={(e) => updateEditField("location", e.target.value)}
                  required
                />
              </label>

              <div className="grid grid-2">
                <label className="label">
                  Job type
                  <input
                    className="input"
                    value={editingJob.job_type}
                    onChange={(e) => updateEditField("job_type", e.target.value)}
                  />
                </label>

                <label className="label">
                  Duration / timing
                  <input
                    className="input"
                    value={editingJob.duration ?? ""}
                    onChange={(e) => updateEditField("duration", e.target.value)}
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label className="label">
                  Salary type
                  <select
                    className="select"
                    value={editingJob.salary_type}
                    onChange={(e) =>
                      updateEditField(
                        "salary_type",
                        e.target.value as JobWithDetails["salary_type"]
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
                    type="number"
                    min={1}
                    value={editingJob.salary_amount}
                    onChange={(e) =>
                      updateEditField("salary_amount", Number(e.target.value))
                    }
                  />
                </label>
              </div>

              <label className="label">
                Requirements
                <textarea
                  className="textarea"
                  value={editingJob.requirements ?? ""}
                  onChange={(e) => updateEditField("requirements", e.target.value)}
                />
              </label>

              <label className="label">
                Responsibilities
                <textarea
                  className="textarea"
                  value={editingJob.responsibilities ?? ""}
                  onChange={(e) =>
                    updateEditField("responsibilities", e.target.value)
                  }
                />
              </label>

              <label className="label">
                Who can apply?
                <textarea
                  className="textarea"
                  value={editingJob.who_can_apply ?? ""}
                  onChange={(e) =>
                    updateEditField("who_can_apply", e.target.value)
                  }
                />
              </label>

              <label className="label">
                Benefits / perks
                <textarea
                  className="textarea"
                  value={editingJob.benefits ?? ""}
                  onChange={(e) => updateEditField("benefits", e.target.value)}
                />
              </label>

              <div className="grid grid-2">
                <label className="label">
                  Openings
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={editingJob.openings ?? 1}
                    onChange={(e) =>
                      updateEditField("openings", Number(e.target.value))
                    }
                  />
                </label>

                <label className="label">
                  Status
                  <select
                    className="select"
                    value={editingJob.status}
                    onChange={(e) =>
                      updateEditField(
                        "status",
                        e.target.value as JobWithDetails["status"]
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
                  value={editingJob.work_address ?? ""}
                  onChange={(e) => updateEditField("work_address", e.target.value)}
                />
              </label>

              <label className="label">
                Contact note
                <textarea
                  className="textarea"
                  value={editingJob.contact_note ?? ""}
                  onChange={(e) => updateEditField("contact_note", e.target.value)}
                />
              </label>

              <label
                className="label"
                style={{
                  display: "flex",
                  gridTemplateColumns: "auto 1fr",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={editingJob.is_premium}
                  onChange={(e) =>
                    updateEditField("is_premium", e.target.checked)
                  }
                />
                Mark as premium listing
              </label>

              <div className="job-modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditingJob(null)}
                >
                  Cancel
                </button>

                <button className="btn btn-primary" disabled={saving}>
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