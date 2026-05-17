"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";

type JobWithDetails = Job & {
  responsibilities?: string | null;
  who_can_apply?: string | null;
  benefits?: string | null;
  openings?: number | null;
  work_address?: string | null;
  contact_note?: string | null;
};

type PremiumFilter = "all" | "premium" | "normal";
type FilterKey = "location" | "jobType" | "salaryPeriod" | "premium";

type DropdownOption = {
  label: string;
  value: string;
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

function normalizeLocation(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function formatSalaryPeriod(period: string) {
  if (period === "hour") return "/hour";
  if (period === "day") return "/day";
  if (period === "week") return "/week";
  if (period === "month") return "/month";
  return `/${period}`;
}

function getCurrentMonthStartISO() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return monthStart.toISOString();
}

function applicationLimitForTier(tier?: string | null) {
  if (tier === "premium" || tier === "advanced") {
    return null;
  }

  if (tier === "basic") {
    return 12;
  }

  return 5;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [monthlyApplicationCount, setMonthlyApplicationCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [salaryPeriodFilter, setSalaryPeriodFilter] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState<PremiumFilter>("all");

  const [openDropdown, setOpenDropdown] = useState<FilterKey | null>(null);

  const locations = tamilNaduCities;

  const jobTypes = useMemo(() => {
    const values = jobs
      .map((job) => job.job_type)
      .filter(Boolean)
      .map((value) => value.trim());

    return Array.from(new Set(values)).sort();
  }, [jobs]);

  const salaryPeriods = useMemo(() => {
    const values = jobs
      .map((job) => job.salary_type)
      .filter(Boolean)
      .map((value) => value.trim());

    return Array.from(new Set(values)).sort();
  }, [jobs]);

  const locationOptions = useMemo<DropdownOption[]>(() => {
    return [
      { label: "All locations", value: "all" },
      ...locations.map((city) => ({
        label: city,
        value: city,
      })),
    ];
  }, [locations]);

  const jobTypeOptions = useMemo<DropdownOption[]>(() => {
    return [
      { label: "All types", value: "all" },
      ...jobTypes.map((type) => ({
        label: type,
        value: type,
      })),
    ];
  }, [jobTypes]);

  const salaryPeriodOptions = useMemo<DropdownOption[]>(() => {
    return [
      { label: "All salary periods", value: "all" },
      ...salaryPeriods.map((period) => ({
        label: formatSalaryPeriod(period),
        value: period,
      })),
    ];
  }, [salaryPeriods]);

  const premiumOptions: DropdownOption[] = [
    { label: "All listings", value: "all" },
    { label: "Premium only", value: "premium" },
    { label: "Normal only", value: "normal" },
  ];

  useEffect(() => {
    loadJobs();
    loadViewer();
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

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company_name,
        job.location,
        job.job_type,
        job.requirements,
        job.responsibilities,
        job.who_can_apply,
        job.benefits,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query.length === 0 || searchableText.includes(query);

      const matchesLocation =
        locationFilter === "all" ||
        normalizeLocation(job.location) === normalizeLocation(locationFilter);

      const matchesJobType =
        jobTypeFilter === "all" || job.job_type === jobTypeFilter;

      const matchesSalaryPeriod =
        salaryPeriodFilter === "all" || job.salary_type === salaryPeriodFilter;

      const matchesPremium =
        premiumFilter === "all" ||
        (premiumFilter === "premium" && job.is_premium) ||
        (premiumFilter === "normal" && !job.is_premium);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesSalaryPeriod &&
        matchesPremium
      );
    });
  }, [
    jobs,
    searchQuery,
    locationFilter,
    jobTypeFilter,
    salaryPeriodFilter,
    premiumFilter,
  ]);

  const viewerTier = profile?.tier || "beginner";
  const hasPremiumAccess =
    viewerTier === "premium" || viewerTier === "advanced";
  const hasBasicPreviewAccess = viewerTier === "basic";
  const monthlyApplicationLimit = applicationLimitForTier(viewerTier);
  const hasUnlimitedApplications = monthlyApplicationLimit === null;
  const applicationsRemaining = hasUnlimitedApplications
    ? null
    : Math.max(0, monthlyApplicationLimit - monthlyApplicationCount);
  const isApplicationLimitReached =
    !hasUnlimitedApplications &&
    monthlyApplicationCount >= monthlyApplicationLimit;

  function canViewJobDetails(job: JobWithDetails) {
    if (!job.is_premium) return true;
    return hasPremiumAccess || hasBasicPreviewAccess;
  }

  function canApplyToJob(job: JobWithDetails) {
    if (!job.is_premium) return true;
    return hasPremiumAccess;
  }

  function premiumLockText(job: JobWithDetails) {
    if (!job.is_premium) return "";

    if (hasPremiumAccess) {
      return "Premium unlocked";
    }

    if (hasBasicPreviewAccess) {
      return "Basic preview: upgrade to Premium to apply.";
    }

    return "Premium listing: upgrade to view details and apply.";
  }

  function applicationLimitText() {
    if (hasUnlimitedApplications) {
      return "Unlimited applications this month.";
    }

    return `${monthlyApplicationCount}/${monthlyApplicationLimit} applications used this month. ${applicationsRemaining} remaining.`;
  }

  function selectedLabel(options: DropdownOption[], value: string) {
    return options.find((option) => option.value === value)?.label || value;
  }

  function clearFilters() {
    setSearchQuery("");
    setLocationFilter("all");
    setJobTypeFilter("all");
    setSalaryPeriodFilter("all");
    setPremiumFilter("all");
    setOpenDropdown(null);
  }

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((data ?? []) as JobWithDetails[]);
  }

  async function loadViewer() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setProfile(null);
      setAppliedJobIds(new Set());
      setMonthlyApplicationCount(0);
      return;
    }

    const monthStart = getCurrentMonthStartISO();

    const [
      { data: profileData },
      { data: applicationData },
      { count: monthlyCount },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single(),
      supabase
        .from("applications")
        .select("job_id")
        .eq("seeker_id", authData.user.id),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("seeker_id", authData.user.id)
        .gte("created_at", monthStart),
    ]);

    setProfile((profileData as Profile) ?? null);

    setAppliedJobIds(
      new Set((applicationData ?? []).map((item) => item.job_id))
    );

    setMonthlyApplicationCount(monthlyCount ?? 0);
  }

  async function apply(job: JobWithDetails) {
    if (appliedJobIds.has(job.id)) {
      setApplicationMessage("You already applied for this job.");
      return;
    }

    if (!canApplyToJob(job)) {
      setApplicationMessage(
        job.is_premium
          ? "Premium applications require the Premium plan."
          : "You cannot apply to this job right now."
      );
      return;
    }

    setApplicationMessage("");
    setApplyingJobId(job.id);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    if (isApplicationLimitReached) {
      setApplyingJobId(null);
      setApplicationMessage(
        `You reached your monthly application limit of ${monthlyApplicationLimit}. Upgrade your plan for more applications.`
      );
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: job.id,
      seeker_id: authData.user.id,
      message: "I am interested in this opportunity.",
      status: "applied",
    });

    setApplyingJobId(null);

    if (error) {
      if (error.message.includes("duplicate")) {
        setAppliedJobIds((prev) => {
          const next = new Set(prev);
          next.add(job.id);
          return next;
        });

        setApplicationMessage("You already applied for this job.");
      } else {
        setApplicationMessage(error.message);
      }

      return;
    }

    setAppliedJobIds((prev) => {
      const next = new Set(prev);
      next.add(job.id);
      return next;
    });

    if (!hasUnlimitedApplications) {
      setMonthlyApplicationCount((previousCount) => previousCount + 1);
    }

    setApplicationMessage("Application submitted successfully.");
    setSelectedJob(null);
  }

  function salaryLabel(job: JobWithDetails) {
    return `₹${job.salary_amount}/${job.salary_type}`;
  }

  function detailText(value?: string | null) {
    return value && value.trim().length > 0
      ? value
      : "Not added by the job owner.";
  }

  function renderDetailsButton(job: JobWithDetails) {
    if (canViewJobDetails(job)) {
      return (
        <button className="btn" onClick={() => setSelectedJob(job)}>
          View details
        </button>
      );
    }

    return (
      <Link className="btn" href="/pricing">
        Unlock details
      </Link>
    );
  }

  function renderApplyButton(job: JobWithDetails, modal = false) {
    if (appliedJobIds.has(job.id)) {
      return (
        <button className="btn btn-primary" disabled>
          Applied
        </button>
      );
    }

    if (!canApplyToJob(job)) {
      return (
        <Link className="btn btn-primary" href="/pricing">
          {job.is_premium && hasBasicPreviewAccess
            ? "Upgrade to Premium"
            : "Unlock premium"}
        </Link>
      );
    }

    if (isApplicationLimitReached) {
      return (
        <Link className="btn btn-primary" href="/pricing">
          Upgrade limit
        </Link>
      );
    }

    return (
      <button
        className="btn btn-primary"
        onClick={() => apply(job)}
        disabled={applyingJobId === job.id}
      >
        {applyingJobId === job.id
          ? "Applying..."
          : modal
            ? "Apply for this job"
            : "Apply now"}
      </button>
    );
  }

  function FilterDropdown({
    label,
    dropdownKey,
    value,
    options,
    onChange,
  }: {
    label: string;
    dropdownKey: FilterKey;
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
  }) {
    const isOpen = openDropdown === dropdownKey;

    return (
      <div
        className="label"
        style={{
          position: "relative",
          zIndex: isOpen ? 100 : 1,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {label}

        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          style={{
            width: "100%",
            minHeight: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            border: isOpen
              ? "1px solid rgba(255, 90, 31, 0.55)"
              : "1px solid var(--line-warm)",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,246,0.92))",
            color: "var(--premium)",
            padding: "0 15px",
            fontSize: 15,
            fontWeight: 850,
            fontFamily: "inherit",
            textAlign: "left",
            cursor: "pointer",
            boxShadow: isOpen
              ? "0 0 0 4px rgba(255, 90, 31, 0.1), 0 16px 32px rgba(17, 24, 39, 0.08)"
              : "0 10px 22px rgba(17, 24, 39, 0.04)",
            transition:
              "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedLabel(options, value)}
          </span>

          <span
            style={{
              width: 28,
              height: 28,
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
              maxHeight: 260,
              overflowY: "auto",
              border: "1px solid var(--line-warm)",
              borderRadius: 20,
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
                    minHeight: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    border: 0,
                    borderRadius: 14,
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

  return (
    <main className="container">
      <section className="jobs-hero">
        <div>
          <span className="badge">Open opportunities</span>
          <h1>Browse part-time jobs.</h1>
          <p className="hero-copy">
            Find local, flexible work opportunities. Search and filter jobs by
            location, type, salary period, and premium access.
          </p>
        </div>

        <div className="jobs-summary-card">
          <span className="tag">Live marketplace</span>
          <div className="stat">{filteredJobs.length}</div>
          <p>
            result{filteredJobs.length === 1 ? "" : "s"} from {jobs.length} open
            job{jobs.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {profile && (
        <div className="notice" style={{ marginBottom: 14 }}>
          Current access: <strong>{viewerTier}</strong> ·{" "}
          <strong>{applicationLimitText()}</strong>
          {viewerTier === "beginner" &&
            " Premium listings are visible but locked."}
          {viewerTier === "basic" &&
            " Premium details are unlocked, but Premium applications need Premium."}
          {hasPremiumAccess && " Premium listings are fully unlocked."}
        </div>
      )}

      {!profile && (
        <div className="notice" style={{ marginBottom: 14 }}>
          You can browse jobs now. Login to apply and unlock plan-based access.
        </div>
      )}

      {message && <div className="notice error">{message}</div>}

      {applicationMessage && (
        <div
          className={`notice ${
            applicationMessage.includes("successfully") ? "success" : "error"
          }`}
        >
          {applicationMessage}
        </div>
      )}

      <section className="jobs-filter-panel">
        <div className="jobs-search-box">
          <label className="label">
            Search jobs
            <input
              className="input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, company, skills, benefits..."
            />
          </label>
        </div>

        <div className="jobs-filter-grid">
          <FilterDropdown
            label="Location"
            dropdownKey="location"
            value={locationFilter}
            options={locationOptions}
            onChange={setLocationFilter}
          />

          <FilterDropdown
            label="Job type"
            dropdownKey="jobType"
            value={jobTypeFilter}
            options={jobTypeOptions}
            onChange={setJobTypeFilter}
          />

          <FilterDropdown
            label="Salary period"
            dropdownKey="salaryPeriod"
            value={salaryPeriodFilter}
            options={salaryPeriodOptions}
            onChange={setSalaryPeriodFilter}
          />

          <FilterDropdown
            label="Listing type"
            dropdownKey="premium"
            value={premiumFilter}
            options={premiumOptions}
            onChange={(value) => setPremiumFilter(value as PremiumFilter)}
          />
        </div>

        <div className="jobs-filter-footer">
          <p>
            Showing <strong>{filteredJobs.length}</strong> of{" "}
            <strong>{jobs.length}</strong> open listings.
          </p>

          <button className="btn" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </section>

      <section className="jobs-toolbar">
        <div>
          <h2>Available jobs</h2>
          <p>
            {filteredJobs.length === jobs.length
              ? "Showing all active listings."
              : "Showing filtered job results."}
          </p>
        </div>
      </section>

      <section className="jobs-grid">
        {jobs.length === 0 && (
          <div className="card empty-jobs-card">
            <span className="tag">No listings yet</span>
            <h3>No jobs available right now.</h3>
            <p>
              Once job owners post opportunities, they will appear here. Add one
              or two polished jobs from a job owner account for demo.
            </p>
          </div>
        )}

        {jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="card empty-jobs-card">
            <span className="tag">No matching jobs</span>
            <h3>No jobs match these filters.</h3>
            <p>Try clearing filters or searching a different keyword.</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        {filteredJobs.map((job) => (
          <article
            className={`job-card ${job.is_premium ? "job-card-premium" : ""}`}
            key={job.id}
          >
            <div className="job-card-top">
              <span className={job.is_premium ? "premium-pill" : "open-pill"}>
                {job.is_premium ? "Premium" : "Open"}
              </span>

              <span className="job-date">
                {new Date(job.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>

            <h2>{job.title}</h2>

            <div className="job-company">
              <span>{job.company_name}</span>
              <span>•</span>
              <span>{job.location}</span>
            </div>

            <div className="job-meta-grid">
              <div>
                <small>Job type</small>
                <strong>{job.job_type}</strong>
              </div>

              <div>
                <small>Timing</small>
                <strong>{job.duration || "Flexible"}</strong>
              </div>

              <div>
                <small>Salary</small>
                <strong>{salaryLabel(job)}</strong>
              </div>
            </div>

            {job.is_premium && !hasPremiumAccess && (
              <div
                className="notice"
                style={{
                  marginTop: 14,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {premiumLockText(job)}
              </div>
            )}

            {!job.is_premium && isApplicationLimitReached && (
              <div
                className="notice error"
                style={{
                  marginTop: 14,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                Monthly application limit reached. Upgrade to apply more.
              </div>
            )}

            <p className="job-requirements">
              {job.requirements ||
                "Tap View details to see full job information."}
            </p>

            <div className="job-card-actions">
              {renderDetailsButton(job)}
              {renderApplyButton(job)}
            </div>
          </article>
        ))}
      </section>

      {selectedJob && (
        <div className="job-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="job-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="job-modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close job details"
            >
              ×
            </button>

            <div className="job-modal-top">
              <span
                className={selectedJob.is_premium ? "premium-pill" : "open-pill"}
              >
                {selectedJob.is_premium ? "Premium" : "Open"}
              </span>

              <span className="job-date">
                Posted{" "}
                {new Date(selectedJob.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h2>{selectedJob.title}</h2>

            <p className="job-modal-company">
              <strong>{selectedJob.company_name}</strong> ·{" "}
              {selectedJob.location}
            </p>

            {selectedJob.is_premium && !hasPremiumAccess && (
              <div
                className="notice"
                style={{
                  marginBottom: 18,
                  fontWeight: 750,
                }}
              >
                {hasBasicPreviewAccess
                  ? "Basic preview unlocked. Upgrade to Premium to apply for this listing."
                  : "This is a Premium listing. Upgrade to unlock full access."}
              </div>
            )}

            {!selectedJob.is_premium && isApplicationLimitReached && (
              <div
                className="notice error"
                style={{
                  marginBottom: 18,
                  fontWeight: 750,
                }}
              >
                You reached your monthly application limit. Upgrade your plan to
                apply more this month.
              </div>
            )}

            <div className="job-modal-grid">
              <div>
                <small>Job type</small>
                <strong>{selectedJob.job_type}</strong>
              </div>

              <div>
                <small>Timing</small>
                <strong>{selectedJob.duration || "Flexible"}</strong>
              </div>

              <div>
                <small>Salary</small>
                <strong>{salaryLabel(selectedJob)}</strong>
              </div>

              <div>
                <small>Openings</small>
                <strong>{selectedJob.openings || 1}</strong>
              </div>

              <div>
                <small>Area</small>
                <strong>
                  {selectedJob.work_address || selectedJob.location}
                </strong>
              </div>

              <div>
                <small>Status</small>
                <strong>{selectedJob.status}</strong>
              </div>
            </div>

            <div className="job-modal-section">
              <h3>Requirements</h3>
              <p>{detailText(selectedJob.requirements)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Responsibilities</h3>
              <p>{detailText(selectedJob.responsibilities)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Who can apply?</h3>
              <p>{detailText(selectedJob.who_can_apply)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Benefits / perks</h3>
              <p>{detailText(selectedJob.benefits)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Work address</h3>
              <p>{detailText(selectedJob.work_address)}</p>
            </div>

            <div className="job-modal-section">
              <h3>Contact note</h3>
              <p>{detailText(selectedJob.contact_note)}</p>
            </div>

            <div className="job-modal-actions">
              <button className="btn" onClick={() => setSelectedJob(null)}>
                Close
              </button>

              {renderApplyButton(selectedJob, true)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}