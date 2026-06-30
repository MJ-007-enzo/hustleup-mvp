"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type WaitlistRole = "job_seeker" | "job_owner";

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

const formValueStyle: CSSProperties = {
  color: "var(--premium)",
  fontSize: "16px",
  fontWeight: 750,
  fontFamily: "inherit",
};

const textareaValueStyle: CSSProperties = {
  color: "var(--premium)",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.55,
};

function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function capitalizeSentences(value: string) {
  return value.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) =>
    match.toUpperCase()
  );
}

function BenefitRow({ children }: { children: ReactNode }) {
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

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 26,
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
        className="stat"
        style={{
          color: "var(--brand)",
          marginBottom: 16,
        }}
      >
        {number}
      </div>

      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginBottom: 0 }}>{description}</p>
    </div>
  );
}

function FeatureCard({
  badge,
  title,
  description,
  features,
  primaryHref,
  primaryText,
  secondaryHref,
  secondaryText,
}: {
  badge: string;
  title: string;
  description: string;
  features: string[];
  primaryHref: string;
  primaryText: string;
  secondaryHref: string;
  secondaryText: string;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 28,
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

      <span className="badge">{badge}</span>

      <h2 style={{ marginTop: 16 }}>{title}</h2>

      <p>{description}</p>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 18,
          marginBottom: 22,
        }}
      >
        {features.map((feature) => (
          <BenefitRow key={feature}>{feature}</BenefitRow>
        ))}
      </div>

      <div className="actions">
        <Link className="btn btn-primary" style={primaryButtonStyle} href={primaryHref}>
          {primaryText}
        </Link>

        <Link className="btn" style={secondaryButtonStyle} href={secondaryHref}>
          {secondaryText}
        </Link>
      </div>
    </div>
  );
}

function PriceCard({
  tier,
  price,
  description,
  premium = false,
}: {
  tier: string;
  price: string;
  description: string;
  premium?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        ...premiumCardStyle,
        borderRadius: 30,
        padding: 26,
        border: premium
          ? "1px solid rgba(245,158,11,0.4)"
          : "1px solid rgba(255,90,31,0.14)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 5,
          background: premium ? "var(--brand-gradient)" : "rgba(255,90,31,0.18)",
        }}
      />

      <span className={premium ? "premium-badge" : "tag"}>
        {premium ? "Premium" : tier}
      </span>

      <div className="price" style={{ marginTop: 18 }}>
        {price}
      </div>

      <p style={{ marginBottom: 0 }}>{description}</p>
    </div>
  );
}

