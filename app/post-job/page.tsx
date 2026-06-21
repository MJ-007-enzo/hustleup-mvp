"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type SalaryType = "hour" | "day" | "week" | "month";

type DropdownKey =
  | "city"
  | "jobType"
  | "startTime"
  | "endTime"
  | "salaryType"
  | null;

type DropdownOption = {
  label: string;
  value: string;
};

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

const timeDropdownOptions: DropdownOption[] = timeOptions.map((time) => ({
  label: time,
  value: time,
}));

const jobTypeOptions: DropdownOption[] = [
  { label: "Part-time", value: "Part-time" },
  { label: "Full-time", value: "Full-time" },
  { label: "Internship", value: "Internship" },
  { label: "Weekend job", value: "Weekend job" },
  { label: "Event work", value: "Event work" },
  { label: "Remote work", value: "Remote work" },
  { label: "Flexible work", value: "Flexible work" },
];

const salaryTypeOptions: DropdownOption[] = [
  { label: "/hour", value: "hour" },
  { label: "/day", value: "day" },
  { label: "/week", value: "week" },
  { label: "/month", value: "month" },
];

const listingTips = [
  "Clear job title",
  "Exact timing and salary",
  "Correct city location",
  "Real responsibilities",
  "Benefits or perks",
  "Who can apply",
];

const formValueStyle = {
  color: "var(--premium)",
  fontSize: "16px",
  fontWeight: 750,
  fontFamily: "inherit",
};

const textareaValueStyle = {
  color: "var(--premium)",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.55,
};

function cleanCityName(value: string) {
  const cleanedValue = value.trim();

  const match = tamilNaduCities.find(
    (city) => city.toLowerCase() === cleanedValue.toLowerCase()
  );

  return match || cleanedValue;
}

function cleanNumberInput(value: string) {
  const numbersOnly = value.replace(/\D/g, "");

  if (!numbersOnly) {
    return "";
  }

  return numbersOnly.replace(/^0+(?=\d)/, "");
}

