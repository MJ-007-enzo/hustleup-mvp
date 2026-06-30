"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Job, Profile } from "@/lib/types";
import { createPortal } from "react-dom";
declare global {
  interface Window {
    Razorpay?: any;
  }
}
type JobWithDetails = Job & {
  responsibilities?: string | null;
  who_can_apply?: string | null;
  benefits?: string | null;
  openings?: number | null;
  work_address?: string | null;
  contact_note?: string | null;
};

const premiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,90,31,0.18)",
  background: "var(--card)",
  boxShadow:
    "0 28px 70px rgba(0,0,0,0.16), 0 14px 34px rgba(255,90,31,0.055)",
};

const actionButtonStyle: CSSProperties = {
  minHeight: 48,
  borderRadius: 16,
  padding: "0 18px",
  fontWeight: 850,
  fontSize: 14,
  boxShadow: "0 14px 32px rgba(17,24,39,0.09)",
};

const secondaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "var(--card-soft)",
  border: "1px solid rgba(255,90,31,0.18)",
  color: "var(--text)",
};

const dangerButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "var(--card-soft)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#ff6b6b",
};

const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  boxShadow:
    "0 18px 40px rgba(255,90,31,0.2), 0 10px 24px rgba(17,24,39,0.08)",
};

const formValueStyle: CSSProperties = {
  color: "var(--text)",
  fontSize: "16px",
  fontWeight: 750,
  fontFamily: "inherit",
};

const textareaValueStyle: CSSProperties = {
  color: "var(--text)",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.55,
};
const workScheduleOptions = [
  { label: "Flexible", value: "Flexible" },
  { label: "Mon - Fri", value: "Mon - Fri" },
  { label: "Mon - Sat", value: "Mon - Sat" },
  { label: "Weekends Only", value: "Weekends Only" },
  { label: "Daily", value: "Daily" },
  { label: "Custom", value: "Custom" },
];
function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function capitalizeSentences(value: string) {
  return value.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
}

function Pill({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "neutral" | "success" | "danger" | "premium";
}) {
  const styles: Record<string, CSSProperties> = {
    neutral: {
      background: "rgba(255,90,31,0.09)",
      color: "var(--brand-dark)",
      border: "1px solid rgba(255,90,31,0.15)",
    },
    success: {
      background: "rgba(16,185,129,0.11)",
      color: "#047857",
      border: "1px solid rgba(16,185,129,0.22)",
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      color: "#b91c1c",
      border: "1px solid rgba(239,68,68,0.2)",
    },
    premium: {
      background: "var(--premium-gradient)",
      color: "white",
      border: "1px solid rgba(17,24,39,0.1)",
      boxShadow: "0 14px 30px rgba(17,24,39,0.14)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        alignItems: "center",
        gap: variant === "premium" ? 7 : 0,
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 11,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {variant === "premium" && (
        <span style={{ color: "#fbbf24", fontSize: 12, lineHeight: 1 }}>
          ★
        </span>
      )}
      {children}
    </span>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: "12px 14px",
        borderRadius: 16,
        background: "var(--card-soft)",
        border: "1px solid rgba(255,90,31,0.18)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      }}
    >
      <small
        style={{
          display: "block",
          color: "var(--muted)",
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
          fontSize: 11,
        }}
      >
        {label}
      </small>

      <strong
        style={{
          display: "block",
          color: "var(--text)",
          fontWeight: 800,
          lineHeight: 1.3,
          fontSize: 14,
          overflowWrap: "anywhere",
        }}
      >
        {value || "Not added"}
      </strong>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  compact,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  compact: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: compact ? 24 : 30,
        padding: compact ? 20 : 30,
        minHeight: compact ? 170 : 210,
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
          width: compact ? 38 : 44,
          height: compact ? 38 : 44,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: "var(--brand-soft)",
          color: "var(--brand-dark)",
          fontWeight: 900,
          marginBottom: compact ? 16 : 22,
          boxShadow: "0 14px 30px rgba(255,90,31,0.11)",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: 0,
          color: "var(--muted)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: compact ? 12 : 13,
        }}
      >
        {label}
      </p>

      <div
        className="stat"
        style={{
          marginTop: compact ? 10 : 14,
          marginBottom: 8,
          color: "var(--text)",
          fontSize: compact ? 34 : undefined,
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginBottom: 0,
          fontWeight: 700,
          lineHeight: 1.45,
          fontSize: compact ? 14 : undefined,
        }}
      >
        {hint}
      </p>
    </div>
  );
}