export default function HomePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WaitlistRole>("job_seeker");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function joinWaitlist(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const score = Math.min(
      100,
      50 + Math.floor(skills.length / 5) + (role === "job_owner" ? 10 : 0)
    );

    const { error } = await supabase.from("waitlist").insert({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      skills,
      score,
      status: "waiting",
    });

    setBusy(false);

    if (error) {
      setMessage(
        error.message.includes("duplicate")
          ? "This email is already on the waitlist."
          : error.message
      );
      return;
    }

    setFullName("");
    setEmail("");
    setSkills("");
    setMessage("You joined the HustleUp waitlist successfully.");
  }

  function RoleChoice({
    value,
    title,
    description,
    icon,
  }: {
    value: WaitlistRole;
    title: string;
    description: string;
    icon: string;
  }) {
    const active = role === value;

    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        style={{
          position: "relative",
          display: "grid",
          gap: 8,
          textAlign: "left",
          padding: 16,
          borderRadius: 20,
          cursor: "pointer",
          background: active
            ? "radial-gradient(circle at 10% 10%, rgba(255,90,31,0.14), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.96))"
            : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.72))",
          border: active
            ? "1px solid rgba(255,90,31,0.35)"
            : "1px solid rgba(255,90,31,0.12)",
          boxShadow: active
            ? "0 18px 42px rgba(255,90,31,0.12), 0 10px 24px rgba(17,24,39,0.06)"
            : "0 10px 24px rgba(17,24,39,0.035)",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: active ? "var(--premium-gradient)" : "var(--brand-soft)",
            color: active ? "white" : "var(--brand-dark)",
            fontWeight: 900,
          }}
        >
          {icon}
        </div>

        <strong
          style={{
            color: "var(--premium)",
            fontSize: 16,
            lineHeight: 1.1,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            color: "var(--muted)",
            fontWeight: 650,
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>

        {active && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 24,
              height: 24,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "var(--brand-soft)",
              color: "var(--brand-dark)",
              fontWeight: 900,
              border: "1px solid rgba(255,90,31,0.16)",
            }}
          >
            ✓
          </span>
        )}
      </button>
    );
  }

  return (
    <main>
      <section
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 30,
          alignItems: "center",
          paddingTop: 46,
          paddingBottom: 34,
        }}
      >
        <div>
          <span className="badge">India-first student work marketplace</span>

          <h1 style={{ maxWidth: 760 }}>
            Part-time jobs for students. Reliable workers for businesses.
          </h1>

          <p className="hero-copy" style={{ maxWidth: 680 }}>
            HustleUp connects students, freshers, and local businesses through
            verified profiles, curated part-time jobs, premium tiers, and a
            simple application system.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 22,
              marginBottom: 24,
            }}
          >
            {["Verified profiles", "Application tracking", "Premium access"].map(
              (item) => (
                <span
                  key={item}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    padding: "10px 13px",
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(255,90,31,0.14)",
                    color: "var(--premium)",
                    fontWeight: 800,
                    boxShadow: "0 10px 24px rgba(17,24,39,0.04)",
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "var(--brand-soft)",
                      color: "var(--brand-dark)",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </span>
              )
            )}
          </div>

          <div className="actions">
            <Link className="btn btn-primary" style={primaryButtonStyle} href="/auth">
              Get started
            </Link>

            <Link className="btn" style={secondaryButtonStyle} href="/jobs">
              Browse jobs
            </Link>

            <Link className="btn" style={secondaryButtonStyle} href="/pricing">
              View pricing
            </Link>
          </div>
        </div>

        <form
          id="waitlist"
          className="card form"
          onSubmit={joinWaitlist}
          style={{
            ...premiumCardStyle,
            borderRadius: 32,
            padding: 28,
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

          <span className="tag">Join early access</span>
          <h2 style={{ marginTop: 14 }}>Reserve your spot.</h2>

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
              required
            />
          </label>

          <label className="label">
            Email
            <input
              className="input"
              style={formValueStyle}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value.toLowerCase())}
              placeholder="example@email.com"
              required
            />
          </label>

          <label className="label">
            I am a
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
              }}
            >
              <RoleChoice
                value="job_seeker"
                title="Job seeker"
                description="Find part-time jobs and track applications."
                icon="↗"
              />

              <RoleChoice
                value="job_owner"
                title="Job owner"
                description="Post jobs and manage applicants."
                icon="💼"
              />
            </div>
          </label>

          <label className="label">
            Skills / hiring need
            <textarea
              className="textarea"
              style={textareaValueStyle}
              value={skills}
              onChange={(event) =>
                setSkills(capitalizeSentences(event.target.value))
              }
              placeholder="Example: Sales, cafe helper, design, delivery..."
            />
          </label>

          <button
            className="btn btn-primary"
            style={{
              ...primaryButtonStyle,
              width: "100%",
            }}
            disabled={busy}
          >
            {busy ? "Joining..." : "Join waitlist"}
          </button>

          {message && (
            <div
              className={`notice ${
                message.includes("successfully") ? "success" : "error"
              }`}
              style={{ marginTop: 14 }}
            >
              {message}
            </div>
          )}
        </form>
      </section>

      <section className="container">
        <div className="grid grid-3">
          <StepCard
            number="01"
            title="Create your profile"
            description="Job seekers add skills, timing, salary expectations, and profile details. Job owners add company and hiring details."
          />

          <StepCard
            number="02"
            title="Post or apply"
            description="Businesses post jobs. Students apply. Every application is tracked inside the dashboard."
          />

          <StepCard
            number="03"
            title="Shortlist and hire"
            description="Job owners can shortlist, reject, or hire applicants from the applications panel."
          />
        </div>
      </section>

      <section className="container">
        <div className="grid grid-2">
          <FeatureCard
            badge="For job seekers"
            title="Find work without begging in WhatsApp groups."
            description="Build a profile, apply to part-time jobs, track application status, and upgrade tiers for better visibility."
            features={[
              "Profile with skills and availability",
              "Job application tracking",
              "Premium tier visibility",
              "Simple dashboard",
            ]}
            primaryHref="/jobs"
            primaryText="Find jobs"
            secondaryHref="/auth"
            secondaryText="Create profile"
          />

          <FeatureCard
            badge="For job owners"
            title="Hire students faster with a clean applicant system."
            description="Stop managing candidates manually. Post a job, receive applications, and manage applicants from one place."
            features={[
              "Post part-time jobs",
              "View applicants",
              "Shortlist / reject / hire",
              "Premium job listings",
            ]}
            primaryHref="/post-job"
            primaryText="Post a job"
            secondaryHref="/applications"
            secondaryText="View applicants"
          />
        </div>
      </section>

      <section className="container">
        <span className="badge">Pricing</span>
        <h2>Simple plans for early users.</h2>

        <div className="grid grid-3">
          <PriceCard
            tier="Beginner"
            price="Free"
            description="Basic access for students testing HustleUp."
          />

          <PriceCard
            tier="Basic"
            price="₹99"
            description="More visibility and better access to job opportunities."
          />

          <PriceCard
            tier="Premium"
            price="₹299"
            description="Priority access, premium badge, and stronger profile visibility."
            premium
          />
        </div>

        <div className="actions">
          <Link className="btn btn-primary" style={primaryButtonStyle} href="/pricing">
            See full pricing
          </Link>
        </div>
      </section>

      <section className="container">
        <div
          className="card"
          style={{
            ...premiumCardStyle,
            borderRadius: 32,
            padding: 30,
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

          <span className="badge">Admin ready</span>
          <h2 style={{ marginTop: 14 }}>Built with real backend control.</h2>
          <p style={{ maxWidth: 850 }}>
            HustleUp already includes Supabase authentication, waitlist control,
            job posting, applications, user roles, tiers, and admin management.
          </p>


          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            <BenefitRow>Supabase authentication</BenefitRow>
            <BenefitRow>Role-based dashboards</BenefitRow>
            <BenefitRow>Admin verification</BenefitRow>
            <BenefitRow>Application status tracking</BenefitRow>
          </div>
        </div>
      </section>

      <div className="footer-space" />
    </main>
  );
}