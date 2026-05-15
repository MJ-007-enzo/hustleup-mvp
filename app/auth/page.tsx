"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"job_seeker" | "job_owner">("job_seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      setBusy(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Account created. If email confirmation is enabled, verify your email first. Otherwise go to Dashboard.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="container">
      <section className="grid grid-2">
        <div>
          <span className="badge">Authentication</span>
          <h1>{mode === "signup" ? "Create your HustleUp account." : "Welcome back."}</h1>
          <p>
            Job seekers can apply for work. Job owners can post jobs. Admins can control the waitlist.
          </p>
        </div>

        <form className="card form" onSubmit={submit}>
          <div className="actions" style={{ marginTop: 0 }}>
            <button type="button" className={`btn ${mode === "signup" ? "btn-primary" : ""}`} onClick={() => setMode("signup")}>
              Signup
            </button>
            <button type="button" className={`btn ${mode === "login" ? "btn-primary" : ""}`} onClick={() => setMode("login")}>
              Login
            </button>
          </div>

          {mode === "signup" && (
            <>
              <label className="label">
                Full name
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>

              <label className="label">
                Role
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as "job_seeker" | "job_owner")}>
                  <option value="job_seeker">Job seeker</option>
                  <option value="job_owner">Job owner</option>
                </select>
              </label>
            </>
          )}

          <label className="label">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="label">
            Password
            <input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
          </button>

          {message && <div className="notice">{message}</div>}
        </form>
      </section>
    </main>
  );
}
