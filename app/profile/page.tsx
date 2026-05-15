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

type DropdownKey = "city" | "startTime" | "endTime" | "salaryPeriod" | null;

type DropdownOption = {
  label: string;
  value: string;
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

const salaryPeriodOptions: DropdownOption[] = [
  { label: "/hour", value: "hour" },
  { label: "/day", value: "day" },
  { label: "/week", value: "week" },
  { label: "/month", value: "month" },
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

const timeDropdownOptions: DropdownOption[] = timeOptions.map((time) => ({
  label: time,
  value: time,
}));

function cleanCityName(value: string) {
  const cleanedValue = value.trim();

  const match = tamilNaduCities.find(
    (city) => city.toLowerCase() === cleanedValue.toLowerCase()
  );

  return match || cleanedValue;
}

function cleanSalaryInput(value: string) {
  const numbersOnly = value.replace(/\D/g, "");

  if (!numbersOnly) {
    return "";
  }

  return numbersOnly.replace(/^0+(?=\d)/, "");
}

function getNumberFromSalaryText(value: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [skills, setSkills] = useState("");

  const [startTime, setStartTime] = useState("5:00 PM");
  const [endTime, setEndTime] = useState("10:00 PM");

  const [salaryText, setSalaryText] = useState("500");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("day");

  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [availabilityMotion, setAvailabilityMotion] = useState(false);
  const [salaryMotion, setSalaryMotion] = useState(false);

  const availability = `${startTime} to ${endTime}`;
  const expectedSalary = `₹${salaryText || "0"}/${salaryPeriod}`;
  const salaryAmount = getNumberFromSalaryText(salaryText);

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

  useEffect(() => {
    function closeDropdown() {
      setOpenDropdown(null);
    }

    window.addEventListener("click", closeDropdown);

    return () => {
      window.removeEventListener("click", closeDropdown);
    };
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
      setSalaryText(cleanSalaryInput(amountMatch[0]) || "500");
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

    const currentAmount = salaryAmount || 0;

    if (type === "decrease") {
      const nextAmount = Math.max(50, currentAmount - 50);
      setSalaryText(String(nextAmount));
      return;
    }

    setSalaryText(String(currentAmount + 50));
  }

  function selectCity(city: string) {
    setLocation(city);
    setOpenDropdown(null);
  }

  function selectedDropdownLabel(options: DropdownOption[], value: string) {
    return options.find((option) => option.value === value)?.label || value;
  }

  function PremiumDropdown({
    dropdownKey,
    value,
    options,
    onChange,
  }: {
    dropdownKey: Exclude<DropdownKey, "city" | null>;
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
  }) {
    const isOpen = openDropdown === dropdownKey;

    return (
      <div
        style={{
          position: "relative",
          zIndex: isOpen ? 700 : 1,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          style={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: isOpen
              ? "1px solid rgba(255, 90, 31, 0.55)"
              : "1px solid var(--line-warm)",
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
            color: "var(--premium)",
            padding: "0 14px",
            fontSize: 15,
            fontWeight: 900,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: isOpen
              ? "0 0 0 4px rgba(255, 90, 31, 0.1), 0 16px 32px rgba(17, 24, 39, 0.08)"
              : "0 10px 22px rgba(17, 24, 39, 0.04)",
            transition:
              "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          }}
        >
          <span>{selectedDropdownLabel(options, value)}</span>

          <span
            style={{
              width: 27,
              height: 27,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: isOpen ? "var(--brand-soft)" : "#ffffff",
              color: isOpen ? "var(--brand-dark)" : "var(--muted)",
              border: "1px solid var(--line-warm)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition:
                "transform 0.18s ease, background 0.18s ease, color 0.18s ease",
              flexShrink: 0,
            }}
          >
            ↓
          </span>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 8px)",
              maxHeight: 230,
              overflowY: "auto",
              border: "1px solid var(--line-warm)",
              borderRadius: 18,
              background:
                "linear-gradient(180deg, #ffffff 0%, #fffaf6 100%)",
              boxShadow:
                "0 28px 70px rgba(17, 24, 39, 0.18), 0 10px 24px rgba(255, 90, 31, 0.08)",
              padding: 8,
              animation: "menuDrop 0.16s ease both",
            }}
          >
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    border: 0,
                    borderRadius: 13,
                    background: selected ? "var(--brand-soft)" : "transparent",
                    color: selected ? "var(--brand-dark)" : "var(--premium)",
                    padding: "10px 12px",
                    fontSize: 14,
                    fontWeight: selected ? 950 : 800,
                    fontFamily: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    transition:
                      "background 0.14s ease, color 0.14s ease, transform 0.14s ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = selected
                      ? "var(--brand-soft)"
                      : "rgba(255, 90, 31, 0.07)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = selected
                      ? "var(--brand-soft)"
                      : "transparent";
                  }}
                >
                  <span>{option.label}</span>
                  {selected && <span>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
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
        <aside
          className="profile-preview-card"
          style={{
            overflow: "hidden",
            border: "1px solid rgba(255, 90, 31, 0.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,248,241,0.94))",
            boxShadow:
              "0 30px 80px rgba(17,24,39,0.12), 0 12px 34px rgba(255,90,31,0.08)",
          }}
        >
          <div
            style={{
              margin: "-24px -24px 4px",
              padding: "24px",
              background:
                "radial-gradient(circle at 14% 18%, rgba(255,90,31,0.22), transparent 30%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.18), transparent 28%), linear-gradient(135deg, rgba(17,24,39,0.98), rgba(31,41,55,0.94))",
              color: "white",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="profile-avatar-large">
              {(fullName || profile?.email || "U").slice(0, 1).toUpperCase()}
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="profile-title-row">
                <h2 style={{ color: "white" }}>{fullName || "Unnamed user"}</h2>

                {profile?.is_verified && (
                  <span className="verified-badge">Verified</span>
                )}
              </div>

              <p style={{ color: "rgba(255,255,255,0.74)" }}>
                {profile?.email}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 14,
              }}
            >
              <span className="premium-badge">{profile?.tier}</span>

              <span
                style={{
                  display: "inline-flex",
                  width: "fit-content",
                  borderRadius: 999,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 12,
                  fontWeight: 950,
                  textTransform: "uppercase",
                }}
              >
                {profile?.role}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(255,90,31,0.1), rgba(245,158,11,0.08))",
              border: "1px solid rgba(255,90,31,0.16)",
            }}
          >
            <small
              style={{
                display: "block",
                color: "var(--muted)",
                fontWeight: 950,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Profile strength
            </small>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <strong
                style={{
                  color: "var(--premium)",
                  fontSize: 24,
                }}
              >
                {completion}%
              </strong>

              <div className="profile-score-bar" style={{ flex: 1 }}>
                <div style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          <div className="profile-mini-grid">
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
                zIndex: openDropdown === "city" ? 700 : 1,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              Location
              <input
                className="input"
                value={location}
                onFocus={() => setOpenDropdown("city")}
                onClick={() => setOpenDropdown("city")}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setOpenDropdown("city");
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setLocation((prev) => cleanCityName(prev));
                    setOpenDropdown(null);
                  }, 180);
                }}
                placeholder="Search or select your city"
              />

              {openDropdown === "city" && (
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
                style={{
                  gridTemplateColumns: "1fr auto 1fr",
                  overflow: "visible",
                }}
              >
                <PremiumDropdown
                  dropdownKey="startTime"
                  value={startTime}
                  options={timeDropdownOptions}
                  onChange={(value) => {
                    setStartTime(value);
                    triggerAvailabilityMotion();
                  }}
                />

                <span>to</span>

                <PremiumDropdown
                  dropdownKey="endTime"
                  value={endTime}
                  options={timeDropdownOptions}
                  onChange={(value) => {
                    setEndTime(value);
                    triggerAvailabilityMotion();
                  }}
                />
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
                  type="text"
                  inputMode="numeric"
                  value={salaryText}
                  onChange={(event) => {
                    setSalaryText(cleanSalaryInput(event.target.value));
                    triggerSalaryMotion();
                  }}
                  onBlur={() => {
                    if (!salaryText) {
                      setSalaryText("50");
                    }
                  }}
                  placeholder="500"
                />

                <button
                  type="button"
                  className="salary-stepper"
                  onClick={() => changeSalaryAmount("increase")}
                >
                  +
                </button>

                <PremiumDropdown
                  dropdownKey="salaryPeriod"
                  value={salaryPeriod}
                  options={salaryPeriodOptions}
                  onChange={(value) => {
                    setSalaryPeriod(value as SalaryPeriod);
                    triggerSalaryMotion();
                  }}
                />
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