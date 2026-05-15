"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job } from "@/lib/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((data ?? []) as Job[]);
  }

  async function apply(jobId: string) {
    setApplicationMessage("");

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

    if (error) {
      setApplicationMessage(error.message.includes("duplicate") ? "You already applied for this job." : error.message);
      return;
    }

    setApplicationMessage("Application submitted.");
  }

  return (
    <main className="container">
      <span className="badge">Open jobs</span>
      <h1>Browse part-time jobs.</h1>
      {message && <div className="notice error">{message}</div>}
      {applicationMessage && <div className="notice success">{applicationMessage}</div>}

      <section className="grid grid-2">
        {jobs.length === 0 && (
          <div className="card">
            <h3>No jobs yet</h3>
            <p>Post the first job from the Post Job page.</p>
          </div>
        )}

        {jobs.map((job) => (
          <article className="card" key={job.id}>
            <span className="tag">{job.is_premium ? "Premium" : "Open"}</span>
            <h2 style={{ marginTop: 12 }}>{job.title}</h2>
            <p><strong>{job.company_name}</strong> · {job.location}</p>
            <p>{job.job_type} · {job.duration || "Flexible"}</p>
            <p><strong>₹{job.salary_amount}</strong> / {job.salary_type}</p>
            <p>{job.requirements || "No extra requirements added."}</p>
            <button className="btn btn-primary" onClick={() => apply(job.id)}>Apply</button>
          </article>
        ))}
      </section>
    </main>
  );
}
