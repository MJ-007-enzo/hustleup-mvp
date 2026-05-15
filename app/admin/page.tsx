"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile, Tier, WaitlistItem } from "@/lib/types";

type UpgradedProfile = Profile & {
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  is_verified?: boolean | null;
};

export default function AdminPage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [users, setUsers] = useState<UpgradedProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAdmin();
  }, []);

  const verifiedUsers = useMemo(() => {
    return users.filter((user) => user.is_verified).length;
  }, [users]);

  function profileCompletion(user: UpgradedProfile) {
    const fields = [
      user.full_name,
      user.email,
      user.occupation,
      user.skills,
      user.availability,
      user.expected_salary,
      user.location,
      user.phone,
      user.bio,
      user.experience,
    ];

    const filled = fields.filter((field) => field && field.trim().length > 0).length;

    return Math.round((filled / fields.length) * 100);
  }

  async function loadAdmin() {
    setLoading(true);
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
      setLoading(false);
      return;
    }

    const myProfile = profileData as UpgradedProfile;
    setProfile(myProfile);

    if (myProfile?.role !== "admin") {
      setLoading(false);
      return;
    }

    const [{ data: waitlistData }, { data: userData }, { data: jobData }] =
      await Promise.all([
        supabase.from("waitlist").select("*").order("score", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      ]);

    setWaitlist((waitlistData ?? []) as WaitlistItem[]);
    setUsers((userData ?? []) as UpgradedProfile[]);
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

  async function upgradeUser(id: string, tier: Tier) {
    setUpdatingUserId(id);

    const { error } = await supabase.from("profiles").update({ tier }).eq("id", id);

    setUpdatingUserId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`User upgraded to ${tier}.`);
    loadAdmin();
  }

  async function toggleVerified(user: UpgradedProfile) {
    setUpdatingUserId(user.id);

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !user.is_verified })
      .eq("id", user.id);

    setUpdatingUserId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      user.is_verified
        ? `${user.full_name || user.email} is now unverified.`
        : `${user.full_name || user.email} is now verified.`
    );

    loadAdmin();
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading admin...</p>
      </main>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="container">
        <span className="badge">Admin</span>
        <h1>Access blocked.</h1>
        <p>Your current role is <strong>{profile?.role}</strong>.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="admin-hero">
        <div>
          <span className="badge">Admin Control</span>
          <h1>Run HustleUp.</h1>
          <p className="hero-copy">
            Manage waitlist, users, tiers, verification status, jobs, and platform quality.
          </p>
        </div>

        <div className="jobs-summary-card">
          <span className="tag">Verified users</span>
          <div className="stat">{verifiedUsers}</div>
          <p>trusted profiles marked by admin</p>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="grid grid-3">
        <div className="card">
          <p>Waitlist</p>
          <div className="stat">{waitlist.length}</div>
        </div>

        <div className="card">
          <p>Users</p>
          <div className="stat">{users.length}</div>
        </div>

        <div className="card">
          <p>Jobs</p>
          <div className="stat">{jobs.length}</div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Users & verification</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Profile</th>
                <th>Verified</th>
                <th>Tier action</th>
                <th>Verify action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name || "Unnamed user"}</strong>
                    <br />
                    <span>{user.email}</span>
                  </td>

                  <td>{user.role}</td>

                  <td>{user.tier}</td>

                  <td>
                    <div className="admin-profile-score">
                      <strong>{profileCompletion(user)}%</strong>
                      <div className="profile-score-bar">
                        <div style={{ width: `${profileCompletion(user)}%` }} />
                      </div>
                    </div>
                  </td>

                  <td>
                    {user.is_verified ? (
                      <span className="verified-badge">Verified</span>
                    ) : (
                      <span className="unverified-badge">Not verified</span>
                    )}
                  </td>

                  <td>
                    <div className="admin-action-row">
                      <button
                        className="btn"
                        onClick={() => upgradeUser(user.id, "basic")}
                        disabled={updatingUserId === user.id}
                      >
                        Basic
                      </button>

                      <button
                        className="btn"
                        onClick={() => upgradeUser(user.id, "premium")}
                        disabled={updatingUserId === user.id}
                      >
                        Premium
                      </button>

                      <button
                        className="btn"
                        onClick={() => upgradeUser(user.id, "advanced")}
                        disabled={updatingUserId === user.id}
                      >
                        Advanced
                      </button>
                    </div>
                  </td>

                  <td>
                    <button
                      className={user.is_verified ? "btn danger-btn" : "btn btn-primary"}
                      onClick={() => toggleVerified(user)}
                      disabled={updatingUserId === user.id}
                    >
                      {updatingUserId === user.id
                        ? "Updating..."
                        : user.is_verified
                        ? "Unverify"
                        : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                    <div className="admin-action-row">
                      <button
                        className="btn"
                        onClick={() => updateWaitlist(item.id, "approved")}
                      >
                        Approve
                      </button>

                      <button
                        className="btn danger-btn"
                        onClick={() => updateWaitlist(item.id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
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