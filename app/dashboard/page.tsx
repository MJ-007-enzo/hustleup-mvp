"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";
import { ownerPlanLimits } from "@/lib/ownerPlans";

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



function applicationUsageText(tier: string | null | undefined, count: number) {
  const limit = applicationLimitForTier(tier);

  if (limit === null) {
    return "Unlimited";
  }

  return `${count}/${limit}`;
}

function applicationsRemainingText(
  tier: string | null | undefined,
  count: number
) {
  const limit = applicationLimitForTier(tier);

  if (limit === null) {
    return "Unlimited applications available this month.";
  }

  const remaining = Math.max(0, limit - count);

  if (remaining === 0) {
    return "Monthly application limit reached. Upgrade to apply more.";
  }

  return `${remaining} application${remaining === 1 ? "" : "s"} remaining this month.`;
}

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
          overflowWrap: "anywhere",
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

function GuideItem({
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
        padding: "12px 13px",
        borderRadius: 16,
        background: locked
          ? "linear-gradient(180deg, #fff7f7, #fff1f1)"
          : "rgba(255,255,255,0.78)",
        border: locked
          ? "1px solid rgba(239,68,68,0.18)"
          : "1px solid rgba(255,90,31,0.12)",
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
          background: locked ? "#fee2e2" : "var(--brand-soft)",
          color: locked ? "#b91c1c" : "var(--brand-dark)",
          fontWeight: 850,
          flexShrink: 0,
          fontSize: 13,
        }}
      >
        {locked ? "!" : "✓"}
      </span>

      <span
        style={{
          color: locked ? "#b91c1c" : "var(--muted)",
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

function planTitle(tier?: string | null) {
  if (tier === "basic") return "Basic access";
  if (tier === "premium") return "Premium access";
  if (tier === "advanced") return "Advanced access";
  return "Beginner access";
}

function planDescription(tier?: string | null) {
  if (tier === "basic") {
    return "You get 12 applications per month and can view Premium job details, but Premium applications are still locked.";
  }

  if (tier === "premium") {
    return "You have unlimited applications and full Premium job access.";
  }

  if (tier === "advanced") {
    return "You have admin-controlled rare access with unlimited applications, maximum visibility, and future priority benefits.";
  }

  return "You get 5 applications per month. Premium listings are visible but locked.";
}

function PlanAccessCard({
  profile,
  monthlyApplicationCount,
}: {
  profile: Profile;
  monthlyApplicationCount: number;
}) {
  const tier = profile.tier || "beginner";
  const isBeginner = tier === "beginner";
  const isBasic = tier === "basic";
  const isPremium = tier === "premium";
  const isAdvanced = tier === "advanced";

  const monthlyLimit = applicationLimitForTier(tier);
  const isLimitReached =
    monthlyLimit !== null && monthlyApplicationCount >= monthlyLimit;

  return (
    <section
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 28,
        marginTop: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 5,
          background:
            isPremium || isAdvanced
              ? "var(--brand-gradient)"
              : "rgba(255,90,31,0.18)",
        }}
      />

      <span className={isPremium || isAdvanced ? "premium-badge" : "tag"}>
        {tier}
      </span>

      <h2 style={{ marginTop: 16 }}>{planTitle(tier)}</h2>

      <p>{planDescription(tier)}</p>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 18,
        }}
      >
        <GuideItem>
          Monthly applications:{" "}
          {applicationUsageText(tier, monthlyApplicationCount)}
        </GuideItem>

        <GuideItem locked={isLimitReached}>
          {applicationsRemainingText(tier, monthlyApplicationCount)}
        </GuideItem>

        <GuideItem>Regular jobs unlocked</GuideItem>

        <GuideItem locked={isBeginner}>
          Premium job details {isBeginner ? "locked" : "unlocked"}
        </GuideItem>

        <GuideItem locked={isBeginner || isBasic}>
          Premium job applications{" "}
          {isPremium || isAdvanced ? "unlocked" : "locked"}
        </GuideItem>

        <GuideItem locked={isBeginner}>
          Profile visibility{" "}
          {isPremium || isAdvanced
            ? "priority level"
            : isBasic
              ? "improved level"
              : "standard level"}
        </GuideItem>
      </div>

      {(isBeginner || isBasic || isLimitReached) && (
        <div className="actions">
          <ActionLink primary href="/pricing">
            Upgrade plan
          </ActionLink>

          <ActionLink href="/jobs">Browse jobs</ActionLink>
        </div>
      )}
    </section>
  );
}

