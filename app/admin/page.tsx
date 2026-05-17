"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/Toast";
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

const premiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,90,31,0.14)",
  background:
    "radial-gradient(circle at 8% 8%, rgba(255,90,31,0.08), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  boxShadow: "0 24px 60px rgba(17,24,39,0.08)",
};

const actionButtonStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 15,
  padding: "0 16px",
  fontWeight: 850,
  fontSize: 14,
  boxShadow: "0 12px 28px rgba(17,24,39,0.08)",
};

const secondaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  border: "1px solid rgba(255,90,31,0.16)",
  color: "var(--premium)",
};

const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  boxShadow:
    "0 18px 40px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
};

const dangerButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "linear-gradient(180deg, #fff7f7, #fff1f1)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#b91c1c",
};

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
      boxShadow: "0 14px 30px rgba(17,24,39,0.12)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        alignItems: "center",
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 12,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {children}
    </span>
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
        borderRadius: compact ? 18 : 28,
        padding: compact ? 14 : 24,
        minHeight: compact ? 118 : 170,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: compact ? 4 : 5,
          background: "var(--brand-gradient)",
        }}
      />

      <div
        style={{
          width: compact ? 30 : 42,
          height: compact ? 30 : 42,
          borderRadius: compact ? 12 : 16,
          display: "grid",
          placeItems: "center",
          background: "var(--brand-soft)",
          color: "var(--brand-dark)",
          fontWeight: 900,
          fontSize: compact ? 14 : 18,
          marginBottom: compact ? 12 : 16,
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: 0,
          color: "var(--muted)",
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: compact ? 10 : 12,
        }}
      >
        {label}
      </p>

      <div
        className="stat"
        style={{
          marginTop: compact ? 6 : 8,
          marginBottom: compact ? 0 : 8,
          color: "var(--premium)",
          fontSize: compact ? 30 : undefined,
          lineHeight: 1,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      {!compact && (
        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontWeight: 650,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 24,
        marginTop: 24,
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

      <div style={{ marginBottom: 18 }}>
        <span className="tag">Admin section</span>

        <h2 style={{ marginTop: 14, marginBottom: 8 }}>{title}</h2>

        <p style={{ margin: 0 }}>{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div>
      <strong
        style={{
          display: "block",
          color: "var(--premium)",
          marginBottom: 8,
        }}
      >
        {score}%
      </strong>

      <div className="profile-score-bar">
        <div style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div
      className="table-wrap"
      style={{
        borderRadius: 24,
        border: "1px solid rgba(255,90,31,0.12)",
        background: "rgba(255,255,255,0.72)",
        boxShadow: "0 14px 34px rgba(17,24,39,0.06)",
        overflowX: "auto",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [profile, setProfile] = useState<UpgradedProfile | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [users, setUsers] = useState<UpgradedProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const toastType =
    message.includes("upgraded") ||
    message.includes("verified") ||
    message.includes("unverified") ||
    message.includes("Waitlist user")
      ? "success"
      : "error";

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 820);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadAdmin();
  }, []);

  const verifiedUsers = useMemo(() => {
    return users.filter((user) => user.is_verified).length;
  }, [users]);

  const premiumUsers = useMemo(() => {
    return users.filter((user) => user.tier === "premium").length;
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

    const filled = fields.filter(
      (field) => field && field.trim().length > 0
    ).length;

    return Math.round((filled / fields.length) * 100);
  }

  async function loadAdmin(clearMessage = true) {
    setLoading(true);

    if (clearMessage) {
      setMessage("");
    }

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
        supabase
          .from("waitlist")
          .select("*")
          .order("score", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").order("created_at", {
          ascending: false,
        }),
      ]);

    setWaitlist((waitlistData ?? []) as WaitlistItem[]);
    setUsers((userData ?? []) as UpgradedProfile[]);
    setJobs((jobData ?? []) as Job[]);
    setLoading(false);
  }

  async function updateWaitlist(id: string, status: "approved" | "rejected") {
    setMessage("");

    const { error } = await supabase
      .from("waitlist")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadAdmin(false);
    setMessage(`Waitlist user ${status}.`);
  }

  async function upgradeUser(id: string, tier: Tier) {
    setUpdatingUserId(id);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ tier })
      .eq("id", id);

    setUpdatingUserId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadAdmin(false);
    setMessage(`User upgraded to ${tier}.`);
  }

  async function toggleVerified(user: UpgradedProfile) {
    setUpdatingUserId(user.id);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !user.is_verified })
      .eq("id", user.id);

    setUpdatingUserId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadAdmin(false);

    setMessage(
      user.is_verified
        ? `${user.full_name || user.email} is now unverified.`
        : `${user.full_name || user.email} is now verified.`
    );
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
        <Toast
          message={message}
          type={toastType}
          onClose={() => setMessage("")}
        />

        <span className="badge">Admin</span>
        <h1>Access blocked.</h1>
        <p>
          Your current role is <strong>{profile?.role}</strong>.
        </p>
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

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 18,
          padding: isMobile ? "24px 0 16px" : "54px 0 26px",
        }}
      >
        <div>
          <span className="badge">Admin Control</span>
          <h1>Run HustleUp.</h1>
          <p className="hero-copy">
            Manage waitlist, users, tiers, verification status, jobs, and
            platform quality.
          </p>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? 10 : 18,
        }}
      >
        <StatCard
          label="Waitlist"
          value={waitlist.length}
          hint="Users waiting for access approval."
          icon="⏳"
          compact={isMobile}
        />

        <StatCard
          label="Users"
          value={users.length}
          hint="All registered platform profiles."
          icon="👥"
          compact={isMobile}
        />

        <StatCard
          label="Jobs"
          value={jobs.length}
          hint="All jobs posted on HustleUp."
          icon="💼"
          compact={isMobile}
        />

        <StatCard
          label="Verified"
          value={verifiedUsers}
          hint="Profiles approved by admin."
          icon="✓"
          compact={isMobile}
        />

        <StatCard
          label="Premium"
          value={premiumUsers}
          hint="Users currently on premium tier."
          icon="⭐"
          compact={isMobile}
        />

        <StatCard
          label="Admin"
          value={profile.full_name || "You"}
          hint="Current admin account."
          icon="⚙"
          compact={isMobile}
        />
      </section>

      <SectionCard
        title="Users & verification"
        subtitle="Review users, upgrade tiers, and control verified badges."
      >
        <TableWrap>
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
              {users.map((user) => {
                const completion = profileCompletion(user);

                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.full_name || "Unnamed user"}</strong>
                      <br />
                      <span>{user.email}</span>
                    </td>

                    <td>
                      <Pill>{user.role}</Pill>
                    </td>

                    <td>
                      <Pill
                        variant={
                          user.tier === "premium" ? "premium" : "neutral"
                        }
                      >
                        {user.tier}
                      </Pill>
                    </td>

                    <td>
                      <ScoreBar score={completion} />
                    </td>

                    <td>
                      {user.is_verified ? (
                        <Pill variant="success">Verified</Pill>
                      ) : (
                        <Pill variant="danger">Not verified</Pill>
                      )}
                    </td>

                    <td>
                      <div className="admin-action-row">
                        <button
                          className="btn"
                          style={secondaryButtonStyle}
                          onClick={() => upgradeUser(user.id, "basic")}
                          disabled={updatingUserId === user.id}
                        >
                          Basic
                        </button>

                        <button
                          className="btn"
                          style={secondaryButtonStyle}
                          onClick={() => upgradeUser(user.id, "premium")}
                          disabled={updatingUserId === user.id}
                        >
                          Premium
                        </button>

                        <button
                          className="btn"
                          style={secondaryButtonStyle}
                          onClick={() => upgradeUser(user.id, "advanced")}
                          disabled={updatingUserId === user.id}
                        >
                          Advanced
                        </button>
                      </div>
                    </td>

                    <td>
                      <button
                        className={user.is_verified ? "btn" : "btn btn-primary"}
                        style={
                          user.is_verified
                            ? dangerButtonStyle
                            : primaryButtonStyle
                        }
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
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <SectionCard
        title="Waitlist"
        subtitle="Approve strong users or reject low-quality entries."
      >
        <TableWrap>
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
                  <td>
                    <strong>{item.full_name}</strong>
                  </td>
                  <td>{item.email}</td>
                  <td>
                    <Pill>{item.role}</Pill>
                  </td>
                  <td>
                    <strong>{item.score}</strong>
                  </td>
                  <td>
                    <Pill
                      variant={
                        item.status === "approved"
                          ? "success"
                          : item.status === "rejected"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {item.status}
                    </Pill>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button
                        className="btn"
                        style={secondaryButtonStyle}
                        onClick={() => updateWaitlist(item.id, "approved")}
                      >
                        Approve
                      </button>

                      <button
                        className="btn"
                        style={dangerButtonStyle}
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
        </TableWrap>
      </SectionCard>

      <SectionCard
        title="Jobs"
        subtitle="Inspect active platform listings and salary data."
      >
        <TableWrap>
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
                  <td>
                    <strong>{job.title}</strong>
                  </td>
                  <td>{job.company_name}</td>
                  <td>{job.location}</td>
                  <td>
                    <strong>
                      ₹{job.salary_amount}/{job.salary_type}
                    </strong>
                  </td>
                  <td>
                    <Pill
                      variant={job.status === "open" ? "success" : "neutral"}
                    >
                      {job.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>
    </main>
  );
}