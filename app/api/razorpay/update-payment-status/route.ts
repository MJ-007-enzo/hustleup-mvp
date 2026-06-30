import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ClientAllowedStatus = "cancelled" | "failed";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = body.orderId as string | undefined;
    const status = body.status as ClientAllowedStatus | undefined;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing Razorpay order id." },
        { status: 400 }
      );
    }

    if (status !== "cancelled" && status !== "failed") {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("payments")
      .update({
        status,
      })
      .eq("user_id", userData.user.id)
      .eq("razorpay_order_id", orderId)
      .eq("status", "created");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while updating payment status.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}