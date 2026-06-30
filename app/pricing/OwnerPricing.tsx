"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import type { OwnerPlan, Profile } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type PaidOwnerPlan = Exclude<OwnerPlan, "free">;

type Props = {
  profile: Profile | null;
};

type Plan = {
  id: OwnerPlan;
  name: string;
  price: string;
  jobs: string;
  applicants: string;
  resumes: string;
  boosts: string;
  best: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    jobs: "1",
    applicants: "10",
    resumes: "0",
    boosts: "0",
    best: "Testing",
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹149",
    jobs: "2",
    applicants: "50",
    resumes: "10",
    boosts: "0",
    best: "Small Shops",
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹499",
    jobs: "7",
    applicants: "200",
    resumes: "50",
    boosts: "2",
    best: "Regular Hiring",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹999",
    jobs: "20",
    applicants: "750",
    resumes: "200",
    boosts: "6",
    best: "Businesses",
  },
  {
    id: "business",
    name: "Business",
    price: "₹2499",
    jobs: "75",
    applicants: "3000",
    resumes: "1000",
    boosts: "20",
    best: "Agencies",
  },
];

const wrapperStyle: CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "40px 20px",
};

const heroStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: 50,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "8px 14px",
  borderRadius: 999,
  background: "var(--surface)",
  color: "#ff6a2f",
  fontWeight: 800,
  marginBottom: 18,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0",
  overflow: "hidden",
  borderRadius: 24,
  background: "var(--card)",
  border: "1px solid var(--border)",
};

const cellStyle: CSSProperties = {
  padding: "22px 16px",
  textAlign: "center",
  borderBottom: "1px solid var(--border)",
};

const rowTitleStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  fontWeight: 800,
  color: "var(--text)",
};

export default function OwnerPricing({ profile }: Props) {
  const { showToast } = useToast();
  const [busyPlan, setBusyPlan] = useState<OwnerPlan | null>(null);

  const currentPlan = profile?.owner_plan ?? "free";

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

  async function startOwnerPayment(planId: PaidOwnerPlan) {
    setBusyPlan(planId);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setBusyPlan(null);
      showToast("Razorpay checkout failed to load.", "error");
      return;
    }

    const orderResponse = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tier: planId }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      setBusyPlan(null);
      showToast(orderData.error || "Could not create Razorpay order.", "error");
      return;
    }
async function updatePaymentAttemptStatus(
  orderId: string,
  status: "cancelled" | "failed"
) {
  await fetch("/api/razorpay/update-payment-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      status,
    }),
  });
}
    const selectedPlan = plans.find((plan) => plan.id === planId);

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "HustleUp",
      description: `${selectedPlan?.name || planId} owner plan`,
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

        setBusyPlan(null);

        if (!verifyResponse.ok) {
          showToast(verifyData.error || "Payment verification failed.", "error");
          return;
        }

        showToast(
          `Payment successful. Owner plan upgraded to ${verifyData.tier}.`,
          "success"
        );

        window.location.reload();
      },
    modal: {
  ondismiss: async function () {
    await updatePaymentAttemptStatus(orderData.orderId, "cancelled");
    setBusyPlan(null);
    showToast("Payment cancelled.", "info");
  },
},
    };

const razorpay = new window.Razorpay(options);

razorpay.on("payment.failed", async function () {
  await updatePaymentAttemptStatus(orderData.orderId, "failed");
  setBusyPlan(null);
  showToast("Payment failed. Please try again.", "error");
});

