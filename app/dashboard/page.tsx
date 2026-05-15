"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const userId = authData.user.id;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const myProfile = profileData as Profile;
    setProfile(myProfile);

    if (myProfile.role === "admin") {
      const [{ count: users }, { count: jobs }, { count: apps }, { count: waitlist }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("jobs").select("*", { count: "exact", head: true }),
          supabase.from("applications").select("*", { count: "exact", head: true }),
          supabase.from("waitlist").select("*", { count: "exact", head: true }),
        ]);

      setUserCount(users ?? 0);
      setJobCount(jobs ?? 0);
      setApplicationCount(apps ?? 0);
      setWaitlistCount(waitlist ?? 0);
    }

    if (myProfile.role === "job_owner") {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("owner_id", userId);

      const ownerJobIds = jobs?.map((job) => job.id) ?? [];
      setJobCount(ownerJobIds.length);

      if (ownerJobIds.length > 0) {
        const { count: apps } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", ownerJobIds);

        setApplicationCount(apps ?? 0);
      }
    }

    if (myProfile.role === "job_seeker") {
      const { count: apps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("seeker_id", userId);

      setApplicationCount(apps ?? 0);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <span className="badge">Dashboard</span>

      <h1>Hello, {profile?.full_name || "Hustler"}.</h1>

      {profile?.role === "admin" && (
        <>
          <section className="grid grid-3">
            <div className="card">
              <p>Total users</p>
              <div className="stat">{userCount}</div>
            </div>

            <div className="card">
              <p>Total jobs</p>
              <div className="stat">{jobCount}</div>
            </div>

            <div className="card">
              <p>Applications</p>
              <div className="stat">{applicationCount}</div>
            </div>

            <div className="card">
              <p>Waitlist</p>
              <div className="stat">{waitlistCount}</div>
            </div>

            <div className="card">
              <p>Your tier</p>
              <div className="stat">{profile.tier}</div>
            </div>

            <div className="card">
              <p>Your role</p>
              <div className="stat">admin</div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 18 }}>
            <h2>Admin actions</h2>
            <div className="actions">
              <Link className="btn btn-primary" href="/admin">
                Open admin panel
              </Link>
              <Link className="btn" href="/applications">
                Manage applications
              </Link>
              <Link className="btn" href="/jobs">
                View jobs
              </Link>
            </div>
          </section>
        </>
      )}

      {profile?.role === "job_owner" && (
        <>
          <section className="grid grid-3">
            <div className="card">
              <p>Jobs posted</p>
              <div className="stat">{jobCount}</div>
            </div>

            <div className="card">
              <p>Applications received</p>
              <div className="stat">{applicationCount}</div>
            </div>

            <div className="card">
              <p>Tier</p>
              <div className="stat">{profile.tier}</div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 18 }}>
            <h2>Owner actions</h2>
            <div className="actions">
              <Link className="btn btn-primary" href="/post-job">
                Post a job
              </Link>
              <Link className="btn" href="/applications">
                View applicants
              </Link>
              <Link className="btn" href="/profile">
                Complete company profile
              </Link>
            </div>
          </section>
        </>
      )}

      {profile?.role === "job_seeker" && (
        <>
          <section className="grid grid-3">
            <div className="card">
              <p>Applications sent</p>
              <div className="stat">{applicationCount}</div>
            </div>

            <div className="card">
              <p>Tier</p>
              <div className="stat">{profile.tier}</div>
            </div>

            <div className="card">
              <p>Role</p>
              <div className="stat">seeker</div>
            </div>
          </section>

          <section className="card" style={{ marginTop: 18 }}>
            <h2>Seeker actions</h2>
            <div className="actions">
              <Link className="btn btn-primary" href="/jobs">
                Browse jobs
              </Link>
              <Link className="btn" href="/applications">
                Track applications
              </Link>
              <Link className="btn" href="/profile">
                Improve profile
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}