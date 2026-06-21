"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Tier } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type PaidTier = "basic" | "premium";

function BenefitItem({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "12px 13px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(255,90,31,0.12)",
        boxShadow: "0 10px 24px rgba(17,24,39,0.035)",
        marginTop: 12,
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

export default function PricingPage() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
      showToast(error.message, "error");
      return;
    }

    showToast("Your plan has been updated to beginner.", "success");
    loadProfile();
  }

  async function startPayment(tier: PaidTier) {
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
      showToast(
        "Razorpay checkout failed to load. Check your internet connection.",
        "error"
      );
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
      showToast(orderData.error || "Could not create Razorpay order.", "error");
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
          showToast(verifyData.error || "Payment verification failed.", "error");
          return;
        }

        showToast(
          `Payment successful. Your plan is now ${verifyData.tier}.`,
          "success"
        );
        loadProfile();
      },
      modal: {
        ondismiss: function () {
          setBusyTier(null);
          showToast("Payment cancelled.", "info");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  function planButton(tier: Tier, label: string) {
    const baseButtonStyle: CSSProperties = {
      minHeight: 54,
      borderRadius: 18,
      padding: "0 22px",
      fontWeight: 850,
      fontSize: 15,
      letterSpacing: "-0.01em",
      boxShadow: "0 14px 34px rgba(17,24,39,0.08)",
    };

    const secondaryButtonStyle: CSSProperties = {
      ...baseButtonStyle,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
      border: "1px solid rgba(255,90,31,0.16)",
      color: "var(--premium)",
    };

    const disabledButtonStyle: CSSProperties = {
      ...baseButtonStyle,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
      border: "1px solid rgba(255,90,31,0.16)",
      color: "var(--premium)",
      opacity: 1,
      cursor: "not-allowed",
    };

    const primaryButtonStyle: CSSProperties = {
      ...baseButtonStyle,
      boxShadow:
        "0 18px 40px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
    };

    if (loading) {
      return (
        <button className="btn" style={secondaryButtonStyle}>
          Checking...
        </button>
      );
    }

    if (!profile) {
      return (
        <Link className="btn btn-primary" style={primaryButtonStyle} href="/auth">
          Login to choose
        </Link>
      );
    }

    if (profile.tier === tier) {
      return (
        <button className="btn" style={disabledButtonStyle} disabled>
          Current plan
        </button>
      );
    }

    if (tier === "beginner") {
      return (
        <button
          className="btn"
          style={secondaryButtonStyle}
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
        style={primaryButtonStyle}
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
        Start free. Upgrade when you want more applications, better visibility,
        Premium access, and stronger positioning in front of job owners.
      </p>

      {profile && (
        <div className="notice">
          You are logged in as <strong>{profile.full_name}</strong>. Current
          plan: <strong>{profile.tier}</strong>.
        </div>
      )}

      <section className="grid grid-3">
        <div className="card">
          <span className="tag">Beginner</span>
          <div className="price">Free</div>
          <p>For new users who want to enter HustleUp and start applying.</p>

          <BenefitItem>Create your HustleUp profile</BenefitItem>
          <BenefitItem>Browse regular job listings</BenefitItem>
          <BenefitItem>5 applications per month</BenefitItem>
          <BenefitItem>Track application status</BenefitItem>
          <BenefitItem>Standard profile visibility</BenefitItem>

          <div style={{ marginTop: 26 }}>
            {planButton("beginner", "Choose Beginner")}
          </div>
        </div>

        <div className="card">
          <span className="tag">Basic</span>
          <div className="price">₹99</div>
          <p>For active users who want more applications and better access.</p>

          <BenefitItem>Everything in Beginner</BenefitItem>
          <BenefitItem>12 applications per month</BenefitItem>
          <BenefitItem>Premium job details preview</BenefitItem>
          <BenefitItem>Better profile visibility</BenefitItem>
          <BenefitItem>Basic member badge</BenefitItem>
          <BenefitItem>Faster application tracking</BenefitItem>

          <div style={{ marginTop: 26 }}>{planButton("basic", "Pay ₹99")}</div>
        </div>

        <div className="card pricing-card-premium">
          <span className="premium-badge">Premium</span>
          <div className="price">₹299</div>
          <p>For serious job seekers who want unlimited access and priority.</p>

          <BenefitItem>Everything in Basic</BenefitItem>
          <BenefitItem>Unlimited applications</BenefitItem>
          <BenefitItem>Premium job applications unlocked</BenefitItem>
          <BenefitItem>Priority visibility to job owners</BenefitItem>
          <BenefitItem>Higher applicant ranking</BenefitItem>
          <BenefitItem>Certification priority access</BenefitItem>

          <div style={{ marginTop: 26 }}>
            {planButton("premium", "Pay ₹299")}
          </div>
        </div>
      </section>

      <section
        className="card"
        style={{
          position: "relative",
          overflow: "hidden",
          marginTop: 28,
          padding: 28,
          borderRadius: 30,
          border: "1px solid rgba(255,90,31,0.18)",
          background:
            "radial-gradient(circle at 8% 10%, rgba(255,90,31,0.12), transparent 28%), radial-gradient(circle at 92% 0%, rgba(245,158,11,0.1), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
          boxShadow:
            "0 30px 80px rgba(17,24,39,0.1), 0 14px 36px rgba(255,90,31,0.08)",
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
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--premium-gradient)",
                  color: "white",
                  boxShadow: "0 14px 30px rgba(17, 24, 39, 0.16)",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                ↗
              </div>

              <div>
                <span
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "var(--brand-soft)",
                    color: "var(--brand-dark)",
                    fontSize: 11,
                    fontWeight: 850,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  For job owners
                </span>

                <h2 style={{ margin: 0 }}>Post jobs and manage applicants.</h2>
              </div>
            </div>

            <p style={{ marginBottom: 0 }}>
              Business pricing can be added later. For MVP testing, job posting
              is open so you can validate demand first.
            </p>
          </div>

          <div
            className="actions"
            style={{
              marginTop: 0,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              className="btn btn-primary"
              href="/post-job"
              style={{
                minHeight: 54,
                borderRadius: 18,
                padding: "0 22px",
                fontWeight: 850,
                boxShadow:
                  "0 18px 40px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
              }}
            >
              Post a job
            </Link>

            <Link
              className="btn"
              href="/applications"
              style={{
                minHeight: 54,
                borderRadius: 18,
                padding: "0 22px",
                fontWeight: 850,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
                border: "1px solid rgba(255,90,31,0.16)",
                color: "var(--premium)",
                boxShadow: "0 14px 34px rgba(17,24,39,0.08)",
              }}
            >
              Manage applicants
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}