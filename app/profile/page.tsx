"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Tier, UserRole } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
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
      return;
    }

    setProfile(data as Profile);
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        role: profile.role,
        tier: profile.tier,
        occupation: profile.occupation,
        skills: profile.skills,
        availability: profile.availability,
        expected_salary: profile.expected_salary,
        company_name: profile.company_name,
      })
      .eq("id", profile.id);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated.");
  }

  if (!profile) {
    return <main className="container"><p>Loading profile...</p>{message && <div className="notice error">{message}</div>}</main>;
  }

  return (
    <main className="container">
      <section className="grid grid-2">
        <div>
          <span className="badge">Profile</span>
          <h1>Complete your profile.</h1>
          <p>Strong profiles get more trust. Add skill, availability, and salary details clearly.</p>
        </div>

        <form className="card form" onSubmit={save}>
          <label className="label">
            Full name
            <input className="input" value={profile.full_name} onChange={(e) => updateField("full_name", e.target.value)} required />
          </label>

          <label className="label">
            Role
            <select className="select" value={profile.role} onChange={(e) => updateField("role", e.target.value as UserRole)}>
              <option value="job_seeker">Job seeker</option>
              <option value="job_owner">Job owner</option>
              {profile.role === "admin" && <option value="admin">Admin</option>}
            </select>
          </label>

          <label className="label">
            Tier
            <select className="select" value={profile.tier} onChange={(e) => updateField("tier", e.target.value as Tier)}>
              <option value="beginner">Beginner</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label className="label">
            Occupation
            <input className="input" value={profile.occupation ?? ""} onChange={(e) => updateField("occupation", e.target.value)} />
          </label>

          <label className="label">
            Skills
            <textarea className="textarea" value={profile.skills ?? ""} onChange={(e) => updateField("skills", e.target.value)} />
          </label>

          <label className="label">
            Availability
            <input className="input" value={profile.availability ?? ""} onChange={(e) => updateField("availability", e.target.value)} placeholder="Example: 4pm to 8pm" />
          </label>

          <label className="label">
            Expected salary
            <input className="input" value={profile.expected_salary ?? ""} onChange={(e) => updateField("expected_salary", e.target.value)} placeholder="Example: ₹500/day" />
          </label>

          <label className="label">
            Company name
            <input className="input" value={profile.company_name ?? ""} onChange={(e) => updateField("company_name", e.target.value)} />
          </label>

          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
          {message && <div className={`notice ${message.includes("updated") ? "success" : "error"}`}>{message}</div>}
        </form>
      </section>
    </main>
  );
}