function OwnerPlanCard({
  profile,
  jobCount,
}: {
  profile: Profile;
  jobCount: number;
}) {
  const limits = ownerPlanLimits(profile.owner_plan);

  return (
    <section
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 28,
        marginTop: 24,
      }}
    >
      <span className="premium-badge">
        {profile.owner_plan.toUpperCase()}
      </span>

      <h2 style={{ marginTop: 18 }}>
        Current Owner Plan
      </h2>

      <p>
        Your subscription controls how many jobs you can post,
        how many applicants you can view,
        resume downloads,
        boosts,
        and future premium hiring tools.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <StatCard
          label="Active Jobs"
          value={`${jobCount}/${limits.activeJobs}`}
          hint="Current usage"
          icon="💼"
        />

        <StatCard
          label="Applicants Visible"
          value={String(limits.applicantVisibility)}
          hint="Per month"
          icon="👥"
        />

        <StatCard
          label="Resume Downloads"
          value={String(limits.resumeDownloads)}
          hint="Per month"
          icon="📄"
        />

        <StatCard
          label="Job Boosts"
          value={String(limits.boosts)}
          hint="Every month"
          icon="🚀"
        />
      </div>

      <div className="actions">
        <ActionLink primary href="/pricing">
          Upgrade Plan
        </ActionLink>
      </div>
    </section>
  );
}
function insightMessage(
  averageApplications: number,
  conversionRate: number
) {
  if (conversionRate >= 15) {
    return "Excellent performance! Your jobs are converting visitors into applicants very effectively.";
  }

  if (averageApplications >= 10) {
    return "Your jobs attract strong interest. Consider boosting your best listings to reach even more candidates.";
  }

  if (averageApplications >= 5) {
    return "Your jobs are performing well. Improving job descriptions or salary details could increase applications.";
  }

  return "Your jobs need more visibility. Try boosting a listing or improving your job description to attract more applicants.";
}
export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [topJobTitle, setTopJobTitle] = useState("No jobs yet");
const [topJobApplications, setTopJobApplications] = useState(0);
const [averageApplications, setAverageApplications] = useState(0);
const [totalViews, setTotalViews] = useState(0);
const [conversionRate, setConversionRate] = useState(0);
const [jobAnalytics, setJobAnalytics] = useState<
  {
    title: string;
    applications: number;
  }[]
