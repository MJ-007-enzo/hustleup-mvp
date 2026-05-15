"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

const premiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,90,31,0.14)",
  background:
    "radial-gradient(circle at 8% 8%, rgba(255,90,31,0.08), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  boxShadow: "0 24px 60px rgba(17,24,39,0.08)",
};

const actionButtonStyle: CSSProperties = {
  minHeight: 54,
  borderRadius: 18,
  padding: "0 22px",
  fontWeight: 850,
  fontSize: 15,
  letterSpacing: "-0.01em",
  boxShadow: "0 14px 34px rgba(17,24,39,0.08)",
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

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 28,
        padding: 24,
        minHeight: 178,
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
          width: 42,
          height: 42,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: "var(--brand-soft)",
          color: "var(--brand-dark)",
          fontWeight: 900,
          fontSize: 18,
          marginBottom: 16,
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
          fontSize: 12,
        }}
      >
        {label}
      </p>

      <div
        className="stat"
        style={{
          marginTop: 8,
          marginBottom: 8,
          color: "var(--premium)",
        }}
      >
        {value}
      </div>

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
    </div>
  );
}

function ActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      className={primary ? "btn btn-primary" : "btn"}
      href={href}
      style={primary ? primaryButtonStyle : secondaryButtonStyle}
    >
      {children}
    </Link>
  );
}

