"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "login" | "signup";
type SignupRole = "job_seeker" | "job_owner";

const premiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(255,90,31,0.14)",
  background:
    "radial-gradient(circle at 8% 8%, rgba(255,90,31,0.08), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
  boxShadow: "0 24px 60px rgba(17,24,39,0.08)",
};

const actionButtonStyle: CSSProperties = {
  minHeight: 52,
  borderRadius: 17,
  padding: "0 20px",
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

function capitalizeWords(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<SignupRole>("job_seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageType("info");

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      setBusy(false);

      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      setMessageType("success");
      setMessage(
        "Account created successfully. If email confirmation is enabled, verify your email first. Otherwise, go to Dashboard."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setBusy(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setMessageType("info");
  }

  function RoleCard({
    value,
    title,
    description,
    icon,
  }: {
    value: SignupRole;
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
          width: "100%",
          minHeight: 126,
          textAlign: "left",
          padding: 18,
          borderRadius: 22,
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
          transition:
            "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 15,
            display: "grid",
            placeItems: "center",
            background: active ? "var(--premium-gradient)" : "var(--brand-soft)",
            color: active ? "white" : "var(--brand-dark)",
            fontWeight: 900,
            boxShadow: active
              ? "0 14px 30px rgba(17,24,39,0.14)"
              : "none",
          }}
        >
          {icon}
        </div>

        <strong
          style={{
            color: "var(--premium)",
            fontSize: 17,
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
            lineHeight: 1.45,
          }}
        >
          {description}
        </span>

        {active && (
          <span
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 26,
              height: 26,
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
    <main className="container">
      <Toast
        message={message}
        type={messageType}
        onClose={() => setMessage("")}
      />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div>
          <span className="badge">Authentication</span>

          <h1>
            {mode === "signup"
              ? "Create your HustleUp account."
              : "Welcome back."}
          </h1>

          <p className="hero-copy">
            Job seekers can apply for part-time jobs. Job owners can post jobs,
            manage applicants, and hire faster.
          </p>

          <div
            className="card"
            style={{
              ...premiumCardStyle,
              borderRadius: 30,
              padding: 24,
              marginTop: 22,
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

            <span className="tag">Why HustleUp?</span>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 18,
              }}
            >
              {[
                "Students find local part-time jobs faster",
                "Owners manage applicants from one place",
                "Profiles, applications, and job details stay organized",
              ].map((item) => (
                <div
                  key={item}
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
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form
          className="card form"
          onSubmit={submit}
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: 6,
              borderRadius: 22,
              background: "rgba(255,255,255,0.74)",
              border: "1px solid rgba(255,90,31,0.12)",
              boxShadow: "0 12px 28px rgba(17,24,39,0.045)",
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              className={mode === "signup" ? "btn btn-primary" : "btn"}
              style={mode === "signup" ? primaryButtonStyle : secondaryButtonStyle}
              onClick={() => switchMode("signup")}
            >
              Signup
            </button>

            <button
              type="button"
              className={mode === "login" ? "btn btn-primary" : "btn"}
              style={mode === "login" ? primaryButtonStyle : secondaryButtonStyle}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
          </div>

          {mode === "signup" && (
            <>
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
                Choose role
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 12,
                  }}
                >
                  <RoleCard
                    value="job_seeker"
                    icon="↗"
                    title="Job seeker"
                    description="Browse jobs, apply, and track application status."
                  />

                  <RoleCard
                    value="job_owner"
                    icon="💼"
                    title="Job owner"
                    description="Post jobs, review applicants, and manage hiring."
                  />
                </div>
              </label>
            </>
          )}

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
            Password
            <input
              className="input"
              style={formValueStyle}
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          <button
            className="btn btn-primary"
            style={{
              ...primaryButtonStyle,
              width: "100%",
              marginTop: 4,
            }}
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Login"}
          </button>

          {mode === "signup" ? (
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--muted)",
                fontSize: 14,
                fontWeight: 650,
                lineHeight: 1.45,
              }}
            >
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--brand-dark)",
                  fontWeight: 850,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Login here
              </button>
            </p>
          ) : (
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--muted)",
                fontSize: 14,
                fontWeight: 650,
                lineHeight: 1.45,
              }}
            >
              New to HustleUp?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--brand-dark)",
                  fontWeight: 850,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Create account
              </button>
            </p>
          )}
        </form>
      </section>
    </main>
  );
}