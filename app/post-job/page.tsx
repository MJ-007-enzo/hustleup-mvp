"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function PostJobPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Part-time");
  const [duration, setDuration] = useState("");
  const [salaryType, setSalaryType] = useState<"hour" | "day" | "week" | "month">("day");
  const [salaryAmount, setSalaryAmount] = useState(500);
  const [requirements, setRequirements] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (error) {
      setMessage(error.message);
      setCheckingAccess(false);
      return;
    }

    setProfile(data as Profile);
    setCheckingAccess(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    if (profile?.role !== "job_owner" && profile?.role !== "admin") {
      setMessage("Only job owners and admins can post jobs.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      owner_id: authData.user.id,
      title,
      company_name: companyName,
      location,
      job_type: jobType,
      duration,
      salary_type: salaryType,
      salary_amount: salaryAmount,
      requirements,
      is_premium: isPremium,
      status: "open",
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setCompanyName("");
    setLocation("");
    setDuration("");
    setRequirements("");
    setIsPremium(false);
    setMessage("Job posted successfully.");
  }

  if (checkingAccess) {
    return (
      <main className="container">
        <p>Checking access...</p>
      </main>
    );
  }

  if (profile?.role !== "job_owner" && profile?.role !== "admin") {
    return (
      <main className="container">
        <span className="badge">Access blocked</span>
        <h1>You cannot post jobs.</h1>
        <p>
          Your current role is <strong>{profile?.role}</strong>. Only job owners
          and admins can post jobs.
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
      <section className="grid grid-2">
        <div>
          <span className="badge">For job owners</span>
          <h1>Post a part-time job.</h1>
          <p>
            Add clear salary, location, timing, and requirements. Premium jobs
            appear with a stronger badge.
          </p>
        </div>

        <form className="card form" onSubmit={submit}>
          <label className="label">
            Job title
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="label">
            Company / shop name
            <input
              className="input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </label>

          <label className="label">
            Location
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Example: Trichy, Tamil Nadu"
              required
            />
          </label>

          <label className="label">
            Job type
            <input
              className="input"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              required
            />
          </label>

          <label className="label">
            Duration / timing
            <input
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Example: 5pm to 9pm"
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Salary type
              <select
                className="select"
                value={salaryType}
                onChange={(e) =>
                  setSalaryType(e.target.value as "hour" | "day" | "week" | "month")
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
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(Number(e.target.value))}
                required
              />
            </label>
          </div>

          <label className="label">
            Requirements
            <textarea
              className="textarea"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
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
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Mark as premium listing
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Posting..." : "Post job"}
          </button>

          {message && (
            <div className={`notice ${message.includes("success") ? "success" : "error"}`}>
              {message}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}