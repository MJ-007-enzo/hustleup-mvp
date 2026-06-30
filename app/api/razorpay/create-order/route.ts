import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const amountMap = {
  // Job Seeker
  basic: 9900,
  premium: 29900,

  // Job Owner Plans
  starter: 14900,
  growth: 49900,
  pro: 99900,
  business: 249900,

  // Visibility Add-ons
  "1-day": 4900,
  "3-day": 9900,
  "7-day": 19900,
  urgent: 9900,
} as const;

type PaidTier = keyof typeof amountMap;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getRazorpay() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay environment variables.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const tier = body.tier as PaidTier;
const jobId = body.jobId as string | undefined;

    if (!tier || !(tier in amountMap)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const razorpay = getRazorpay();
    const amount = amountMap[tier];

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `hustleup_${Date.now()}`,
     notes: {
  user_id: userData.user.id,
  tier,
  job_id: jobId ?? "",
},
    });

   const { error: paymentError } = await supabase
  .from("payments")
  .insert({
  user_id: userData.user.id,
  tier,
  amount,
  currency: "INR",
  razorpay_order_id: order.id,
  status: "created",
  metadata: {
  type:
    tier === "1-day" ||
    tier === "3-day" ||
    tier === "7-day" ||
    tier === "urgent"
      ? "visibility"
      : "subscription",
  job_id: jobId ?? null,
},
});

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}