function getNumber(value: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function capitalizeSentences(value: string) {
  return value.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
}

export default function PostJobPage() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Part-time");
  const [startTime, setStartTime] = useState("5:00 PM");
  const [endTime, setEndTime] = useState("9:00 PM");
  const [salaryType, setSalaryType] = useState<SalaryType>("day");
  const [salaryText, setSalaryText] = useState("500");
  const [requirements, setRequirements] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const [responsibilities, setResponsibilities] = useState("");
  const [whoCanApply, setWhoCanApply] = useState("");
  const [benefits, setBenefits] = useState("");
  const [openings, setOpenings] = useState(1);
  const [workAddress, setWorkAddress] = useState("");
  const [contactNote, setContactNote] = useState("");

  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [salaryMotion, setSalaryMotion] = useState(false);
  const [timingMotion, setTimingMotion] = useState(false);

  const [busy, setBusy] = useState(false);

  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = `${startTime} to ${endTime}`;
  const salaryAmount = getNumber(salaryText);

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

  useEffect(() => {
    function closeDropdown() {
      setOpenDropdown(null);
    }

    function stopHoldFromWindow() {
      stopSalaryHold();
    }

    window.addEventListener("click", closeDropdown);
    window.addEventListener("pointerup", stopHoldFromWindow);
    window.addEventListener("pointercancel", stopHoldFromWindow);
    window.addEventListener("blur", stopHoldFromWindow);

    return () => {
      window.removeEventListener("click", closeDropdown);
      window.removeEventListener("pointerup", stopHoldFromWindow);
      window.removeEventListener("pointercancel", stopHoldFromWindow);
      window.removeEventListener("blur", stopHoldFromWindow);
      stopSalaryHold();
    };
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
      showToast(error.message, "error");
      setCheckingAccess(false);
      return;
    }

    setProfile(data as UpgradedProfile);
    setCheckingAccess(false);
  }

  function triggerSalaryMotion() {
    setSalaryMotion(false);
    setTimeout(() => setSalaryMotion(true), 10);
    setTimeout(() => setSalaryMotion(false), 260);
  }

  function triggerTimingMotion() {
    setTimingMotion(false);
    setTimeout(() => setTimingMotion(true), 10);
    setTimeout(() => setTimingMotion(false), 300);
  }

  function stepSalary(type: "increase" | "decrease") {
    triggerSalaryMotion();

    setSalaryText((previousValue) => {
      const currentAmount = getNumber(previousValue) || 0;

      if (type === "decrease") {
        return String(Math.max(50, currentAmount - 50));
      }

      return String(currentAmount + 50);
    });
  }

  function startSalaryHold(type: "increase" | "decrease") {
    stopSalaryHold();

    stepSalary(type);

    holdDelayRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        stepSalary(type);
      }, 70);
    }, 280);
  }

  function stopSalaryHold() {
    if (holdDelayRef.current) {
      clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
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
          zIndex: isOpen ? 9999 : 1,
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
            background: "var(--card)",
            color: "var(--premium)",
            padding: "0 14px",
            fontSize: 16,
            fontWeight: 750,
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
              background: isOpen ? "var(--brand-soft)" : "var(--card-soft)",
              color: isOpen ? "var(--brand-dark)" : "var(--muted)",
              border: "1px solid var(--line-warm)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition:
                "transform 0.18s ease, background 0.18s ease, color 0.18s ease",
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 750,
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
              background: "var(--card)",
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
                    fontSize: 15,
                    fontWeight: selected ? 750 : 650,
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

  async function submit(event: FormEvent) {
    event.preventDefault();

    setBusy(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    if (profile?.role !== "job_owner" && profile?.role !== "admin") {
      showToast("Only job owners and admins can post jobs.", "error");
      setBusy(false);
      return;
    }

    const cleanedLocation = cleanCityName(location);
    const finalSalaryAmount = salaryAmount || 50;

    if (!cleanedLocation) {
      showToast("Please select or enter a job location.", "error");
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
      salary_amount: finalSalaryAmount,
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
      showToast(error.message, "error");
      return;
    }

    setTitle("");
    setCompanyName("");
    setLocation("");
    setJobType("Part-time");
    setStartTime("5:00 PM");
    setEndTime("9:00 PM");
    setSalaryType("day");
    setSalaryText("500");
    setRequirements("");
    setIsPremium(false);

    setResponsibilities("");
    setWhoCanApply("");
    setBenefits("");
    setOpenings(1);
    setWorkAddress("");
    setContactNote("");
    setOpenDropdown(null);

    showToast("Job posted successfully.", "success");
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

          <div
            className="card"
            style={{
              position: "relative",
              overflow: "hidden",
              marginTop: 18,
              padding: 24,
              borderRadius: 30,
              border: "1px solid rgba(255, 90, 31, 0.18)",
              background:
                "radial-gradient(circle at 12% 8%, rgba(255,90,31,0.12), transparent 28%), radial-gradient(circle at 92% 0%, rgba(245,158,11,0.11), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
              boxShadow:
                "0 30px 80px rgba(17,24,39,0.1), 0 14px 36px rgba(255,90,31,0.08)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "0 0 auto 0",
                height: 5,
                background: "var(--brand-gradient)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--premium-gradient)",
                  color: "white",
                  boxShadow: "0 14px 30px rgba(17, 24, 39, 0.16)",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                ✓
              </div>

              <div>
                <span
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "var(--brand-soft)",
                    color: "var(--brand-dark)",
                    fontSize: 11,
                    fontWeight: 850,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  Listing guide
                </span>

                <h3 style={{ margin: 0 }}>What makes a good listing?</h3>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {listingTips.map((tip) => (
                <div
                  key={tip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 13px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.76)",
                    border: "1px solid rgba(255,90,31,0.12)",
                    boxShadow: "0 10px 24px rgba(17,24,39,0.035)",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "var(--brand-soft)",
                      color: "var(--brand-dark)",
                      fontWeight: 850,
                      flexShrink: 0,
                      fontSize: 13,
                    }}
                  >
                    ✓
                  </span>

                  <span
                    style={{
                      color: "var(--muted)",
                      fontWeight: 750,
                    }}
                  >
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form className="card form" onSubmit={submit}>
          <span className="tag">Basic job details</span>

          <label className="label">
            Job title
            <input
              className="input"
              style={formValueStyle}
              value={title}
              onChange={(event) => setTitle(capitalizeWords(event.target.value))}
              placeholder="Example: Cafe Assistant"
              required
            />
          </label>

          <label className="label">
            Company / shop name
            <input
              className="input"
              style={formValueStyle}
              value={companyName}
              onChange={(event) =>
                setCompanyName(capitalizeWords(event.target.value))
              }
              placeholder="Example: Bright Cafe"
              required
            />
          </label>

          <label
            className="label"
            style={{
              position: "relative",
              overflow: "visible",
              zIndex: openDropdown === "city" ? 9999 : 1,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            Location
            <input
              className="input"
              style={formValueStyle}
              value={location}
              onFocus={() => setOpenDropdown("city")}
              onClick={() => setOpenDropdown("city")}
              onChange={(event) => {
                setLocation(capitalizeWords(event.target.value));
                setOpenDropdown("city");
              }}
              onBlur={() => {
                setTimeout(() => {
                  setLocation((prev) => cleanCityName(prev));
                  setOpenDropdown(null);
                }, 180);
              }}
              placeholder="Search or select city"
              required
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
                  background: "var(--card)",
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
                        fontWeight: 750,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "15px",
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
                      fontWeight: 650,
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
            <PremiumDropdown
              dropdownKey="jobType"
              value={jobType}
              options={jobTypeOptions}
              onChange={setJobType}
            />
          </label>

          <label className="label">
            Duration / timing
            <div
              className={`availability-picker ${
                timingMotion ? "profile-control-pop" : ""
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
                  triggerTimingMotion();
                }}
              />

              <span
                style={{
                  fontWeight: 750,
                  color: "var(--muted)",
                }}
              >
                to
              </span>

              <PremiumDropdown
                dropdownKey="endTime"
                value={endTime}
                options={timeDropdownOptions}
                onChange={(value) => {
                  setEndTime(value);
                  triggerTimingMotion();
                }}
              />
            </div>
          </label>

          <label className="label">
            Salary
            <div
              className={`salary-picker ${
                salaryMotion ? "profile-control-pop" : ""
              }`}
            >
              <span className="currency-chip">₹</span>

              <button
                type="button"
                className="salary-stepper"
                style={{
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  fontWeight: 800,
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  startSalaryHold("decrease");
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  stopSalaryHold();
                }}
                onPointerLeave={stopSalaryHold}
                onPointerCancel={stopSalaryHold}
                onContextMenu={(event) => event.preventDefault()}
              >
                −
              </button>

              <input
                className="salary-input"
                type="text"
                inputMode="numeric"
                style={formValueStyle}
                value={salaryText}
                onChange={(event) => {
                  setSalaryText(cleanNumberInput(event.target.value));
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
                style={{
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  fontWeight: 800,
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  startSalaryHold("increase");
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  stopSalaryHold();
                }}
                onPointerLeave={stopSalaryHold}
                onPointerCancel={stopSalaryHold}
                onContextMenu={(event) => event.preventDefault()}
              >
                +
              </button>

              <PremiumDropdown
                dropdownKey="salaryType"
                value={salaryType}
                options={salaryTypeOptions}
                onChange={(value) => setSalaryType(value as SalaryType)}
              />
            </div>
          </label>

          <label className="label">
            Requirements
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={requirements}
              onChange={(event) =>
                setRequirements(capitalizeSentences(event.target.value))
              }
              placeholder="Example: Basic communication, punctuality, customer handling"
            />
          </label>

          <span className="tag">Full job details</span>

          <label className="label">
            Responsibilities
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={responsibilities}
              onChange={(event) =>
                setResponsibilities(capitalizeSentences(event.target.value))
              }
              placeholder="Example: Handle customers, take orders, maintain counter cleanliness, assist billing."
            />
          </label>

          <label className="label">
            Who can apply?
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={whoCanApply}
              onChange={(event) =>
                setWhoCanApply(capitalizeSentences(event.target.value))
              }
              placeholder="Example: College students, freshers, people available in evening shift."
            />
          </label>

          <label className="label">
            Benefits / perks
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={benefits}
              onChange={(event) =>
                setBenefits(capitalizeSentences(event.target.value))
              }
              placeholder="Example: Free snacks, flexible timing, certificate, performance bonus."
            />
          </label>

          <div className="grid grid-2">
            <label className="label">
              Openings
              <input
                className="input"
                style={formValueStyle}
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
                style={formValueStyle}
                value={workAddress}
                onChange={(event) =>
                  setWorkAddress(capitalizeWords(event.target.value))
                }
                placeholder="Example: Near Central Bus Stand, Trichy"
              />
            </label>
          </div>

          <label className="label">
            Contact note
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={contactNote}
              onChange={(event) =>
                setContactNote(capitalizeSentences(event.target.value))
              }
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
        </form>
      </section>
    </main>
  );
}