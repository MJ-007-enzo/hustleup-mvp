"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job } from "@/lib/types";

type JobWithDetails = Job & {
  responsibilities?: string | null;
  who_can_apply?: string | null;
  benefits?: string | null;
  openings?: number | null;
  work_address?: string | null;
  contact_note?: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [message, setMessage] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);

useEffect(() => {
  loadJobs();
  async function loadAppliedJobs() {
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    setAppliedJobIds(new Set());
    return;
  }

  const { data, error } = await supabase
    .from("applications")
    .select("job_id")
    .eq("seeker_id", authData.user.id);

  if (error) {
    return;
  }

  setAppliedJobIds(new Set((data ?? []).map((item) => item.job_id)));
}
  loadAppliedJobs();
}, []);

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((data ?? []) as JobWithDetails[]);
  }

  async function apply(jobId: string) {
    if (appliedJobIds.has(jobId)) {
  setApplicationMessage("You already applied for this job.");
  return;
}
    setApplicationMessage("");
    setApplyingJobId(jobId);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      seeker_id: authData.user.id,
      message: "I am interested in this opportunity.",
      status: "applied",
    });

    setApplyingJobId(null);

   if (error) {
  if (error.message.includes("duplicate")) {
    setAppliedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });

    setApplicationMessage("You already applied for this job.");
  } else {
    setApplicationMessage(error.message);
  }

  return;
}

  setAppliedJobIds((prev) => {
  const next = new Set(prev);
  next.add(jobId);
  return next;
});

setApplicationMessage("Application submitted successfully.");
setSelectedJob(null);
  }

  function salaryLabel(job: JobWithDetails) {
    return `₹${job.salary_amount}/${job.salary_type}`;
  }

  function detailText(value?: string | null) {
    return value && value.trim().length > 0 ? value : "Not added by the job owner.";
  }

  return (
    <main className="container">
      <section className="jobs-hero">
        <div>
          <span className="badge">Open opportunities</span>
          <h1>Browse part-time jobs.</h1>
          <p className="hero-copy">
            Find local, flexible work opportunities. Premium listings appear
            first so serious seekers can discover better jobs faster.
          </p>
        </div>

        <div className="jobs-summary-card">
          <span className="tag">Live marketplace</span>
          <div className="stat">{jobs.length}</div>
          <p>open job{jobs.length === 1 ? "" : "s"} available now</p>
        </div>
      </section>

      {message && <div className="notice error">{message}</div>}

      {applicationMessage && (
        <div
          className={`notice ${
            applicationMessage.includes("successfully") ? "success" : "error"
          }`}
        >
          {applicationMessage}
        </div>
      )}

      <section className="jobs-toolbar">
        <div>
          <h2>Available jobs</h2>
          <p>
            Showing <strong>{jobs.length}</strong> active listing
            {jobs.length === 1 ? "" : "s"}.
          </p>
        </div>
      </section>

      <section className="jobs-grid">
        {jobs.length === 0 && (
          <div className="card empty-jobs-card">
            <span className="tag">No listings yet</span>
            <h3>No jobs available right now.</h3>
            <p>
              Once job owners post opportunities, they will appear here. Add one
              or two polished jobs from a job owner account for demo.
            </p>
          </div>
        )}

        {jobs.map((job) => (
          <article
            className={`job-card ${job.is_premium ? "job-card-premium" : ""}`}
            key={job.id}
          >
            <div className="job-card-top">
              <span className={job.is_premium ? "premium-pill" : "open-pill"}>
                {job.is_premium ? "Premium" : "Open"}
              </span>

              <span className="job-date">
                {new Date(job.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>

            <h2>{job.title}</h2>

            <div className="job-company">
              <span>{job.company_name}</span>
              <span>•</span>
              <span>{job.location}</span>
            </div>

            <div className="job-meta-grid">
              <div>
                <small>Job type</small>
                <strong>{job.job_type}</strong>
              </div>

              <div>
                <small>Timing</small>
                <strong>{job.duration || "Flexible"}</strong>
              </div>

              <div>
                <small>Salary</small>
                <strong>{salaryLabel(job)}</strong>
              </div>
            </div>

            <p className="job-requirements">
              {job.requirements || "Tap View details to see full job information."}
            </p>

            <div className="job-card-actions">
              <button className="btn" onClick={() => setSelectedJob(job)}>
                View details
              </button>

            <button
  className="btn btn-primary"
  onClick={() => apply(job.id)}
  disabled={applyingJobId === job.id || appliedJobIds.has(job.id)}
>
  {appliedJobIds.has(job.id)
    ? "Applied"
    : applyingJobId === job.id
    ? "Applying..."
    : "Apply now"}
</button>
            </div>
          </article>
        ))}
      </section>

      {selectedJob && (
        <div className="job-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="job-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="job-modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close job details"
            >
              ×
            </button>

            <div className="job-modal-top">
              <span
                className={selectedJob.is_premium ? "premium-pill" : "open-pill"}
              >
                {selectedJob.is_premium ? "Premium" : "Open"}
              </span>

              <span className="job-date">
                Posted{" "}
                {new Date(selectedJob.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h2>{selectedJob.title}</h2>

            <p className="job-modal-company">
              <strong>{selectedJob.company_name}</strong> · {selectedJob.location}
            </p>

            <div className="job-modal-grid">
              <div>
                <small>Job type</small>
                <strong>{selectedJob.job_type}</strong>
              </div>

              <div>
                <small>Timing</small>
                <strong>{selectedJob.duration || "Flexible"}</strong>
              </div>

              <div>
                <small>Salary</small>
                <strong>{salaryLabel(selectedJob)}</strong>
              </div>

              <div>
                <small>Openings</small>
                <strong>{selectedJob.openings || 1}</strong>
              </div>

              <div>
                <small>Area</small>
                <strong>{selectedJob.work_address || selectedJob.location}</strong>
              </div>

              <div>
                <small>Status</small>
                <strong>{selectedJob.status}</strong>
              </div>
            </div>

            <div className="job-modal-section">
              <h3>Requirements</h3>
              <p>{detailText(selectedJob.requirements)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Responsibilities</h3>
              <p>{detailText(selectedJob.responsibilities)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Who can apply?</h3>
              <p>{detailText(selectedJob.who_can_apply)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Benefits / perks</h3>
              <p>{detailText(selectedJob.benefits)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Work address</h3>
              <p>{detailText(selectedJob.work_address)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Contact note</h3>
              <p>{detailText(selectedJob.contact_note)}</p>
            </div>

            <div className="job-modal-actions">
              <button className="btn" onClick={() => setSelectedJob(null)}>
                Close
              </button>

             <button
  className="btn btn-primary"
  onClick={() => apply(selectedJob.id)}
  disabled={applyingJobId === selectedJob.id || appliedJobIds.has(selectedJob.id)}
>
  {appliedJobIds.has(selectedJob.id)
    ? "Applied"
    : applyingJobId === selectedJob.id
    ? "Applying..."
    : "Apply for this job"}
</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}