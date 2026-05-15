"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";

type ApplicationRow = {
  id: string;
  job_id: string;
  seeker_id: string;
  message: string | null;
  status: "applied" | "shortlisted" | "rejected" | "hired";
  created_at: string;
};

type ApplicationView = ApplicationRow & {
  job?: Job;
  seeker?: Profile;
};

export default function ApplicationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, []);

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

    const myProfile = profileData as Profile;
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

    const { data: jobData, error: jobError } = await jobsQuery.order("created_at", {
      ascending: false,
    });

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

    let seekers: Profile[] = [];

    if (seekerIds.length > 0) {
      const { data: seekerData, error: seekerError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", seekerIds);

      if (seekerError) {
        setMessage(seekerError.message);
        return;
      }

      seekers = (seekerData ?? []) as Profile[];
    }

    const finalData = appRows.map((app) => ({
      ...app,
      job: jobs.find((job) => job.id === app.job_id),
      seeker: seekers.find((seeker) => seeker.id === app.seeker_id),
    }));

    setApplications(finalData);
  }

  async function updateStatus(
    applicationId: string,
    status: "shortlisted" | "rejected" | "hired"
  ) {
    setMessage("");

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Application marked as ${status}.`);
    loadPage();
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
      <span className="badge">Applications</span>

      <h1>
        {profile?.role === "job_seeker"
          ? "Track your applications."
          : "Manage job applicants."}
      </h1>

      {message && <div className="notice">{message}</div>}

      {applications.length === 0 ? (
        <section className="card">
          <h3>No applications yet</h3>
          <p>
            {profile?.role === "job_seeker"
              ? "Apply to jobs from the Jobs page. Your status will appear here."
              : "When job seekers apply to your jobs, they will appear here."}
          </p>
        </section>
      ) : (
        <section className="grid">
          {applications.map((app) => (
            <article className="card" key={app.id}>
              <div className="grid grid-2">
                <div>
                  <span className="tag">{app.status}</span>

                  <h2 style={{ marginTop: 12 }}>
                    {app.job?.title || "Unknown job"}
                  </h2>

                  <p>
                    <strong>Company:</strong>{" "}
                    {app.job?.company_name || "Not available"}
                  </p>

                  <p>
                    <strong>Location:</strong>{" "}
                    {app.job?.location || "Not available"}
                  </p>

                  <p>
                    <strong>Salary:</strong>{" "}
                    {app.job
                      ? `₹${app.job.salary_amount}/${app.job.salary_type}`
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Message:</strong>{" "}
                    {app.message || "No message added."}
                  </p>
                </div>

                <div>
                  {profile?.role !== "job_seeker" ? (
                    <>
                      <h3>Applicant</h3>
                      <p>
                        <strong>Name:</strong>{" "}
                        {app.seeker?.full_name || "Unknown"}
                      </p>
                      <p>
                        <strong>Email:</strong>{" "}
                        {app.seeker?.email || "Not available"}
                      </p>
                      <p>
                        <strong>Skills:</strong>{" "}
                        {app.seeker?.skills || "Not added"}
                      </p>
                      <p>
                        <strong>Availability:</strong>{" "}
                        {app.seeker?.availability || "Not added"}
                      </p>
                      <p>
                        <strong>Expected salary:</strong>{" "}
                        {app.seeker?.expected_salary || "Not added"}
                      </p>

                      <div className="actions">
                        <button
                          className="btn"
                          onClick={() => updateStatus(app.id, "shortlisted")}
                        >
                          Shortlist
                        </button>
                        <button
                          className="btn"
                          onClick={() => updateStatus(app.id, "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => updateStatus(app.id, "hired")}
                        >
                          Hire
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>Your status</h3>
                      <p>
                        Your current application status is{" "}
                        <strong>{app.status}</strong>.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}