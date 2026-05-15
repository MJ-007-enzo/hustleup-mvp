"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type SalaryType = "hour" | "day" | "week" | "month";

type UpgradedProfile = Profile & {
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  is_verified?: boolean | null;
};

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

export default function PostJobPage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Part-time");
  const [duration, setDuration] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType>("day");
  const [salaryAmount, setSalaryAmount] = useState(500);
  const [requirements, setRequirements] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const [responsibilities, setResponsibilities] = useState("");
  const [whoCanApply, setWhoCanApply] = useState("");
  const [benefits, setBenefits] = useState("");
  const [openings, setOpenings] = useState(1);
  const [workAddress, setWorkAddress] = useState("");
  const [contactNote, setContactNote] = useState("");

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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

    setProfile(data as UpgradedProfile);
    setCheckingAccess(false);
  }

  function selectCity(city: string) {
    setLocation(city);
    setCityDropdownOpen(false);
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

    const cleanedLocation = cleanCityName(location);

    if (!cleanedLocation) {
      setMessage("Please select or enter a job location.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      owner_id: authData.user.id,
      title,
      company_name: companyName,
      location: cleanedLocation,
      job_type: jobType,
      duration,
      salary_type: salaryType,
      salary_amount: salaryAmount,
      requirements,
      is_premium: isPremium,
      status: "open",

      responsibilities,
      who_can_apply: whoCanApply,
      benefits,
      openings,
      work_address: workAddress,
      contact_note: contactNote,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setCompanyName("");
    setLocation("");
    setJobType("Part-time");
    setDuration("");
    setSalaryType("day");
    setSalaryAmount(500);
    setRequirements("");
    setIsPremium(false);

    setResponsibilities("");
    setWhoCanApply("");
    setBenefits("");
    setOpenings(1);
    setWorkAddress("");
    setContactNote("");
    setCityDropdownOpen(false);

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
            Add clear salary, location, timing, requirements, responsibilities,
            benefits, and who can apply. The job card will stay clean, while the
            View Details popup will show the full information.
          </p>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>What makes a good listing?</h3>
            <p>✓ Clear job title</p>
            <p>✓ Exact timing and salary</p>
            <p>✓ Correct city location</p>
            <p>✓ Real responsibilities</p>
            <p>✓ Benefits or perks</p>
            <p>✓ Who can apply</p>
          </div>
        </div>

        <form className="card form" onSubmit={submit}>
          <span className="tag">Basic job details</span>

          <label className="label">
            Job title
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Cafe Assistant"
              required
            />
          </label>

          <label className="label">
            Company / shop name
            <input
              className="input"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Example: Bright Cafe"
              required
            />
          </label>

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
              placeholder="Search or select city"
              required
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
            Job type
            <input
              className="input"
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
              placeholder="Example: Part-time"
              required
            />
          </label>

          <label className="label">
            Duration / timing
            <input
              className="input"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Example: 5pm to 9pm"
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Salary type
              <select
                className="select"
                value={salaryType}
                onChange={(event) =>
                  setSalaryType(event.target.value as SalaryType)
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
                onChange={(event) =>
                  setSalaryAmount(Number(event.target.value))
                }
                required
              />
            </label>
          </div>

          <label className="label">
            Requirements
            <textarea
              className="textarea"
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="Example: Basic communication, punctuality, customer handling"
            />
          </label>

          <span className="tag">Full job details</span>

          <label className="label">
            Responsibilities
            <textarea
              className="textarea"
              value={responsibilities}
              onChange={(event) => setResponsibilities(event.target.value)}
              placeholder="Example: Handle customers, take orders, maintain counter cleanliness, assist billing."
            />
          </label>

          <label className="label">
            Who can apply?
            <textarea
              className="textarea"
              value={whoCanApply}
              onChange={(event) => setWhoCanApply(event.target.value)}
              placeholder="Example: College students, freshers, people available in evening shift."
            />
          </label>

          <label className="label">
            Benefits / perks
            <textarea
              className="textarea"
              value={benefits}
              onChange={(event) => setBenefits(event.target.value)}
              placeholder="Example: Free snacks, flexible timing, certificate, performance bonus."
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Openings
              <input
                className="input"
                type="number"
                min={1}
                value={openings}
                onChange={(event) => setOpenings(Number(event.target.value))}
              />
            </label>

            <label className="label">
              Work address / area
              <input
                className="input"
                value={workAddress}
                onChange={(event) => setWorkAddress(event.target.value)}
                placeholder="Example: Near Central Bus Stand, Trichy"
              />
            </label>
          </div>

          <label className="label">
            Contact note
            <textarea
              className="textarea"
              value={contactNote}
              onChange={(event) => setContactNote(event.target.value)}
              placeholder="Example: Shortlisted applicants will be contacted within 24 hours."
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
              onChange={(event) => setIsPremium(event.target.checked)}
            />
            Mark as premium listing
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Posting..." : "Post job"}
          </button>

          {message && (
            <div
              className={`notice ${
                message.includes("success") ? "success" : "error"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}