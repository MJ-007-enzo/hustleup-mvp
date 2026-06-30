"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

type PaymentStatus = "created" | "paid" | "failed" | "refunded" | "cancelled" | string;

type PaymentMetadata = {
  type?: "subscription" | "visibility" | string;
  job_id?: string | null;
};

type Payment = {
  id: string;
  user_id: string;
  tier: string;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: PaymentStatus;
  metadata: PaymentMetadata | null;
  created_at: string;
};

type JobTitleMap = Record<string, string>;

const cardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 30,
  padding: 26,
  background: "var(--card)",
  border: "1px solid rgba(255,90,31,0.16)",
  boxShadow:
    "0 28px 70px rgba(0,0,0,0.16), 0 14px 34px rgba(255,90,31,0.055)",
};

const softCardStyle: CSSProperties = {
  borderRadius: 22,
  padding: 18,
  background: "var(--card-soft)",
  border: "1px solid rgba(255,90,31,0.16)",
  boxShadow: "0 14px 32px rgba(17,24,39,0.08)",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 48,
  borderRadius: 16,
  padding: "0 18px",
  fontWeight: 850,
  fontSize: 14,
  boxShadow:
    "0 18px 40px rgba(255,90,31,0.2), 0 10px 24px rgba(17,24,39,0.08)",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 48,
  borderRadius: 16,
  padding: "0 18px",
  fontWeight: 850,
  fontSize: 14,
  background: "var(--card-soft)",
  border: "1px solid rgba(255,90,31,0.18)",
  color: "var(--text)",
  boxShadow: "0 14px 32px rgba(17,24,39,0.09)",
};

const invoiceButtonStyle: CSSProperties = {
  minHeight: 38,
  borderRadius: 999,
  padding: "0 14px",
  fontWeight: 900,
  fontSize: 12,
  background: "rgba(255,90,31,0.08)",
  border: "1px solid rgba(255,90,31,0.24)",
  color: "var(--brand-dark)",
  cursor: "pointer",
};
const statementInputStyle: CSSProperties = {
  minHeight: 46,
  borderRadius: 16,
  border: "1px solid rgba(255,90,31,0.2)",
  background: "var(--card-soft)",
  color: "var(--text)",
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 800,
  fontFamily: "inherit",
};
function toDateInputValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}
function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDate(date?: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function planLabel(value?: string | null) {
  if (!value) return "Free";

  const labels: Record<string, string> = {
    beginner: "Beginner",
    basic: "Basic",
    premium: "Premium",
    advanced: "Advanced",

    free: "Free",
    starter: "Starter",
    growth: "Growth",
    pro: "Pro",
    business: "Business",

    "1-day": "1-Day Boost",
    "3-day": "3-Day Boost",
    "7-day": "7-Day Boost",
    urgent: "Urgent Hiring",
  };

  return labels[value] || value;
}

function paymentTypeLabel(payment: Payment) {
  if (payment.metadata?.type === "visibility") {
    return "Visibility Add-on";
  }

  if (
    payment.tier === "starter" ||
    payment.tier === "growth" ||
    payment.tier === "pro" ||
    payment.tier === "business"
  ) {
    return "Owner Plan";
  }

  if (payment.tier === "basic" || payment.tier === "premium") {
    return "Seeker Plan";
  }

  return "Payment";
}

function paymentJobTitle(payment: Payment, jobTitles: JobTitleMap) {
  if (payment.metadata?.type !== "visibility") return null;

  const jobId = payment.metadata.job_id;

  if (!jobId) return "Job not linked";

  return jobTitles[jobId] || "Job deleted or not found";
}

function statusStyle(status: string): CSSProperties {
  if (status === "paid") {
    return {
      background: "rgba(16,185,129,0.11)",
      color: "#047857",
      border: "1px solid rgba(16,185,129,0.22)",
    };
  }

  if (status === "failed" || status === "cancelled") {
    return {
      background: "rgba(239,68,68,0.1)",
      color: "#b91c1c",
      border: "1px solid rgba(239,68,68,0.2)",
    };
  }

  if (status === "refunded") {
    return {
      background: "rgba(59,130,246,0.1)",
      color: "#1d4ed8",
      border: "1px solid rgba(59,130,246,0.22)",
    };
  }

  return {
    background: "rgba(255,90,31,0.09)",
    color: "var(--brand-dark)",
    border: "1px solid rgba(255,90,31,0.15)",
  };
}

function Pill({ children, status }: { children: string; status?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        alignItems: "center",
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...(status ? statusStyle(status) : statusStyle("created")),
      }}
    >
      {children}
    </span>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitleMap>({});
  const [statementFrom, setStatementFrom] = useState(() => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return toDateInputValue(monthStart);
});

