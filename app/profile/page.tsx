"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type UpgradedProfile = Profile & {
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  is_verified?: boolean | null;
};

const profileFields = [
  "full_name",
  "email",
  "occupation",
  "skills",
  "availability",
  "expected_salary",
  "location",
  "phone",
  "bio",
  "experience",
] as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const completion = useMemo(() => {
    const values = {
      full_name: fullName,
      email: profile?.email || "",
      occupation,
      skills,
      availability,
      expected_salary: expectedSalary,
      location,
      phone,
      bio,
      experience,
    };

    const filled = profileFields.filter((field) => {
      const value = values[field];
      return value && value.trim().length > 0;
    }).length;

    return Math.round((filled / profileFields.length) * 100);
  }, [
    fullName,
    occupation,
    skills,
    availability,
    expectedSalary,
    location,
    phone,
    bio,
    experience,
    profile?.email,
  ]);

  function completionLabel() {
    if (completion >= 90) return "Excellent";
    if (completion >= 70) return "Strong";
    if (completion >= 45) return "Average";
    return "Incomplete";
  }

  async function loadProfile() {
    setLoading(true);

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

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const profileData = data as UpgradedProfile;
    setProfile(profileData);

    setFullName(profileData.full_name || "");
    setOccupation(profileData.occupation || "");
    setSkills(profileData.skills || "");
    setAvailability(profileData.availability || "");
    setExpectedSalary(profileData.expected_salary || "");
    setLocation(profileData.location || "");
    setPhone(profileData.phone || "");
    setBio(profileData.bio || "");
    setExperience(profileData.experience || "");
    setPortfolioUrl(profileData.portfolio_url || "");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

    if (!profile) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        occupation,
        skills,
        availability,
        expected_salary: expectedSalary,
        location,
        phone,
        bio,
        experience,
        portfolio_url: portfolioUrl,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated successfully.");
    loadProfile();
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="profile-hero">
        <div>
          <span className="badge">Profile</span>
          <h1>Build a stronger HustleUp profile.</h1>
          <p className="hero-copy">
            A complete profile helps job owners trust you faster. Add your
            skills, availability, experience, and contact details.
          </p>
        </div>

        <div className="profile-score-card">
          <div className="profile-score-ring">
            <span>{completion}%</span>
          </div>

          <div>
            <span className="tag">{completionLabel()} profile</span>
            <h3>Profile completion</h3>
            <p>
              {completion >= 80
                ? "Your profile looks strong for applications."
                : "Complete more fields to improve your chances."}
            </p>
          </div>
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

      <section className="grid grid-2 profile-layout">
        <aside className="profile-preview-card">
          <div className="profile-avatar-large">
            {(fullName || profile?.email || "U").slice(0, 1).toUpperCase()}
          </div>

          <div>
            <div className="profile-title-row">
              <h2>{fullName || "Unnamed user"}</h2>
              {profile?.is_verified && (
                <span className="verified-badge">Verified</span>
              )}
            </div>

            <p>{profile?.email}</p>
          </div>

          <div className="profile-mini-grid">
            <div>
              <small>Role</small>
              <strong>{profile?.role}</strong>
            </div>

            <div>
              <small>Tier</small>
              <strong>{profile?.tier}</strong>
            </div>

            <div>
              <small>Occupation</small>
              <strong>{occupation || "Not added"}</strong>
            </div>

            <div>
              <small>Location</small>
              <strong>{location || "Not added"}</strong>
            </div>
          </div>

          <div className="profile-preview-section">
            <h3>Bio</h3>
            <p>{bio || "Add a short bio to introduce yourself."}</p>
          </div>

          <div className="profile-preview-section">
            <h3>Skills</h3>
            <p>{skills || "Add your strongest skills."}</p>
          </div>

          <div className="profile-preview-section">
            <h3>Availability</h3>
            <p>{availability || "Add your available timing."}</p>
          </div>
        </aside>

        <form className="card form" onSubmit={saveProfile}>
          <span className="tag">Basic details</span>

          <label className="label">
            Full name
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Example: Krishna Kumar"
            />
          </label>

          <label className="label">
            Occupation
            <input
              className="input"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Example: College student, fresher, cafe owner"
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Location
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Example: Trichy"
              />
            </label>

            <label className="label">
              Phone
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Example: +91 98765 43210"
              />
            </label>
          </div>

          <label className="label">
            Short bio
            <textarea
              className="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Example: I am a 3rd year student looking for evening part-time work."
            />
          </label>

          <span className="tag">Work profile</span>

          <label className="label">
            Skills
            <textarea
              className="textarea"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Example: customer handling, MS Excel, sales, typing, communication"
            />
          </label>

          <label className="label">
            Experience
            <textarea
              className="textarea"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Example: 2 months cafe helper experience, college event volunteering"
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Availability
              <input
                className="input"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="Example: 5pm to 9pm"
              />
            </label>

            <label className="label">
              Expected salary
              <input
                className="input"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="Example: ₹500/day"
              />
            </label>
          </div>

          <label className="label">
            Portfolio / proof link
            <input
              className="input"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="Example: LinkedIn, resume, portfolio link"
            />
          </label>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>
    </main>
  );
}