razorpay.open();
  }

  return (
    <main style={wrapperStyle}>
      <div style={heroStyle}>
        <div style={badgeStyle}>FOR JOB OWNERS</div>

        <h1
          style={{
            fontSize: 48,
            marginBottom: 16,
          }}
        >
          Choose Your Hiring Plan
        </h1>

        <p
          style={{
            maxWidth: 720,
            margin: "0 auto",
            color: "var(--muted)",
            fontSize: 18,
            lineHeight: 1.7,
          }}
        >
          Scale your hiring with more active jobs, applicant access, resume
          downloads and monthly boost credits.
        </p>
      </div>

      <div
        style={{
          overflowX: "auto",
          marginBottom: 40,
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={rowTitleStyle}>Features</th>

              {plans.map((plan) => (
                <th
                  key={plan.id}
                  style={{
                    ...cellStyle,
                    background: plan.popular
                      ? "linear-gradient(180deg, rgba(255,90,31,0.22), var(--surface))"
                      : "var(--surface)",
                    color: "var(--text)",
                  }}
                >
                  {plan.popular && (
                    <div
                      style={{
                        fontSize: 12,
                        marginBottom: 8,
                        fontWeight: 900,
                        color: "var(--brand)",
                      }}
                    >
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                    }}
                  >
                    {plan.name}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 32,
                      fontWeight: 950,
                      color: plan.popular ? "var(--brand)" : "var(--text)",
                    }}
                  >
                    {plan.price}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "var(--muted)",
                      fontWeight: 800,
                    }}
                  >
                    / month
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[
              ["Active Jobs", "jobs"],
              ["Applicants / Month", "applicants"],
              ["Resume Downloads", "resumes"],
              ["Boost Credits", "boosts"],
              ["Best For", "best"],
            ].map(([label, key]) => (
              <tr key={label}>
                <td
                  style={{
                    ...rowTitleStyle,
                    background: "var(--surface)",
                  }}
                >
                  {label}
                </td>

                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    style={{
                      ...cellStyle,
                      color: "var(--text)",
                      fontWeight: 800,
                      background: plan.popular
                        ? "rgba(255,90,31,0.06)"
                        : "var(--card)",
                    }}
                  >
                    {plan[key as keyof Plan]}
                  </td>
                ))}
              </tr>
            ))}

            <tr>
              <td
                style={{
                  ...rowTitleStyle,
                  background: "var(--surface)",
                }}
              >
                Upgrade
              </td>

              {plans.map((plan) => {
                const current = currentPlan === plan.id;

                return (
                  <td
                    key={plan.id}
                    style={{
                      ...cellStyle,
                      background: plan.popular
                        ? "rgba(255,90,31,0.06)"
                        : "var(--card)",
                    }}
                  >
                    {current ? (
                      <button
                        className="btn"
                        disabled
                        style={{
                          width: "100%",
                          cursor: "not-allowed",
                        }}
                      >
                        Current Plan
                      </button>
                    ) : plan.id === "free" ? (
                      <button
                        className="btn"
                        disabled
                        style={{
                          width: "100%",
                          cursor: "not-allowed",
                        }}
                      >
                        Free
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                        }}
                        disabled={busyPlan === plan.id}
                        onClick={() => startOwnerPayment(plan.id as PaidOwnerPlan)}
                      >
                        {busyPlan === plan.id ? "Opening..." : "Upgrade"}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <section
        style={{
          marginTop: 50,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 20,
        }}
      >
        <div className="card" style={{ padding: 24, borderRadius: 24 }}>
          <h3 style={{ marginTop: 0 }}>🔒 Secure Payments</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Every subscription is securely processed through Razorpay.
          </p>
        </div>

        <div className="card" style={{ padding: 24, borderRadius: 24 }}>
          <h3 style={{ marginTop: 0 }}>🚀 Upgrade Anytime</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Upgrade whenever your hiring grows. Your limits increase instantly
            after payment verification.
          </p>
        </div>

        <div className="card" style={{ padding: 24, borderRadius: 24 }}>
          <h3 style={{ marginTop: 0 }}>💬 Priority Support</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Higher plans receive quicker support, more visibility, and future
            premium hiring tools.
          </p>
        </div>
      </section>

      <div
        style={{
          marginTop: 50,
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 10 }}>Need even more visibility?</h2>

        <p
          style={{
            color: "var(--muted)",
            maxWidth: 700,
            margin: "0 auto 24px",
            lineHeight: 1.8,
          }}
        >
          Every subscription can purchase additional Visibility Add-ons like
          1-Day Boosts, 3-Day Boosts, 7-Day Boosts and Urgent Tags.
        </p>

        <Link href="/jobs" className="btn btn-primary">
          Explore Jobs
        </Link>
      </div>
    </main>
  );
}