const [statementTo, setStatementTo] = useState(() =>
  toDateInputValue(new Date())
);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    loadBilling();
  }, []);

  const paidPayments = useMemo(() => {
    return payments.filter((payment) => payment.status === "paid");
  }, [payments]);

  const visibilityPayments = useMemo(() => {
    return paidPayments.filter(
      (payment) => payment.metadata?.type === "visibility"
    );
  }, [paidPayments]);

  const subscriptionPayments = useMemo(() => {
    return paidPayments.filter(
      (payment) => payment.metadata?.type !== "visibility"
    );
  }, [paidPayments]);

  const totalSpent = useMemo(() => {
    return paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [paidPayments]);
const statementPayments = useMemo(() => {
  const fromTime = new Date(`${statementFrom}T00:00:00`).getTime();
  const toTime = new Date(`${statementTo}T23:59:59`).getTime();

  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) {
    return paidPayments;
  }

  return paidPayments.filter((payment) => {
    const paymentTime = new Date(payment.created_at).getTime();

    return paymentTime >= fromTime && paymentTime <= toTime;
  });
}, [paidPayments, statementFrom, statementTo]);

const statementTotal = useMemo(() => {
  return statementPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
}, [statementPayments]);
  async function loadBilling() {
    setLoading(true);
    setErrorText("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/auth";
      return;
    }
await supabase.rpc("cleanup_old_unpaid_payments");
    const [{ data: profileData, error: profileError }, { data, error }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single(),
        supabase
          .from("payments")
          .select(
            "id,user_id,tier,amount,currency,razorpay_order_id,razorpay_payment_id,status,metadata,created_at"
          )
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false }),
      ]);
const statementInputStyle: CSSProperties = {
  minHeight: 46,
  borderRadius: 16,
  border: "1px solid rgba(255,90,31,0.2)",
  background: "var(--card-soft)",
  color: "var(--text)",
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 800,
  fontFamily: "inherit",
};
    if (profileError) {
      setErrorText(profileError.message);
      setLoading(false);
      return;
    }

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const paymentRows = (data ?? []) as Payment[];

    const visibilityJobIds = Array.from(
      new Set(
        paymentRows
          .filter((payment) => payment.metadata?.type === "visibility")
          .map((payment) => payment.metadata?.job_id)
          .filter(Boolean) as string[]
      )
    );

    if (visibilityJobIds.length > 0) {
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id,title")
        .in("id", visibilityJobIds);

      const nextJobTitles: JobTitleMap = {};

      (jobData ?? []).forEach((job) => {
        nextJobTitles[job.id] = job.title;
      });

      setJobTitles(nextJobTitles);
    } else {
      setJobTitles({});
    }

    setProfile((profileData as Profile) ?? null);
    setPayments(paymentRows);
    setLoading(false);
  }

  function downloadInvoice(payment: Payment) {
    const jobTitle = paymentJobTitle(payment, jobTitles);
    const invoiceNumber = `HU-${payment.id.slice(0, 8).toUpperCase()}`;
    const customerName = profile?.full_name || "HustleUp User";
    const customerEmail = profile?.email || "Not available";

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HustleUp Invoice ${escapeHtml(invoiceNumber)}</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
      color: #111827;
      background: #f8f5f1;
    }
    .invoice {
      max-width: 760px;
      margin: 0 auto;
      background: white;
      border: 1px solid #f4c6b3;
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid #f4c6b3;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: 34px;
      letter-spacing: -1px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
    }
    .brand {
      color: #ff5a1f;
      font-weight: 900;
    }
    .muted {
      color: #5b6475;
      font-weight: 600;
      line-height: 1.6;
    }
    .box {
      border: 1px solid #f4c6b3;
      border-radius: 18px;
      padding: 18px;
      margin-top: 14px;
      background: #fffaf7;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 12px 0;
      border-bottom: 1px solid #f4c6b3;
    }
    .row:last-child {
      border-bottom: none;
    }
    .total {
      font-size: 24px;
      font-weight: 900;
      color: #111827;
    }
    .paid {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 999px;
      background: #dcfce7;
      color: #047857;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.04em;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #5b6475;
      line-height: 1.6;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="top">
      <div>
        <h1><span class="brand">HustleUp</span> Invoice</h1>
        <p class="muted">
          Invoice No: ${escapeHtml(invoiceNumber)}<br />
          Date: ${escapeHtml(formatDateTime(payment.created_at))}
        </p>
      </div>
      <div>
        <span class="paid">${escapeHtml(payment.status.toUpperCase())}</span>
      </div>
    </div>

    <div class="box">
      <h2>Billed To</h2>
      <p class="muted">
        ${escapeHtml(customerName)}<br />
        ${escapeHtml(customerEmail)}
      </p>
    </div>

    <div class="box">
      <h2>Payment Details</h2>

      <div class="row">
        <span class="muted">Item</span>
        <strong>${escapeHtml(planLabel(payment.tier))}</strong>
      </div>

      <div class="row">
        <span class="muted">Type</span>
        <strong>${escapeHtml(paymentTypeLabel(payment))}</strong>
      </div>

      ${
        jobTitle
          ? `<div class="row">
              <span class="muted">Job</span>
              <strong>${escapeHtml(jobTitle)}</strong>
            </div>`
          : ""
      }

      <div class="row">
        <span class="muted">Payment ID</span>
        <strong>${escapeHtml(payment.razorpay_payment_id || "Not available")}</strong>
      </div>

      <div class="row">
        <span class="muted">Currency</span>
        <strong>${escapeHtml(payment.currency || "INR")}</strong>
      </div>

      <div class="row">
        <span class="muted">Total Paid</span>
        <span class="total">${escapeHtml(
          formatMoney(payment.amount, payment.currency)
        )}</span>
      </div>
    </div>

    <p class="footer">
      This is a computer-generated payment receipt for HustleUp test/live transactions.
      For launch, connect this with your final legal business name, GST details if applicable,
      and official support email.
    </p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `hustleup-invoice-${invoiceNumber}.html`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }
function downloadStatement() {
  if (statementPayments.length === 0) {
    window.alert("No successful payments found in this date range.");
    return;
  }

  const customerName = profile?.full_name || "HustleUp User";
  const customerEmail = profile?.email || "Not available";
  const statementNumber = `HU-STMT-${statementFrom}-TO-${statementTo}`;

  const rows = statementPayments
    .map((payment, index) => {
      const jobTitle = paymentJobTitle(payment, jobTitles);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(planLabel(payment.tier))}</strong>
            <br />
            <span>${escapeHtml(paymentTypeLabel(payment))}</span>
            ${
              jobTitle
                ? `<br /><span>Job: ${escapeHtml(jobTitle)}</span>`
                : ""
            }
          </td>
          <td>${escapeHtml(formatDateTime(payment.created_at))}</td>
          <td>${escapeHtml(payment.status.toUpperCase())}</td>
          <td>${escapeHtml(formatMoney(payment.amount, payment.currency))}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HustleUp Statement ${escapeHtml(statementFrom)} to ${escapeHtml(
    statementTo
  )}</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
      color: #111827;
      background: #f8f5f1;
    }
    .statement {
      max-width: 920px;
      margin: 0 auto;
      background: white;
      border: 1px solid #f4c6b3;
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid #f4c6b3;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: 34px;
      letter-spacing: -1px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
    }
    .brand {
      color: #ff5a1f;
      font-weight: 900;
    }
    .muted {
      color: #5b6475;
      font-weight: 600;
      line-height: 1.6;
    }
    .box {
      border: 1px solid #f4c6b3;
      border-radius: 18px;
      padding: 18px;
      margin-top: 14px;
      background: #fffaf7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      overflow: hidden;
      border-radius: 16px;
    }
    th {
      text-align: left;
      background: #fff1ea;
      color: #111827;
      padding: 14px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #f4c6b3;
      vertical-align: top;
      color: #111827;
      font-weight: 600;
    }
    td span {
      color: #5b6475;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.6;
    }
    .total {
      margin-top: 22px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-radius: 18px;
      padding: 20px;
      background: #fff1ea;
      border: 1px solid #f4c6b3;
      font-size: 24px;
      font-weight: 900;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #5b6475;
      line-height: 1.6;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .statement {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="statement">
    <div class="top">
      <div>
        <h1><span class="brand">HustleUp</span> Statement</h1>
        <p class="muted">
          Statement No: ${escapeHtml(statementNumber)}<br />
          Period: ${escapeHtml(formatDate(statementFrom))} to ${escapeHtml(
            formatDate(statementTo)
          )}
        </p>
      </div>
      <div>
        <p class="muted">
          Generated:<br />
          ${escapeHtml(formatDateTime(new Date().toISOString()))}
        </p>
      </div>
    </div>

    <div class="box">
      <h2>Customer</h2>
      <p class="muted">
        ${escapeHtml(customerName)}<br />
        ${escapeHtml(customerEmail)}
      </p>
    </div>

    <div class="box">
      <h2>Successful payments</h2>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Payment</th>
            <th>Date</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="total">
        <span>Total paid</span>
        <span>${escapeHtml(formatMoney(statementTotal))}</span>
      </div>
    </div>

    <p class="footer">
      This is a computer-generated billing statement from HustleUp.
      For launch, connect this with your final legal business name, GST details if applicable,
      and official support email.
    </p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `hustleup-statement-${statementFrom}-to-${statementTo}.html`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
  if (loading) {
    return (
      <main className="container">
        <p>Loading billing...</p>
      </main>
    );
  }

  const isOwner = profile?.role === "job_owner" || profile?.role === "admin";

  return (
    <main className="container">
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 22,
          marginBottom: 26,
        }}
      >
        <div>
          <span className="badge">Billing</span>

          <h1>Billing & payments.</h1>

          <p className="hero-copy">
            Track your current plan, successful payments, and visibility
            add-ons purchased for your HustleUp account.
          </p>

          <div className="actions">
            <Link
              className="btn btn-primary"
              style={primaryButtonStyle}
              href="/pricing"
            >
              Manage plan
            </Link>

            <Link className="btn" style={secondaryButtonStyle} href="/dashboard">
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>

      {errorText && (
        <div className="notice error" style={{ marginBottom: 18 }}>
          {errorText}
        </div>
      )}
<section style={{ ...cardStyle, marginBottom: 24 }}>
  <span className="tag">Statement download</span>

  <h3 style={{ marginTop: 14 }}>Download billing statement</h3>

  <p
    style={{
      color: "var(--muted)",
      fontWeight: 700,
      lineHeight: 1.6,
      marginBottom: 18,
    }}
  >
    Select a date range and download one statement containing all successful
    payments in that period.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12,
      alignItems: "end",
    }}
  >
    <label
      style={{
        display: "grid",
        gap: 8,
        color: "var(--muted)",
        fontWeight: 900,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      From date
      <input
        type="date"
        value={statementFrom}
        onChange={(event) => setStatementFrom(event.target.value)}
        style={statementInputStyle}
      />
    </label>

    <label
      style={{
        display: "grid",
        gap: 8,
        color: "var(--muted)",
        fontWeight: 900,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      To date
      <input
        type="date"
        value={statementTo}
        onChange={(event) => setStatementTo(event.target.value)}
        style={statementInputStyle}
      />
    </label>

    <button
      type="button"
      className="btn btn-primary"
      style={primaryButtonStyle}
      onClick={downloadStatement}
    >
      Download statement
    </button>
  </div>

  <p
    style={{
      marginTop: 14,
      marginBottom: 0,
      color: "var(--muted)",
      fontWeight: 750,
      fontSize: 13,
    }}
  >
    {statementPayments.length} successful payment
    {statementPayments.length === 1 ? "" : "s"} selected · Total{" "}
    <strong style={{ color: "var(--text)" }}>
      {formatMoney(statementTotal)}
    </strong>
  </p>
</section>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 5,
              background: "var(--brand-gradient)",
            }}
          />

          <span className="tag">Current plan</span>

          <h2
            style={{
              marginTop: 14,
              marginBottom: 8,
              color: "var(--text)",
            }}
          >
            {isOwner
              ? `${planLabel(profile?.owner_plan)} Owner Plan`
              : `${planLabel(profile?.tier)} Seeker Plan`}
          </h2>

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {isOwner
              ? `Plan expires: ${formatDate(profile?.owner_plan_expires_at)}`
              : "Seeker membership access for job applications."}
          </p>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 5,
              background: "linear-gradient(90deg, #10b981, #34d399)",
            }}
          />

          <span className="tag">Total paid</span>

          <h2
            style={{
              marginTop: 14,
              marginBottom: 8,
              color: "var(--text)",
            }}
          >
            {formatMoney(totalSpent)}
          </h2>

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            From {paidPayments.length} successful payment
            {paidPayments.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 5,
              background: "linear-gradient(90deg, #ff5a1f, #ff9f0a)",
            }}
          />

          <span className="tag">Visibility add-ons</span>

          <h2
            style={{
              marginTop: 14,
              marginBottom: 8,
              color: "var(--text)",
            }}
          >
            {visibilityPayments.length}
          </h2>

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            Boosts and urgent hiring tags purchased.
          </p>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <span className="tag">Plan payments</span>

          <h3 style={{ marginTop: 14 }}>Subscriptions</h3>

          {subscriptionPayments.length === 0 ? (
            <p
              style={{
                marginBottom: 0,
                color: "var(--muted)",
                fontWeight: 700,
              }}
            >
              No paid plan payments yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 16,
              }}
            >
              {subscriptionPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} style={softCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <strong style={{ color: "var(--text)" }}>
                      {planLabel(payment.tier)}
                    </strong>

                    <Pill status={payment.status}>{payment.status}</Pill>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--muted)",
                      fontWeight: 700,
                      lineHeight: 1.5,
                    }}
                  >
                    {paymentTypeLabel(payment)} ·{" "}
                    {formatMoney(payment.amount, payment.currency)} ·{" "}
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <span className="tag">Add-on payments</span>

          <h3 style={{ marginTop: 14 }}>Visibility purchases</h3>

          {visibilityPayments.length === 0 ? (
            <p
              style={{
                marginBottom: 0,
                color: "var(--muted)",
                fontWeight: 700,
              }}
            >
              No visibility add-ons purchased yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 16,
              }}
            >
              {visibilityPayments.slice(0, 5).map((payment) => {
                const jobTitle = paymentJobTitle(payment, jobTitles);

                return (
                  <div key={payment.id} style={softCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <strong style={{ color: "var(--text)" }}>
                        {planLabel(payment.tier)}
                      </strong>

                      <Pill status={payment.status}>{payment.status}</Pill>
                    </div>

                    {jobTitle && (
                      <p
                        style={{
                          marginTop: 0,
                          marginBottom: 8,
                          color: "var(--text)",
                          fontWeight: 850,
                          lineHeight: 1.45,
                        }}
                      >
                        Job: {jobTitle}
                      </p>
                    )}

                    <p
                      style={{
                        margin: 0,
                        color: "var(--muted)",
                        fontWeight: 700,
                        lineHeight: 1.5,
                      }}
                    >
                      {formatMoney(payment.amount, payment.currency)} ·{" "}
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <span className="tag">Payment history</span>

        <h3 style={{ marginTop: 14 }}>Successful payments</h3>

        {paidPayments.length === 0 ? (
          <p
            style={{
              marginBottom: 0,
              color: "var(--muted)",
              fontWeight: 700,
            }}
          >
            No successful payment history found.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 18,
            }}
          >
            {paidPayments.map((payment) => {
              const jobTitle = paymentJobTitle(payment, jobTitles);

              return (
                <div key={payment.id} style={softCardStyle}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1.4fr) minmax(100px, 0.45fr) minmax(110px, 0.45fr) minmax(130px, 0.45fr)",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: "block",
                          color: "var(--text)",
                          marginBottom: 6,
                        }}
                      >
                        {planLabel(payment.tier)}
                      </strong>

                      <span
                        style={{
                          color: "var(--muted)",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {paymentTypeLabel(payment)} ·{" "}
                        {formatDateTime(payment.created_at)}
                      </span>

                      {jobTitle && (
                        <span
                          style={{
                            display: "block",
                            marginTop: 6,
                            color: "var(--text)",
                            fontWeight: 850,
                            fontSize: 13,
                          }}
                        >
                          Job: {jobTitle}
                        </span>
                      )}
                    </div>

                    <strong style={{ color: "var(--text)" }}>
                      {formatMoney(payment.amount, payment.currency)}
                    </strong>

                    <Pill status={payment.status}>{payment.status}</Pill>

                    <button
                      type="button"
                      style={invoiceButtonStyle}
                      onClick={() => downloadInvoice(payment)}
                    >
                      Download invoice
                    </button>
                  </div>

                  {payment.razorpay_payment_id && (
                    <p
                      style={{
                        marginBottom: 0,
                        marginTop: 12,
                        color: "var(--muted)",
                        fontSize: 12,
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Razorpay ID: {payment.razorpay_payment_id}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}