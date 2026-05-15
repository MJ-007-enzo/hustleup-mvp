"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Tier } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type PaidTier = "basic" | "premium";

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

  async function chooseBeginner() {
    setMessage("");
    setBusyTier("beginner");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ tier: "beginner" })
      .eq("id", authData.user.id);

    setBusyTier(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Your plan has been updated to beginner.");
    loadProfile();
  }

  async function startPayment(tier: PaidTier) {
    setMessage("");
    setBusyTier(tier);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setBusyTier(null);
      setMessage("Razorpay checkout failed to load. Check your internet connection.");
      return;
    }

    const orderResponse = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tier }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      setBusyTier(null);
      setMessage(orderData.error || "Could not create Razorpay order.");
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "HustleUp",
      description: `${tier.toUpperCase()} plan`,
      order_id: orderData.orderId,
      prefill: {
        name: profile?.full_name || "",
        email: profile?.email || "",
      },
      theme: {
        color: "#e8500a",
      },
      handler: async function (response: any) {
        const verifyResponse = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(response),
        });

        const verifyData = await verifyResponse.json();

        setBusyTier(null);

        if (!verifyResponse.ok) {
          setMessage(verifyData.error || "Payment verification failed.");
          return;
        }

        setMessage(`Payment successful. Your plan is now ${verifyData.tier}.`);
        loadProfile();
      },
      modal: {
        ondismiss: function () {
          setBusyTier(null);
          setMessage("Payment cancelled.");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
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
      return (
        <button className="btn" disabled>
          Current plan
        </button>
      );
    }

    if (tier === "beginner") {
      return (
        <button
          className="btn"
          onClick={chooseBeginner}
          disabled={busyTier === "beginner"}
        >
          {busyTier === "beginner" ? "Updating..." : label}
        </button>
      );
    }

    return (
      <button
        className="btn btn-primary"
        onClick={() => startPayment(tier as PaidTier)}
        disabled={busyTier === tier}
      >
        {busyTier === tier ? "Opening payment..." : label}
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
        <div
          className={`notice ${
            message.includes("successful") || message.includes("updated")
              ? "success"
              : "error"
          }`}
        >
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
          {planButton("basic", "Pay ₹99")}
        </div>

        <div className="card">
          <span className="tag">Premium</span>
          <div className="price">₹299</div>
          <p>For serious job seekers who want priority positioning.</p>
          <p>✓ Premium badge</p>
          <p>✓ Priority job access</p>
          <p>✓ Stronger profile ranking</p>
          <p>✓ Future certification access</p>
          {planButton("premium", "Pay ₹299")}
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