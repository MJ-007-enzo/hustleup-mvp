"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Tier } from "@/lib/types";

export default function PricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyTier, setBusyTier] = useState<Tier | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!error) {
      setProfile(data as Profile);
    }

    setLoading(false);
  }

  async function choosePlan(tier: Tier) {
    setMessage("");
    setBusyTier(tier);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ tier })
      .eq("id", authData.user.id);

    setBusyTier(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Your plan has been updated to ${tier}.`);
    loadProfile();
  }

  function planButton(tier: Tier, label: string) {
    if (loading) {
      return <button className="btn">Checking...</button>;
    }

    if (!profile) {
      return (
        <Link className="btn btn-primary" href="/auth">
          Login to choose
        </Link>
      );
    }

    if (profile.tier === tier) {
      return <button className="btn" disabled>Current plan</button>;
    }

    return (
      <button
        className="btn btn-primary"
        onClick={() => choosePlan(tier)}
        disabled={busyTier === tier}
      >
        {busyTier === tier ? "Updating..." : label}
      </button>
    );
  }

  return (
    <main className="container">
      <span className="badge">Pricing</span>
      <h1>Choose your HustleUp plan.</h1>

      <p className="hero-copy">
        Start free. Upgrade when you want better visibility, premium job access,
        and stronger profile positioning.
      </p>

      {message && (
        <div className={`notice ${message.includes("updated") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      {profile && (
        <div className="notice">
          You are logged in as <strong>{profile.full_name}</strong>. Current plan:{" "}
          <strong>{profile.tier}</strong>.
        </div>
      )}

      <section className="grid grid-3">
        <div className="card">
          <span className="tag">Beginner</span>
          <div className="price">Free</div>
          <p>For new job seekers testing HustleUp.</p>
          <p>✓ Create profile</p>
          <p>✓ Browse jobs</p>
          <p>✓ Limited applications</p>
          <p>✓ Basic visibility</p>
          {planButton("beginner", "Choose Beginner")}
        </div>

        <div className="card">
          <span className="tag">Basic</span>
          <div className="price">₹99</div>
          <p>For active users who want better opportunities.</p>
          <p>✓ More job access</p>
          <p>✓ Better profile visibility</p>
          <p>✓ Application tracking</p>
          <p>✓ Basic badge</p>
          {planButton("basic", "Choose Basic")}
        </div>

        <div className="card">
          <span className="tag">Premium</span>
          <div className="price">₹299</div>
          <p>For serious job seekers who want priority positioning.</p>
          <p>✓ Premium badge</p>
          <p>✓ Priority job access</p>
          <p>✓ Stronger profile ranking</p>
          <p>✓ Future certification access</p>
          {planButton("premium", "Choose Premium")}
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>For job owners</h2>
        <p>
          Business pricing can be added later. For MVP testing, job posting is
          open so you can validate demand first.
        </p>

        <div className="actions">
          <Link className="btn btn-primary" href="/post-job">
            Post a job
          </Link>
          <Link className="btn" href="/applications">
            Manage applicants
          </Link>
        </div>
      </section>
    </main>
  );
}