function GuideItem({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 13px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.78)",
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
          fontSize: 15,
          lineHeight: 1.35,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const userId = authData.user.id;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profileData) {
      setMessage(profileError?.message || "Profile not found.");
      setLoading(false);
      return;
    }

    const myProfile = profileData as Profile;
    setProfile(myProfile);

    if (myProfile.role === "admin") {
      const [
        { count: users },
        { count: jobs },
        { count: apps },
        { count: waitlist },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true }),
        supabase.from("waitlist").select("*", { count: "exact", head: true }),
      ]);

      setUserCount(users ?? 0);
      setJobCount(jobs ?? 0);
      setApplicationCount(apps ?? 0);
      setWaitlistCount(waitlist ?? 0);
    }

    if (myProfile.role === "job_owner") {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("owner_id", userId);

      const ownerJobIds = jobs?.map((job) => job.id) ?? [];
      setJobCount(ownerJobIds.length);

      if (ownerJobIds.length > 0) {
        const { count: apps } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", ownerJobIds);

        setApplicationCount(apps ?? 0);
      }
    }

    if (myProfile.role === "job_seeker") {
      const { count: apps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("seeker_id", userId);

      setApplicationCount(apps ?? 0);
    }

    setLoading(false);
  }

  function roleTitle() {
    if (profile?.role === "admin") return "Platform command center.";
    if (profile?.role === "job_owner") return "Manage your hiring flow.";
    return "Build your job journey.";
  }

  function roleDescription() {
    if (profile?.role === "admin") {
      return "Track platform users, jobs, applications, and waitlist activity from one place.";
    }

    if (profile?.role === "job_owner") {
      return "Post jobs, review applicants, and move strong candidates through your hiring pipeline.";
    }

    return "Browse jobs, track your applications, improve your profile, and upgrade when you need better visibility.";
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 22,
          alignItems: "stretch",
          marginBottom: 26,
        }}
      >
        <div>
          <span className="badge">Dashboard</span>

          <h1>Hello, {profile?.full_name || "Hustler"}.</h1>

          <p className="hero-copy">{roleDescription()}</p>
        </div>

        <div
          className="card"
          style={{
            ...premiumCardStyle,
            borderRadius: 30,
            padding: 24,
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

          <span className="tag">{roleTitle()}</span>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 18,
            }}
          >
            <GuideItem>{`Role: ${profile?.role || "user"}`}</GuideItem>
            <GuideItem>{`Plan: ${profile?.tier || "beginner"}`}</GuideItem>
          </div>
        </div>
      </section>

      {message && <div className="notice error">{message}</div>}

      {profile?.role === "admin" && (
        <>
          <section className="grid grid-3">
            <StatCard
              label="Total users"
              value={userCount}
              hint="All registered HustleUp profiles."
              icon="👥"
            />

            <StatCard
              label="Total jobs"
              value={jobCount}
              hint="All jobs posted on the platform."
              icon="💼"
            />

            <StatCard
              label="Applications"
              value={applicationCount}
              hint="Total application activity."
              icon="📩"
            />

            <StatCard
              label="Waitlist"
              value={waitlistCount}
              hint="Users waiting for access or updates."
              icon="⏳"
            />

            <StatCard
              label="Your tier"
              value={profile.tier}
              hint="Current account subscription level."
              icon="⭐"
            />

            <StatCard
              label="Your role"
              value="Admin"
              hint="Full platform management access."
              icon="⚙"
            />
          </section>

          <section
            className="card"
            style={{
              ...premiumCardStyle,
              borderRadius: 30,
              padding: 28,
              marginTop: 24,
            }}
          >
            <span className="tag">Admin actions</span>

            <h2 style={{ marginTop: 14 }}>Control the platform.</h2>

            <p>
              Use these shortcuts to verify users, manage applications, and
              inspect live job listings.
            </p>

            <div className="actions">
              <ActionLink primary href="/admin">
                Open admin panel
              </ActionLink>

              <ActionLink href="/applications">Manage applications</ActionLink>

              <ActionLink href="/jobs">View jobs</ActionLink>
            </div>
          </section>
        </>
      )}

      {profile?.role === "job_owner" && (
        <>
          <section className="grid grid-3">
            <StatCard
              label="Jobs posted"
              value={jobCount}
              hint="Your active and previous listings."
              icon="💼"
            />

            <StatCard
              label="Applications received"
              value={applicationCount}
              hint="Applicants across your job posts."
              icon="📩"
            />

            <StatCard
              label="Tier"
              value={profile.tier}
              hint="Your current HustleUp access level."
              icon="⭐"
            />
          </section>

          <section
            className="card"
            style={{
              ...premiumCardStyle,
              borderRadius: 30,
              padding: 28,
              marginTop: 24,
            }}
          >
            <span className="tag">Owner actions</span>

            <h2 style={{ marginTop: 14 }}>Hire faster with cleaner listings.</h2>

            <p>
              Post a job, review applicants, and keep your profile ready so
              students trust your listing.
            </p>

            <div className="actions">
              <ActionLink primary href="/post-job">
                Post a job
              </ActionLink>

              <ActionLink href="/applications">View applicants</ActionLink>

              <ActionLink href="/profile">Complete company profile</ActionLink>
            </div>
          </section>
        </>
      )}

      {profile?.role === "job_seeker" && (
        <>
          <section className="grid grid-3">
            <StatCard
              label="Applications sent"
              value={applicationCount}
              hint="Jobs you have applied for."
              icon="📩"
            />

            <StatCard
              label="Tier"
              value={profile.tier}
              hint="Your current visibility level."
              icon="⭐"
            />

            <StatCard
              label="Role"
              value="Seeker"
              hint="You can browse and apply for jobs."
              icon="↗"
            />
          </section>

          <section
            className="card"
            style={{
              ...premiumCardStyle,
              borderRadius: 30,
              padding: 28,
              marginTop: 24,
            }}
          >
            <span className="tag">Seeker actions</span>

            <h2 style={{ marginTop: 14 }}>Find better part-time work.</h2>

            <p>
              Browse jobs, track your applications, and improve your profile to
              increase your chance of getting shortlisted.
            </p>

            <div className="actions">
              <ActionLink primary href="/jobs">
                Browse jobs
              </ActionLink>

              <ActionLink href="/applications">Track applications</ActionLink>

              <ActionLink href="/profile">Improve profile</ActionLink>

              <ActionLink href="/pricing">Upgrade plan</ActionLink>
            </div>
          </section>
        </>
      )}
    </main>
  );
}