export default function MyJobsPage() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [editingJob, setEditingJob] = useState<JobWithDetails | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobWithDetails | null>(null);
  const [boostingJob, setBoostingJob] = useState<JobWithDetails | null>(null);

const [buyingVisibility, setBuyingVisibility] =
  useState(false);
const [processingBoost, setProcessingBoost] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visibilityJob, setVisibilityJob] =
  useState<JobWithDetails | null>(null);
  

const [selectedAddon, setSelectedAddon] = useState<
  "1-day" | "3-day" | "7-day" | "urgent"
>("3-day");
 const [openEditDropdown, setOpenEditDropdown] = useState<
  "salaryType" | "status" | "workSchedule" | null
>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 820);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);
useEffect(() => {
  if (!editingJob) return;

  const previousOverflow = document.body.style.overflow;

  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [editingJob]);
  useEffect(() => {
    loadPage();
  }, []);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "open").length;
  }, [jobs]);

  const premiumJobs = useMemo(() => {
    return jobs.filter((job) => job.is_premium).length;
  }, [jobs]);

  async function loadPage() {
    setCheckingAccess(true);

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
      showToast(profileError.message, "error");
      setCheckingAccess(false);
      return;
    }

    const myProfile = profileData as Profile;
    setProfile(myProfile);

    if (myProfile.role !== "job_owner" && myProfile.role !== "admin") {
  setCheckingAccess(false);
  return;
}

const { error: cleanupError } = await supabase.rpc(
  "cleanup_expired_job_visibility"
);

if (cleanupError) {
  console.error(cleanupError.message);
}

let query = supabase.from("jobs").select("*");

    if (myProfile.role !== "admin") {
      query = query.eq("owner_id", authData.user.id);
    }

    const { data: jobData, error: jobError } = await query.order("created_at", {
      ascending: false,
    });

    if (jobError) {
      showToast(jobError.message, "error");
      setCheckingAccess(false);
      return;
    }

    setJobs((jobData ?? []) as JobWithDetails[]);
    setCheckingAccess(false);
  }

  function updateEditField<K extends keyof JobWithDetails>(
    key: K,
    value: JobWithDetails[K]
  ) {
    if (!editingJob) return;
    setEditingJob({ ...editingJob, [key]: value });
  }

  async function saveJob(event: FormEvent) {
    event.preventDefault();

    if (!editingJob) return;

    setSaving(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        title: editingJob.title,
        company_name: editingJob.company_name,
        location: editingJob.location,
        job_type: editingJob.job_type,
        work_schedule: editingJob.work_schedule,
        duration: editingJob.duration,
        salary_type: editingJob.salary_type,
        salary_amount: editingJob.salary_amount,
        requirements: editingJob.requirements,
        is_premium: editingJob.is_premium,
        require_resume: editingJob.require_resume,
        status: editingJob.status,
        responsibilities: editingJob.responsibilities,
        who_can_apply: editingJob.who_can_apply,
        benefits: editingJob.benefits,
        openings: editingJob.openings,
        work_address: editingJob.work_address,
        contact_note: editingJob.contact_note,
      })
      .eq("id", editingJob.id);

    setSaving(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setEditingJob(null);
    await loadPage();
    showToast("Job updated successfully.", "success");
  }

  async function deleteJob(job: JobWithDetails) {
    setDeletingJobId(job.id);

    const { error } = await supabase.from("jobs").delete().eq("id", job.id);

    setDeletingJobId(null);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setJobToDelete(null);
    await loadPage();
    showToast("Job deleted successfully.", "success");
  }