>([]);
  const [monthlyApplicationCount, setMonthlyApplicationCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("Active");
const [renewalDate, setRenewalDate] = useState("Not available");
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
    const monthStart = getCurrentMonthStartISO();

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
if (myProfile.owner_plan_expires_at) {
  setRenewalDate(
    new Date(myProfile.owner_plan_expires_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  );
} else {
  setRenewalDate("No renewal date");
}

setSubscriptionStatus(
  myProfile.owner_plan === "free" ? "Free Plan" : "Active"
);
    const { count: monthlyApps } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("seeker_id", userId)
      .gte("created_at", monthStart);

    setMonthlyApplicationCount(monthlyApps ?? 0);

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
  .select("id, title, views")
  .eq("owner_id", userId);

const ownerJobIds = jobs?.map((job) => job.id) ?? [];
setJobCount(ownerJobIds.length);

if (ownerJobIds.length > 0) {
  const { data: appData, count: apps } = await supabase
  .from("applications")
  .select("*", { count: "exact" })
  .in("job_id", ownerJobIds);

setApplicationCount(apps ?? 0);

const applicationCounts = new Map<string, number>();

(appData ?? []).forEach((application) => {
  applicationCounts.set(
    application.job_id,
    (applicationCounts.get(application.job_id) ?? 0) + 1
  );
});

let bestJob = "No jobs yet";
let bestCount = 0;

jobs?.forEach((job) => {
  const count = applicationCounts.get(job.id) ?? 0;

  if (count > bestCount) {
    bestCount = count;
    bestJob = job.title;
  }
});

setTopJobTitle(bestJob);
setTopJobApplications(bestCount);

setAverageApplications(
  ownerJobIds.length > 0
    ? Number(((apps ?? 0) / ownerJobIds.length).toFixed(1))
    : 0
);
const views = (jobs ?? []).reduce(
  (sum, job) => sum + (job.views ?? 0),
  0
);

setTotalViews(views);

setConversionRate(
  views > 0
    ? Number((((apps ?? 0) / views) * 100).toFixed(1))
    : 0
);
const analytics = (jobs ?? []).map((job) => ({
  title: job.title,
  applications: applicationCounts.get(job.id) ?? 0,
}));

analytics.sort((a, b) => b.applications - a.applications);

setJobAnalytics(analytics);
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
            <GuideItem>
              {`Monthly applications: ${applicationUsageText(
                profile?.tier,
                monthlyApplicationCount
              )}`}
            </GuideItem>
          </div>
        </div>
      </section>

      {message && <div className="notice error">{message}</div>}

      {profile && (
        <PlanAccessCard
          profile={profile}
          monthlyApplicationCount={monthlyApplicationCount}
        />
      )}

      {profile?.role === "admin" && (
        <>
          <section className="grid grid-3" style={{ marginTop: 24 }}>
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
          <section className="grid grid-3" style={{ marginTop: 24 }}>
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
          <section
  className="card"
  style={{
    ...premiumCardStyle,
    borderRadius: 30,
    padding: 28,
    marginTop: 24,
  }}
>
  <span className="premium-badge">📊 Company Analytics</span>

  <h2 style={{ marginTop: 18 }}>
    Hiring Performance
  </h2>

  <p>
    Track how your jobs are performing and identify which listings attract the
    most applicants.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 16,
      marginTop: 24,
    }}
  >
    <StatCard
      label="Active Jobs"
      value={jobCount}
      hint="Currently posted jobs"
      icon="💼"
    />

    <StatCard
      label="Applications"
      value={applicationCount}
      hint="Across all your jobs"
      icon="📩"
    />

    <StatCard
      label="Top Job"
      value={topJobTitle}
      hint={`${topJobApplications} application${topJobApplications === 1 ? "" : "s"}`}
      icon="🏆"
    />

    <StatCard
      label="Average / Job"
      value={averageApplications}
      hint="Applications per job"
      icon="📈"
    />
    <StatCard
  label="Total Views"
  value={totalViews}
  hint="People who opened your jobs"
  icon="👀"
/>

<StatCard
  label="Conversion Rate"
  value={`${conversionRate}%`}
  hint="Applications ÷ Views"
  icon="📈"
/>
  </div>
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
  <span className="premium-badge">🏆 Job Performance</span>

  <h2 style={{ marginTop: 18 }}>
    Your Job Rankings
  </h2>

  <div
    style={{
      display: "grid",
      gap: 12,
      marginTop: 22,
    }}
  >
    {jobAnalytics.length === 0 ? (
      <p>No jobs yet.</p>
    ) : (
      jobAnalytics.map((job) => (
        <div
          key={job.title}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 18,
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <strong>{job.title}</strong>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <strong>{job.applications}</strong>
            <br />
            <small>
              {job.applications >= 15
                ? "🟢 Excellent"
                : job.applications >= 8
                ? "🟡 Good"
                : "🔴 Needs Attention"}
            </small>
          </div>
        </div>
      ))
    )}
  </div>
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
  <span className="premium-badge">💡 Smart Hiring Insights</span>

  <h2 style={{ marginTop: 18 }}>
    Recommendations
  </h2>

  <p>{insightMessage(averageApplications, conversionRate)}</p>

  <div
    style={{
      display: "grid",
      gap: 12,
      marginTop: 20,
    }}
  >
    <GuideItem>
      🏆 Best performing job: <strong>{topJobTitle}</strong>
    </GuideItem>

    <GuideItem>
      📈 Average applications per job:{" "}
      <strong>{averageApplications}</strong>
    </GuideItem>

    <GuideItem>
      👀 Total job views: <strong>{totalViews}</strong>
    </GuideItem>

    <GuideItem>
      📊 Conversion rate:{" "}
      <strong>{conversionRate}%</strong>
    </GuideItem>
  </div>
</section>
          <OwnerPlanCard
            profile={profile}
            jobCount={jobCount}
          />
          <section
  className="card"
  style={{
    ...premiumCardStyle,
    borderRadius: 30,
    padding: 28,
    marginTop: 24,
  }}
>
  <span className="premium-badge">💳 Subscription History</span>

  <h2 style={{ marginTop: 18 }}>
    Billing Overview
  </h2>

  <p>
    View your current subscription and upcoming renewal details.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 16,
      marginTop: 24,
    }}
  >
    <StatCard
      label="Current Plan"
      value={profile.owner_plan.toUpperCase()}
      hint="Active subscription"
      icon="⭐"
    />

    <StatCard
      label="Status"
      value={subscriptionStatus}
      hint="Subscription status"
      icon="🟢"
    />

    <StatCard
      label="Renewal"
      value={renewalDate}
      hint="Next renewal date"
      icon="📅"
    />

    <StatCard
      label="Invoices"
      value="Coming Soon"
      hint="Download invoices"
      icon="🧾"
    />
  </div>

  <div className="actions">
    <ActionLink primary href="/pricing">
      Upgrade Plan
    </ActionLink>

    <ActionLink href="#">
      Billing History
    </ActionLink>
  </div>
</section>
        </>
      )}

      {profile?.role === "job_seeker" && (
        <>
          <section className="grid grid-3" style={{ marginTop: 24 }}>
            <StatCard
              label="Applications sent"
              value={applicationCount}
              hint="Jobs you have applied for."
              icon="📩"
            />

            <StatCard
              label="This month"
              value={applicationUsageText(profile.tier, monthlyApplicationCount)}
              hint={applicationsRemainingText(
                profile.tier,
                monthlyApplicationCount
              )}
              icon="📅"
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