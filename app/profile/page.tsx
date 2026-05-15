"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type SalaryPeriod = "hour" | "day" | "week" | "month";

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

const timeOptions = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
];

const tamilNaduCities = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Salem",
  "Erode",
  "Tiruppur",
  "Vellore",
  "Thanjavur",
  "Dindigul",
  "Tirunelveli",
  "Thoothukudi",
  "Nagercoil",
  "Kanchipuram",
  "Chengalpattu",
  "Tambaram",
  "Avadi",
  "Hosur",
  "Krishnagiri",
  "Dharmapuri",
  "Namakkal",
  "Karur",
  "Perambalur",
  "Ariyalur",
  "Cuddalore",
  "Villupuram",
  "Kallakurichi",
  "Tiruvannamalai",
  "Ranipet",
  "Tirupattur",
  "Mayiladuthurai",
  "Nagapattinam",
  "Tiruvarur",
  "Pudukkottai",
  "Sivaganga",
  "Ramanathapuram",
  "Virudhunagar",
  "Tenkasi",
  "Ooty",
];

function cleanCityName(value: string) {
  const cleanedValue = value.trim();

  const match = tamilNaduCities.find(
    (city) => city.toLowerCase() === cleanedValue.toLowerCase()
  );

  return match || cleanedValue;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [skills, setSkills] = useState("");

  const [startTime, setStartTime] = useState("5:00 PM");
  const [endTime, setEndTime] = useState("10:00 PM");

  const [salaryAmount, setSalaryAmount] = useState(500);
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("day");

  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [availabilityMotion, setAvailabilityMotion] = useState(false);
  const [salaryMotion, setSalaryMotion] = useState(false);

  const availability = `${startTime} to ${endTime}`;
  const expectedSalary = `₹${salaryAmount}/${salaryPeriod}`;

  const citySuggestions = useMemo(() => {
    const query = location.trim().toLowerCase();

    if (!query) {
      return tamilNaduCities;
    }

    return tamilNaduCities.filter((city) =>
      city.toLowerCase().includes(query)
    );
  }, [location]);

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

  function triggerAvailabilityMotion() {
    setAvailabilityMotion(false);
    setTimeout(() => setAvailabilityMotion(true), 10);
    setTimeout(() => setAvailabilityMotion(false), 350);
  }

  function triggerSalaryMotion() {
    setSalaryMotion(false);
    setTimeout(() => setSalaryMotion(true), 10);
    setTimeout(() => setSalaryMotion(false), 350);
  }

  function completionLabel() {
    if (completion >= 90) return "Excellent";
    if (completion >= 70) return "Strong";
    if (completion >= 45) return "Average";
    return "Incomplete";
  }

  function parseAvailability(value?: string | null) {
    if (!value) return;

    const parts = value.split(/to/i).map((part) => part.trim());

    if (parts[0]) {
      const matchedStart = timeOptions.find(
        (time) => time.toLowerCase() === parts[0].toLowerCase()
      );

      if (matchedStart) {
        setStartTime(matchedStart);
      }
    }

    if (parts[1]) {
      const matchedEnd = timeOptions.find(
        (time) => time.toLowerCase() === parts[1].toLowerCase()
      );

      if (matchedEnd) {
        setEndTime(matchedEnd);
      }
    }
  }

  function parseExpectedSalary(value?: string | null) {
    if (!value) return;

    const amountMatch = value.match(/\d+/);

    if (amountMatch) {
      setSalaryAmount(Number(amountMatch[0]));
    }

    const lowerValue = value.toLowerCase();

    if (lowerValue.includes("hour")) {
      setSalaryPeriod("hour");
    } else if (lowerValue.includes("week")) {
      setSalaryPeriod("week");
    } else if (lowerValue.includes("month")) {
      setSalaryPeriod("month");
    } else {
      setSalaryPeriod("day");
    }
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
    setLocation(cleanCityName(profileData.location || ""));
    setPhone(profileData.phone || "");
    setBio(profileData.bio || "");
    setExperience(profileData.experience || "");
    setPortfolioUrl(profileData.portfolio_url || "");

    parseAvailability(profileData.availability);
    parseExpectedSalary(profileData.expected_salary);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

    if (!profile) return;

    const cleanedLocation = cleanCityName(location);

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
        location: cleanedLocation,
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

    setLocation(cleanedLocation);
    setMessage("Profile updated successfully.");
    loadProfile();
  }

  function changeSalaryAmount(type: "increase" | "decrease") {
    triggerSalaryMotion();

    setSalaryAmount((prev) => {
      if (type === "decrease") {
        return Math.max(50, prev - 50);
      }

      return prev + 50;
    });
  }

  function selectCity(city: string) {
    setLocation(city);
    setCityDropdownOpen(false);
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

            <div>
              <small>Availability</small>
              <strong>{availability}</strong>
            </div>

            <div>
              <small>Expected salary</small>
              <strong>{expectedSalary}</strong>
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
            <h3>Experience</h3>
            <p>{experience || "Add your previous experience or proof."}</p>
          </div>
        </aside>

        <form className="card form" onSubmit={saveProfile}>
          <span className="tag">Basic details</span>

          <label className="label">
            Full name
            <input
              className="input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Example: Krishna Kumar"
            />
          </label>

          <label className="label">
            Occupation
            <input
              className="input"
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
              placeholder="Example: College student, fresher, cafe owner"
            />
          </label>

          <div className="grid grid-2">
            <label
              className="label"
              style={{
                position: "relative",
                overflow: "visible",
                zIndex: cityDropdownOpen ? 500 : 1,
              }}
            >
              Location
              <input
                className="input"
                value={location}
                onFocus={() => setCityDropdownOpen(true)}
                onClick={() => setCityDropdownOpen(true)}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setCityDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setLocation((prev) => cleanCityName(prev));
                    setCityDropdownOpen(false);
                  }, 180);
                }}
                placeholder="Search or select your city"
              />

              {cityDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "74px",
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    maxHeight: "240px",
                    overflowY: "auto",
                    border: "1px solid var(--line-warm)",
                    borderRadius: "16px",
                    background: "#ffffff",
                    boxShadow: "0 24px 60px rgba(17, 24, 39, 0.18)",
                    padding: "8px",
                  }}
                >
                  {citySuggestions.length > 0 ? (
                    citySuggestions.map((city) => (
                      <button
                        type="button"
                        key={city}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectCity(city);
                        }}
                        style={{
                          width: "100%",
                          display: "block",
                          textAlign: "left",
                          border: 0,
                          background:
                            city.toLowerCase() === location.trim().toLowerCase()
                              ? "var(--brand-soft)"
                              : "transparent",
                          color: "var(--premium)",
                          borderRadius: "12px",
                          padding: "12px",
                          fontWeight: 850,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontSize: "14px",
                        }}
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "12px",
                        color: "var(--muted)",
                        fontWeight: 750,
                      }}
                    >
                      No city found. You can type manually.
                    </div>
                  )}
                </div>
              )}
            </label>

            <label className="label">
              Phone
              <input
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Example: +91 98765 43210"
              />
            </label>
          </div>

          <label className="label">
            Short bio
            <textarea
              className="textarea"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Example: I am a 3rd year student looking for evening part-time work."
            />
          </label>

          <span className="tag">Work profile</span>

          <label className="label">
            Skills
            <textarea
              className="textarea"
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="Example: customer handling, MS Excel, sales, typing, communication"
            />
          </label>

          <label className="label">
            Experience
            <textarea
              className="textarea"
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              placeholder="Example: 2 months cafe helper experience, college event volunteering"
            />
          </label>

          <div className="profile-control-grid">
            <label className="label">
              Availability
              <div
                className={`availability-picker ${
                  availabilityMotion ? "profile-control-pop" : ""
                }`}
              >
                <select
                  className="select"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    triggerAvailabilityMotion();
                  }}
                >
                  {timeOptions.map((time) => (
                    <option value={time} key={time}>
                      {time}
                    </option>
                  ))}
                </select>

                <span>to</span>

                <select
                  className="select"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    triggerAvailabilityMotion();
                  }}
                >
                  {timeOptions.map((time) => (
                    <option value={time} key={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="label">
              Expected salary
              <div
                className={`salary-picker ${
                  salaryMotion ? "profile-control-pop" : ""
                }`}
              >
                <span className="currency-chip">₹</span>

                <button
                  type="button"
                  className="salary-stepper"
                  onClick={() => changeSalaryAmount("decrease")}
                >
                  −
                </button>

                <input
                  className="salary-input"
                  type="number"
                  min={50}
                  step={50}
                  value={salaryAmount}
                  onChange={(event) => {
                    setSalaryAmount(Number(event.target.value));
                    triggerSalaryMotion();
                  }}
                />

                <button
                  type="button"
                  className="salary-stepper"
                  onClick={() => changeSalaryAmount("increase")}
                >
                  +
                </button>

                <select
                  className="salary-period-select"
                  value={salaryPeriod}
                  onChange={(event) => {
                    setSalaryPeriod(event.target.value as SalaryPeriod);
                    triggerSalaryMotion();
                  }}
                >
                  <option value="hour">/hour</option>
                  <option value="day">/day</option>
                  <option value="week">/week</option>
                  <option value="month">/month</option>
                </select>
              </div>
            </label>
          </div>

          <label className="label">
            Portfolio / proof link
            <input
              className="input"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
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