function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}
async function buyVisibility() {
  if (!visibilityJob) return;

  setBuyingVisibility(true);

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    window.location.href = "/auth";
    return;
  }

  const loaded = await loadRazorpayScript();

  if (!loaded) {
    setBuyingVisibility(false);
    showToast("Couldn't load Razorpay", "error");
    return;
  }

  const orderResponse = await fetch("/api/razorpay/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tier: selectedAddon,
      jobId: visibilityJob.id,
    }),
  });

  const order = await orderResponse.json();

  if (!orderResponse.ok) {
    setBuyingVisibility(false);
    showToast(order.error, "error");
    return;
  }
async function updatePaymentAttemptStatus(
  orderId: string,
  status: "cancelled" | "failed"
) {
  await fetch("/api/razorpay/update-payment-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      status,
    }),
  });
}
  const razorpay = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: "HustleUp",
    description: "Visibility Add-on",

    theme: {
      color: "#ff5a1f",
    },

    handler: async function (response: any) {
      const verify = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(response),
      });

      const verifyData = await verify.json();

      setBuyingVisibility(false);

      if (!verify.ok) {
        showToast(verifyData.error, "error");
        return;
      }

      showToast("Visibility activated!", "success");

      setVisibilityJob(null);

      await loadPage();
    },

  modal: {
  async ondismiss() {
    await updatePaymentAttemptStatus(order.orderId, "cancelled");
    setBuyingVisibility(false);
  },
},
  });
razorpay.on("payment.failed", async function () {
  await updatePaymentAttemptStatus(order.orderId, "failed");
  setBuyingVisibility(false);
  showToast("Payment failed. Please try again.", "error");
});
  razorpay.open();
}
function isBoostActive(job: JobWithDetails) {
  if (!job.boost_type || !job.boost_expires_at) return false;

  return new Date(job.boost_expires_at).getTime() > Date.now();
}

function isUrgentActive(job: JobWithDetails) {
  if (!job.urgent_tag || !job.urgent_expires_at) return false;

  return new Date(job.urgent_expires_at).getTime() > Date.now();
}

