"use client";

import Link from "next/link";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type SalaryPeriod = "hour" | "day" | "week" | "month";

type DropdownKey = "city" | "startTime" | "endTime" | "salaryPeriod" | null;

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

const timeDropdownOptions: DropdownOption[] = timeOptions.map((time) => ({
  label: time,
  value: time,
}));

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

function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function capitalizeSentences(value: string) {
  return value.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
}

function formatTierName(tier?: string | null) {
  if (!tier) return "Beginner";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function planHeadline(tier?: string | null) {
  if (tier === "basic") return "Better visibility unlocked.";
  if (tier === "premium") return "Premium access active.";
  if (tier === "advanced") return "Advanced rare access active.";
  return "Starter access active.";
}

function planDescription(tier?: string | null) {
  if (tier === "basic") {
    return "You can preview Premium job details, but Premium applications still need Premium.";
  }

  if (tier === "premium") {
    return "You can view and apply to Premium jobs with stronger profile positioning.";
  }

  if (tier === "advanced") {
    return "Admin-controlled high-trust access with maximum visibility and future priority benefits.";
  }

  return "You can apply to regular jobs. Premium listings stay locked until you upgrade.";
}

function PlanPowerItem({
  children,
  locked = false,
}: {
  children: ReactNode;
  locked?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 11px",
        borderRadius: 15,
        background: locked
          ? "linear-gradient(180deg, #fff7f7, #fff1f1)"
          : "rgba(255,255,255,0.8)",
        border: locked
          ? "1px solid rgba(239,68,68,0.18)"
          : "1px solid rgba(255,90,31,0.12)",
        boxShadow: "0 10px 22px rgba(17,24,39,0.035)",
      }}
    >
      <span
        style={{
          width: 23,
          height: 23,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: locked ? "#fee2e2" : "var(--brand-soft)",
          color: locked ? "#b91c1c" : "var(--brand-dark)",
          fontWeight: 900,
          flexShrink: 0,
          fontSize: 12,
        }}
      >
        {locked ? "!" : "✓"}
      </span>

      <span
        style={{
          color: locked ? "#b91c1c" : "var(--muted)",
          fontWeight: 750,
          fontSize: 14,
          lineHeight: 1.35,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function PlanPowerCard({ tier }: { tier?: string | null }) {
  const currentTier = tier || "beginner";

  const isBeginner = currentTier === "beginner";
  const isBasic = currentTier === "basic";
  const isPremium = currentTier === "premium";
  const isAdvanced = currentTier === "advanced";

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 22,
        background:
          isPremium || isAdvanced
            ? "radial-gradient(circle at 12% 10%, rgba(255,90,31,0.16), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,250,246,0.86))"
            : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,250,246,0.84))",
        border:
          isPremium || isAdvanced
            ? "1px solid rgba(255,90,31,0.22)"
            : "1px solid rgba(255,90,31,0.14)",
        boxShadow:
          isPremium || isAdvanced
            ? "0 20px 48px rgba(255,90,31,0.1), 0 12px 28px rgba(17,24,39,0.06)"
            : "0 12px 28px rgba(17,24,39,0.045)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <small
            style={{
              display: "block",
              color: "var(--muted)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            Plan power
          </small>

          <h3
            style={{
              margin: 0,
              color: "var(--premium)",
              lineHeight: 1.15,
            }}
          >
            {planHeadline(currentTier)}
          </h3>
        </div>

        <span
          className={isPremium || isAdvanced ? "premium-badge" : "tag"}
          style={{
            flexShrink: 0,
          }}
        >
          {formatTierName(currentTier)}
        </span>
      </div>

      <p
        style={{
          marginTop: 0,
          marginBottom: 14,
          fontWeight: 650,
          lineHeight: 1.5,
        }}
      >
        {planDescription(currentTier)}
      </p>

      <div
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        <PlanPowerItem>Regular jobs unlocked</PlanPowerItem>

        <PlanPowerItem locked={isBeginner}>
          Premium job details {isBeginner ? "locked" : "unlocked"}
        </PlanPowerItem>

        <PlanPowerItem locked={isBeginner || isBasic}>
          Premium applications{" "}
          {isPremium || isAdvanced ? "unlocked" : "locked"}
        </PlanPowerItem>

        <PlanPowerItem locked={isBeginner}>
          Profile visibility{" "}
          {isAdvanced
            ? "maximum"
            : isPremium
              ? "priority"
              : isBasic
                ? "improved"
                : "standard"}
        </PlanPowerItem>
      </div>

      {(isBeginner || isBasic) && (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 14,
          }}
        >
          <Link
            className="btn btn-primary"
            href="/pricing"
            style={{
              minHeight: 46,
              borderRadius: 15,
              padding: "0 16px",
              fontWeight: 850,
              boxShadow:
                "0 16px 34px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
            }}
          >
            Upgrade plan
          </Link>

          <Link
            className="btn"
            href="/jobs"
            style={{
              minHeight: 46,
              borderRadius: 15,
              padding: "0 16px",
              fontWeight: 850,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
              border: "1px solid rgba(255,90,31,0.16)",
              color: "var(--premium)",
              boxShadow: "0 12px 26px rgba(17,24,39,0.06)",
            }}
          >
            Browse jobs
          </Link>
        </div>
      )}
    </div>
  );
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

  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availability = `${startTime} to ${endTime}`;
  const expectedSalary = `₹${salaryText || "50"}/${salaryPeriod}`;

  const toastType = message.includes("successfully") ? "success" : "error";

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
    setTimeout(() => setSalaryMotion(false), 260);
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
    const finalSalaryText = salaryText || "50";
    const finalExpectedSalary = `₹${finalSalaryText}/${salaryPeriod}`;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        occupation,
        skills,
        availability,
        expected_salary: finalExpectedSalary,
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
    setSalaryText(finalSalaryText);
    setMessage("Profile updated successfully.");
    loadProfile();
  }

  function stepSalary(type: "increase" | "decrease") {
    triggerSalaryMotion();

    setSalaryText((previousValue) => {
      const currentAmount = getNumberFromSalaryText(previousValue) || 0;

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
              background: isOpen ? "var(--brand-soft)" : "#ffffff",
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

  if (loading) {
    return (
      <main className="container">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Toast
        message={message}
        type={toastType}
        onClose={() => setMessage("")}
      />

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
                  fontWeight: 850,
                  textTransform: "uppercase",
                }}
              >
                {profile?.role}
              </span>
            </div>
          </div>

          <PlanPowerCard tier={profile?.tier} />

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
                fontWeight: 850,
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
              style={formValueStyle}
              value={fullName}
              onChange={(event) =>
                setFullName(capitalizeWords(event.target.value))
              }
              placeholder="Example: Krishna Kumar"
            />
          </label>

          <label className="label">
            Occupation
            <input
              className="input"
              style={formValueStyle}
              value={occupation}
              onChange={(event) =>
                setOccupation(capitalizeWords(event.target.value))
              }
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
              Phone
              <input
                className="input"
                style={formValueStyle}
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
              style={textareaValueStyle}
              value={bio}
              onChange={(event) =>
                setBio(capitalizeSentences(event.target.value))
              }
              placeholder="Example: I am a 3rd year student looking for evening part-time work."
            />
          </label>

          <span className="tag">Work profile</span>

          <label className="label">
            Skills
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={skills}
              onChange={(event) =>
                setSkills(capitalizeSentences(event.target.value))
              }
              placeholder="Example: Customer handling, MS Excel, sales, typing, communication"
            />
          </label>

          <label className="label">
            Experience
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={experience}
              onChange={(event) =>
                setExperience(capitalizeSentences(event.target.value))
              }
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