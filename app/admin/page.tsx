"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile, WaitlistItem } from "@/lib/types";

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    const myProfile = profileData as Profile;
    setProfile(myProfile);

    if (myProfile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const [{ data: waitlistData }, { data: userData }, { data: jobData }] = await Promise.all([
      supabase.from("waitlist").select("*").order("score", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    ]);

    setWaitlist((waitlistData ?? []) as WaitlistItem[]);
    setUsers((userData ?? []) as Profile[]);
    setJobs((jobData ?? []) as Job[]);
    setLoading(false);
  }

  async function updateWaitlist(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("waitlist").update({ status }).eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Waitlist user ${status}.`);
    loadAdmin();
  }

  async function upgradeUser(id: string, tier: "basic" | "premium" | "advanced") {
    const { error } = await supabase.from("profiles").update({ tier }).eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`User upgraded to ${tier}.`);
    loadAdmin();
  }

  if (loading) {
    return <main className="container"><p>Loading admin...</p></main>;
  }

  if (profile?.role !== "admin") {
    return (
      <main className="container">
        <span className="badge">Admin</span>
        <h1>Access blocked.</h1>
        <p>Your current role is <strong>{profile?.role}</strong>. Make yourself admin from Supabase SQL first.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <span className="badge">Admin Control</span>
      <h1>Run HustleUp.</h1>
      {message && <div className="notice">{message}</div>}

      <section className="grid grid-3">
        <div className="card"><p>Waitlist</p><div className="stat">{waitlist.length}</div></div>
        <div className="card"><p>Users</p><div className="stat">{users.length}</div></div>
        <div className="card"><p>Jobs</p><div className="stat">{jobs.length}</div></div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Waitlist</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((item) => (
                <tr key={item.id}>
                  <td>{item.full_name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.score}</td>
                  <td>{item.status}</td>
                  <td>
                    <button className="btn" onClick={() => updateWaitlist(item.id, "approved")}>Approve</button>{" "}
                    <button className="btn" onClick={() => updateWaitlist(item.id, "rejected")}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Users</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Upgrade</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.tier}</td>
                  <td>
                    <button className="btn" onClick={() => upgradeUser(user.id, "basic")}>Basic</button>{" "}
                    <button className="btn" onClick={() => upgradeUser(user.id, "premium")}>Premium</button>{" "}
                    <button className="btn" onClick={() => upgradeUser(user.id, "advanced")}>Advanced</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Jobs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.company_name}</td>
                  <td>{job.location}</td>
                  <td>₹{job.salary_amount}/{job.salary_type}</td>
                  <td>{job.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
