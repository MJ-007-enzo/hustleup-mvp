"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"job_seeker" | "job_owner">("job_seeker");
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
      full_name: fullName,
      email,
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

  return (
    <main>
      <section className="container hero">
        <div>
          <span className="badge">India-first student work marketplace</span>

          <h1>Part-time jobs for students. Reliable workers for businesses.</h1>

          <p className="hero-copy">
            HustleUp connects students, freshers, and local businesses through
            verified profiles, curated part-time jobs, premium tiers, and a
            simple application system.
          </p>

          <div className="hero-proof">
              <span>Verified profiles</span>
              <span>Application tracking</span>
              <span>Premium access</span>
          </div>

          <div className="actions">
            <Link className="btn btn-primary" href="/auth">
              Get started
            </Link>
            <Link className="btn" href="/jobs">
              Browse jobs
            </Link>
            <Link className="btn" href="/pricing">
              View pricing
            </Link>
          </div>
        </div>

        <form className="card form" onSubmit={joinWaitlist}>
          <span className="tag">Join early access</span>
          <h2>Reserve your spot.</h2>

          <label className="label">
            Full name
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <label className="label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="label">
            I am a
            <select
              className="select"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "job_seeker" | "job_owner")
              }
            >
              <option value="job_seeker">Job seeker</option>
              <option value="job_owner">Job owner</option>
            </select>
          </label>

          <label className="label">
            Skills / hiring need
            <textarea
              className="textarea"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Example: sales, cafe helper, design, delivery..."
            />
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Joining..." : "Join waitlist"}
          </button>

          {message && (
            <div
              className={`notice ${
                message.includes("successfully") ? "success" : "error"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </section>

      <section className="container">
        <div className="grid grid-3">
          <div className="card">
            <div className="stat">01</div>
            <h3>Create your profile</h3>
            <p>
              Job seekers add skills, timing, salary expectations, and profile
              details. Job owners add company and hiring details.
            </p>
          </div>

          <div className="card">
            <div className="stat">02</div>
            <h3>Post or apply</h3>
            <p>
              Businesses post jobs. Students apply. Every application is tracked
              inside the dashboard.
            </p>
          </div>

          <div className="card">
            <div className="stat">03</div>
            <h3>Shortlist and hire</h3>
            <p>
              Job owners can shortlist, reject, or hire applicants from the
              applications panel.
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid grid-2">
          <div>
            <span className="badge">For job seekers</span>
            <h2>Find work without begging in WhatsApp groups.</h2>
            <p>
              Build a profile, apply to part-time jobs, track application
              status, and upgrade tiers for better visibility.
            </p>

            <div className="actions">
              <Link className="btn btn-primary" href="/jobs">
                Find jobs
              </Link>
              <Link className="btn" href="/auth">
                Create profile
              </Link>
            </div>
          </div>

          <div className="card">
            <h3>Seeker features</h3>
            <p>✓ Profile with skills and availability</p>
            <p>✓ Job applications tracking</p>
            <p>✓ Premium tier visibility</p>
            <p>✓ Simple dashboard</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid grid-2">
          <div className="card">
            <h3>Business features</h3>
            <p>✓ Post part-time jobs</p>
            <p>✓ View applicants</p>
            <p>✓ Shortlist / reject / hire</p>
            <p>✓ Premium job listings</p>
          </div>

          <div>
            <span className="badge">For job owners</span>
            <h2>Hire students faster with a clean applicant system.</h2>
            <p>
              Stop managing candidates manually. Post a job, receive
              applications, and manage applicants from one place.
            </p>

            <div className="actions">
              <Link className="btn btn-primary" href="/post-job">
                Post a job
              </Link>
              <Link className="btn" href="/applications">
                View applicants
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <span className="badge">Pricing</span>
        <h2>Simple plans for early users.</h2>

        <div className="grid grid-3">
          <div className="card">
            <span className="tag">Beginner</span>
            <div className="price">Free</div>
            <p>Basic access for students testing HustleUp.</p>
          </div>

          <div className="card">
            <span className="tag">Basic</span>
            <div className="price">₹99</div>
            <p>More visibility and better access to job opportunities.</p>
          </div>

          <div className="card">
            <span className="tag">Premium</span>
            <div className="price">₹299</div>
            <p>Priority access, premium badge, and stronger profile visibility.</p>
          </div>
        </div>

        <div className="actions">
          <Link className="btn btn-primary" href="/pricing">
            See full pricing
          </Link>
        </div>
      </section>

      <section className="container">
        <div className="card">
          <span className="badge">Admin ready</span>
          <h2>Built with real backend control.</h2>
          <p>
            HustleUp already includes Supabase authentication, waitlist control,
            job posting, applications, user roles, tiers, and admin management.
          </p>
        </div>
      </section>

      <div className="footer-space" />
    </main>
  );
}