function formatVisibilityDate(date?: string | null) {
  if (!date) return "Not active";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
  function EditDropdown({
    dropdownKey,
    value,
    options,
    onChange,
  }: {
   dropdownKey: "salaryType" | "status" | "workSchedule";
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }) {
    const isOpen = openEditDropdown === dropdownKey;
    const selectedLabel =
      options.find((option) => option.value === value)?.label || value;

    return (
      <div
        style={{
          position: "relative",
          zIndex: isOpen ? 99999 : 20,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpenEditDropdown(isOpen ? null : dropdownKey)}
          style={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: isOpen
              ? "1px solid rgba(255, 122, 0, 0.75)"
              : "1px solid rgba(255, 90, 31, 0.28)",
            borderRadius: 16,
            background: "var(--card-soft)",
            color: "var(--text)",
            padding: "0 14px",
            fontSize: 16,
            fontWeight: 850,
            fontFamily: "inherit",
            textAlign: "left",
            cursor: "pointer",
            boxShadow: isOpen
              ? "0 0 0 4px rgba(255, 122, 0, 0.12)"
              : "none",
          }}
        >
          <span>{selectedLabel}</span>

          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: isOpen
                ? "rgba(255, 122, 0, 0.18)"
                : "rgba(255, 90, 31, 0.1)",
              color: "#ff7a00",
              border: "1px solid rgba(255, 122, 0, 0.35)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition:
                "transform 0.18s ease, background 0.18s ease, color 0.18s ease",
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            ↓
          </span>
        </button>

        {isOpen && (
          <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,

                zIndex: 99999,

                background: "var(--card)",

                opacity: 1,

                isolation: "isolate",

                border: "1px solid rgba(255,122,0,0.35)",

                borderRadius: 24,

                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.55)",

                overflow: "hidden",
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
                    setOpenEditDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    border: selected
                      ? "1px solid rgba(255, 122, 0, 0.35)"
                      : "1px solid transparent",
                    borderRadius: 14,
                    background: selected
                      ? "var(--brand-soft)"
                      : "var(--card-soft)",
                    color: "var(--text)",
                    padding: "10px 12px",
                    fontSize: 15,
                    fontWeight: selected ? 950 : 800,
                    fontFamily: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    marginBottom: 6,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background =
                      "var(--brand-soft)";
                    event.currentTarget.style.borderColor =
                      "rgba(255, 122, 0, 0.35)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = selected
                      ? "var(--brand-soft)"
                      : "var(--card-soft)";
                    event.currentTarget.style.borderColor = selected
                      ? "rgba(255, 122, 0, 0.35)"
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

  if (checkingAccess) {
    return (
      <main className="container">
        <p>Checking jobs...</p>
      </main>
    );
  }

  if (profile?.role !== "job_owner" && profile?.role !== "admin") {
    return (
      <main className="container">
        <span className="badge">Access blocked</span>

        <h1>You cannot manage jobs.</h1>

        <p>
          Your current role is <strong>{profile?.role}</strong>. Only job owners
          and admins can manage posted jobs.
        </p>

        <div className="actions">
          <Link className="btn btn-primary" href="/jobs">
            Browse jobs
          </Link>

          <Link className="btn" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <ConfirmModal
        open={!!jobToDelete}
        title="Delete this job?"
        description={
          jobToDelete
            ? `You are about to delete "${jobToDelete.title}". This will permanently remove the job listing and may also remove related applications.`
            : ""
        }
        confirmText="Delete job"
        cancelText="Keep job"
        danger
        busy={deletingJobId === jobToDelete?.id}
        onClose={() => {
          if (!deletingJobId) {
            setJobToDelete(null);
          }
        }}
        onConfirm={() => {
          if (jobToDelete) {
            deleteJob(jobToDelete);
 
          }
        }}
      />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 22,
          alignItems: "stretch",
          marginBottom: 26,
        }}
      >
        <div>
          <span className="badge">Job management</span>

          <h1>
            {profile.role === "admin" ? "Manage all jobs." : "Manage your jobs."}
          </h1>

          <p className="hero-copy">
            Edit job details, update salary, close listings, mark premium jobs,
            or delete old test jobs.
          </p>

          <div className="actions">
            <Link
              className="btn btn-primary"
              style={primaryButtonStyle}
              href="/post-job"
            >
              Post new job
            </Link>

            <Link
              className="btn"
              style={secondaryButtonStyle}
              href="/applications"
            >
              View applicants
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? 14 : 18,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total jobs"
          value={jobs.length}
          hint={
            profile.role === "admin"
              ? "All platform listings."
              : "Jobs posted by you."
          }
          icon="💼"
          compact={isMobile}
        />

        <StatCard
          label="Open jobs"
          value={openJobs}
          hint="Listings currently visible to job seekers."
          icon="↗"
          compact={isMobile}
        />

        <StatCard
          label="Premium jobs"
          value={premiumJobs}
          hint="Listings highlighted with premium priority."
          icon="⭐"
          compact={isMobile}
        />
      </section>

      {jobs.length === 0 ? (
        <section
          className="card"
          style={{
            ...premiumCardStyle,
            borderRadius: 30,
            padding: 30,
          }}
        >
          <span className="tag">No jobs yet</span>

          <h3 style={{ marginTop: 14 }}>No posted jobs found.</h3>

          <p>Create a job first, then you can edit or delete it here.</p>

          <div className="actions">
            <Link
              className="btn btn-primary"
              style={primaryButtonStyle}
              href="/post-job"
            >
              Post a job
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "minmax(0, 1fr)"
              : "repeat(auto-fit, minmax(480px, 1fr))",
            gap: isMobile ? 18 : 22,
            width: "100%",
            maxWidth: "100%",
            overflow: "visible",
          }}
        >
          {jobs.map((job) => (
            <article
              key={job.id}
              style={{
                ...premiumCardStyle,
                width: "100%",
                maxWidth: "100%",
                borderRadius: isMobile ? 24 : 30,
                padding: isMobile ? 20 : 24,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0 0 auto 0",
                  height: 5,
                  background: job.is_premium
                    ? "var(--brand-gradient)"
                    : job.status === "open"
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                {job.is_premium && <Pill variant="premium">Premium</Pill>}

{isBoostActive(job) && (
  <Pill variant="premium">🔥 Boosted</Pill>
)}

{isUrgentActive(job) && (
  <Pill variant="danger">🚨 Urgent</Pill>
)}

<Pill variant={job.status === "open" ? "success" : "neutral"}>
  {job.status}
</Pill>
                </div>

                <Pill>{job.job_type || "Job"}</Pill>
              </div>

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  color: "var(--text)",
                  fontSize: isMobile ? 34 : "clamp(30px, 4vw, 44px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.05em",
                  overflowWrap: "anywhere",
                }}
              >
                {job.title}
              </h2>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 18,
                  color: "var(--muted)",
                  fontSize: isMobile ? 15 : 16,
                  overflowWrap: "anywhere",
                }}
              >
                <strong style={{ color: "var(--premium)" }}>
                  {job.company_name}
                </strong>
                {" · "}
                {job.location}
              </p>

            <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 18,
  }}
>
  <InfoTile
    label="Salary"
    value={`₹${job.salary_amount}/${job.salary_type}`}
  />

  <InfoTile
    label="Schedule"
    value={job.work_schedule || "Flexible"}
  />

  <InfoTile
    label="Timing"
    value={job.duration || "Flexible"}
  />

  <InfoTile
    label="Openings"
    value={job.openings || 1}
  />
</div>

<div
  style={{
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    background:
      isBoostActive(job) || isUrgentActive(job)
        ? "rgba(255,90,31,0.09)"
        : "var(--card-soft)",
    border:
      isBoostActive(job) || isUrgentActive(job)
        ? "1px solid rgba(255,90,31,0.28)"
        : "1px solid rgba(255,90,31,0.14)",
    boxShadow:
      isBoostActive(job) || isUrgentActive(job)
        ? "0 16px 34px rgba(255,90,31,0.10)"
        : "0 12px 28px rgba(0,0,0,0.08)",
  }}
>
  <small
    style={{
      display: "block",
      color: "var(--muted)",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: 8,
      fontSize: 11,
    }}
  >
    Visibility status
  </small>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    {isBoostActive(job) ? (
      <strong
        style={{
          color: "var(--brand)",
          fontWeight: 950,
        }}
      >
        🔥 {job.boost_type} Boost Active
      </strong>
    ) : (
      <strong
        style={{
          color: "var(--muted)",
          fontWeight: 850,
        }}
      >
        No active boost
      </strong>
    )}

    {isBoostActive(job) && (
      <span
        style={{
          color: "var(--muted)",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        Boost expires: {formatVisibilityDate(job.boost_expires_at)}
      </span>
    )}

    {isUrgentActive(job) && (
      <>
        <strong
          style={{
            color: "#dc2626",
            fontWeight: 950,
          }}
        >
          🚨 Urgent Hiring Active
        </strong>

        <span
          style={{
            color: "var(--muted)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Urgent tag expires: {formatVisibilityDate(job.urgent_expires_at)}
        </span>
      </>
    )}
  </div>
</div>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 24,
                  color: "var(--muted)",
                  fontWeight: 650,
                  lineHeight: 1.6,
                  minHeight: isMobile ? 0 : 52,
                  overflowWrap: "anywhere",
                }}
              >
                {job.requirements || "No requirements added."}
              </p>

              <div
                style={{
                  display: "grid",
                 gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <button
                  className="btn"
                  style={secondaryButtonStyle}
                  onClick={() => setEditingJob(job)}
                >
                  Edit job
                </button>
<button
  className="btn btn-primary"
  style={primaryButtonStyle}
  onClick={() => {
    setVisibilityJob(job);
    setSelectedAddon("3-day");
  }}
>
  🚀 Visibility
</button>
                <button
                  className="btn"
                  style={dangerButtonStyle}
                  onClick={() => setJobToDelete(job)}
                  disabled={deletingJobId === job.id}
                >
                  {deletingJobId === job.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

  {editingJob &&
  createPortal(
    <div
      className="job-modal-backdrop"
      onClick={() => setEditingJob(null)}
      style={{
        padding: isMobile ? 12 : 18,
      }}
    >
          <form
  className="job-modal edit-job-modal"
  onSubmit={saveJob}
            onClick={(event) => event.stopPropagation()}
           
          >
            
            <div
              style={{
                position: "absolute",
                inset: "0 0 auto 0",
                height: 5,
                background: "var(--brand-gradient)",
              }}
            />
          
            <button
              type="button"
              onClick={() => setEditingJob(null)}
              aria-label="Close edit job"
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(255,90,31,0.16)",
                background: "var(--card-soft)",
                color: "var(--text)",
                fontSize: 24,
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 12px 28px rgba(17,24,39,0.1)",
              }}
            >
              ×
            </button>

            <span className="badge">Edit job</span>

            <h2
              style={{
                marginTop: 14,
                paddingRight: 50,
                color: "var(--text)",
              }}
            >
              {editingJob.title}
            </h2>

            <div className="form">
              <label className="label">
                Job title
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.title}
                  onChange={(event) =>
                    updateEditField(
                      "title",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <label className="label">
                Company / shop name
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.company_name}
                  onChange={(event) =>
                    updateEditField(
                      "company_name",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <label className="label">
                Location
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.location}
                  onChange={(event) =>
                    updateEditField(
                      "location",
                      capitalizeWords(event.target.value)
                    )
                  }
                  required
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label className="label">
                  Job type
                  <input
                    className="input"
                    style={formValueStyle}
                    value={editingJob.job_type}
                    onChange={(event) =>
                      updateEditField(
                        "job_type",
                        capitalizeWords(event.target.value)
                      )
                    }
                  />
                </label>
<label className="label">
  Work schedule

  <EditDropdown
    dropdownKey="workSchedule"
    value={editingJob.work_schedule ?? "Flexible"}
    options={workScheduleOptions}
    onChange={(value) =>
      updateEditField("work_schedule", value)
    }
  />
</label>

{editingJob.work_schedule === "Custom" && (
  <label className="label">
    Custom schedule
    <input
      className="input"
      style={formValueStyle}
      value={editingJob.contact_note ?? ""}
      onChange={(event) =>
        updateEditField(
          "contact_note",
          event.target.value
        )
      }
      placeholder="Example: Tue - Sun"
    />
  </label>
)}
                <label className="label">
                  Duration / timing
                  <input
                    className="input"
                    style={formValueStyle}
                    value={editingJob.duration ?? ""}
                    onChange={(event) =>
                      updateEditField("duration", event.target.value)
                    }
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label className="label">
                  Salary type
                  <EditDropdown
                    dropdownKey="salaryType"
                    value={editingJob.salary_type}
                    options={[
                      { label: "Per hour", value: "hour" },
                      { label: "Per day", value: "day" },
                      { label: "Per week", value: "week" },
                      { label: "Per month", value: "month" },
                    ]}
                    onChange={(value) =>
                      updateEditField(
                        "salary_type",
                        value as JobWithDetails["salary_type"]
                      )
                    }
                  />
                </label>

                <label className="label">
                  Salary amount
                  <input
                    className="input"
                    style={formValueStyle}
                    type="number"
                    min={1}
                    value={editingJob.salary_amount}
                    onChange={(event) =>
                      updateEditField(
                        "salary_amount",
                        Number(event.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <label className="label">
                Requirements
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.requirements ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "requirements",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Responsibilities
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.responsibilities ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "responsibilities",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Who can apply?
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.who_can_apply ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "who_can_apply",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Benefits / perks
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.benefits ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "benefits",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label className="label">
                  Openings
                  <input
                    className="input"
                    style={formValueStyle}
                    type="number"
                    min={1}
                    value={editingJob.openings ?? 1}
                    onChange={(event) =>
                      updateEditField("openings", Number(event.target.value))
                    }
                  />
                </label>

                <label className="label">
                  Status
                  <EditDropdown
                    dropdownKey="status"
                    value={editingJob.status}
                    options={[
                      { label: "Open", value: "open" },
                      { label: "Closed", value: "closed" },
                    ]}
                    onChange={(value) =>
                      updateEditField(
                        "status",
                        value as JobWithDetails["status"]
                      )
                    }
                  />
                </label>
              </div>

              <label className="label">
                Work address / area
                <input
                  className="input"
                  style={formValueStyle}
                  value={editingJob.work_address ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "work_address",
                      capitalizeWords(event.target.value)
                    )
                  }
                />
              </label>

              <label className="label">
                Contact note
                <textarea
                  className="textarea"
                  style={textareaValueStyle}
                  value={editingJob.contact_note ?? ""}
                  onChange={(event) =>
                    updateEditField(
                      "contact_note",
                      capitalizeSentences(event.target.value)
                    )
                  }
                />
              </label>

              <label
                className="label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={editingJob.is_premium}
                  onChange={(event) =>
                    updateEditField("is_premium", event.target.checked)
                  }
                />
                Mark as premium listing
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={secondaryButtonStyle}
                  onClick={() => setEditingJob(null)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
              <div
  style={{
    height: 80,
    flexShrink: 0,
  }}
/>
            </div>
                  </form>
        </div>,
        document.body
      )}
      {visibilityJob &&
  createPortal(
    <div
      className="job-modal-backdrop"
      onClick={() => setVisibilityJob(null)}
    >
      <div
        className="job-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
        }}
      >
        <span className="badge">
          🚀 Visibility Add-ons
        </span>

        <h2
          style={{
            marginTop: 16,
          }}
        >
          {visibilityJob.title}
        </h2>

        <p
          style={{
            color: "var(--muted)",
            marginBottom: 28,
          }}
        >
          Increase your job's visibility and receive
          more applicants.
        </p>

        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {[
            {
              id: "1-day",
              title: "1-Day Boost",
              price: "₹49",
              desc: "Top placement for 24 hours",
            },
            {
              id: "3-day",
              title: "3-Day Boost",
              price: "₹99",
              desc: "Top placement for 3 days",
            },
            {
              id: "7-day",
              title: "7-Day Boost",
              price: "₹199",
              desc: "Maximum visibility",
            },
            {
              id: "urgent",
              title: "Urgent Hiring",
              price: "₹99",
              desc: "Shows an Urgent badge",
            },
          ].map((addon) => {
            const active =
              selectedAddon === addon.id;

            return (
              <button
                key={addon.id}
                type="button"
                onClick={() =>
                  setSelectedAddon(
                    addon.id as
                      | "1-day"
                      | "3-day"
                      | "7-day"
                      | "urgent"
                  )
                }
                style={{
                  padding: 18,
                  borderRadius: 18,
                  border: active
                    ? "2px solid var(--brand)"
                    : "1px solid var(--border)",
                  background: active
                    ? "rgba(255,90,31,.08)"
                    : "var(--card)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <strong>
                    {addon.title}
                  </strong>

                  <strong>
                    {addon.price}
                  </strong>
                </div>

                <p
                  style={{
                    marginTop: 8,
                    color: "var(--muted)",
                  }}
                >
                  {addon.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 28,
          }}
        >
          <button
            className="btn"
            onClick={() =>
              setVisibilityJob(null)
            }
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
           onClick={buyVisibility}
disabled={buyingVisibility}
          >
         {buyingVisibility ? "Opening..." : "Continue to Payment"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
    </main>
  );
}