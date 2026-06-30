import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Missing Razorpay key secret" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userData.user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    if (payment.status === "paid") {
      return NextResponse.json({ success: true, tier: payment.tier });
    }

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        status: "paid",
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      return NextResponse.json(
        { error: updatePaymentError.message },
        { status: 500 }
      );
    }

 if (payment.metadata?.type === "visibility") {
  const jobId = payment.metadata?.job_id;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing job id" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};

  switch (payment.tier) {
    case "1-day":
      update.boost_type = "1-day";
      update.boost_expires_at = new Date(
        Date.now() + 1 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;

    case "3-day":
      update.boost_type = "3-day";
      update.boost_expires_at = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;

    case "7-day":
      update.boost_type = "7-day";
      update.boost_expires_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;

    case "urgent":
      update.urgent_tag = true;
      update.urgent_expires_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;
  }

  const { error } = await supabase
    .from("jobs")
    .update(update)
    .eq("id", jobId)
    .eq("owner_id", userData.user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} else {
  let profileError = null;

  if (
    payment.tier === "starter" ||
    payment.tier === "growth" ||
    payment.tier === "pro" ||
    payment.tier === "business"
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({
        owner_plan: payment.tier,
        owner_plan_expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", userData.user.id);

    profileError = error;
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({
        tier: payment.tier,
      })
      .eq("id", userData.user.id);

    profileError = error;
  }

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }
}

    return NextResponse.json({
      success: true,
      tier: payment.tier,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}