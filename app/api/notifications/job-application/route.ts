import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "HustleUp <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const resend = new Resend(resendApiKey);

function safeText(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : "Not added";
}

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

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const jobId = body.jobId as string | undefined;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing job id." },
        { status: 400 }
      );
    }

    const [{ data: job, error: jobError }, { data: seeker, error: seekerError }] =
      await Promise.all([
        supabase
          .from("jobs")
          .select("id,title,company_name,location,owner_id")
          .eq("id", jobId)
          .single(),
        supabase
          .from("profiles")
          .select("id,full_name,email,tier,resume_url,resume_filename")
          .eq("id", userData.user.id)
          .single(),
      ]);

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message || "Job not found." },
        { status: 404 }
      );
    }

    if (seekerError || !seeker) {
      return NextResponse.json(
        { error: seekerError?.message || "Applicant profile not found." },
        { status: 404 }
      );
    }

    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", job.owner_id)
      .single();

    if (ownerError || !owner?.email) {
      return NextResponse.json(
        { error: ownerError?.message || "Job owner email not found." },
        { status: 404 }
      );
    }

    const ownerName = safeText(owner.full_name);
    const seekerName = safeText(seeker.full_name);
    const seekerEmail = safeText(seeker.email);
    const jobTitle = safeText(job.title);
    const companyName = safeText(job.company_name);
    const jobLocation = safeText(job.location);

    const subject = `New applicant for ${jobTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background: #fff7f2; padding: 28px;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 28px; border: 1px solid #ffd5c2;">
          <p style="margin: 0 0 12px; color: #ff5a1f; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase;">
            HustleUp
          </p>

          <h1 style="margin: 0 0 16px; color: #111827; font-size: 28px;">
            New applicant received
          </h1>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${ownerName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You received a new application for:
          </p>

          <div style="background: #fff1ea; border: 1px solid #ffd5c2; border-radius: 18px; padding: 18px; margin: 18px 0;">
            <h2 style="margin: 0 0 8px; color: #111827;">
              ${jobTitle}
            </h2>

            <p style="margin: 0; color: #6b7280; font-weight: 700;">
              ${companyName} · ${jobLocation}
            </p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 18px; padding: 18px; margin: 18px 0;">
            <h3 style="margin: 0 0 12px; color: #111827;">
              Applicant details
            </h3>

            <p style="margin: 0 0 8px; color: #374151;">
              <strong>Name:</strong> ${seekerName}
            </p>

            <p style="margin: 0 0 8px; color: #374151;">
              <strong>Email:</strong> ${seekerEmail}
            </p>

            <p style="margin: 0; color: #374151;">
              <strong>Plan:</strong> ${safeText(seeker.tier)}
            </p>
          </div>

          <a
            href="${appUrl}/applications"
            style="display: inline-block; background: #ff5a1f; color: #ffffff; text-decoration: none; padding: 14px 18px; border-radius: 14px; font-weight: 900;"
          >
            Review applicant
          </a>

          <p style="margin-top: 24px; color: #6b7280; font-size: 13px; line-height: 1.6;">
            This email was sent automatically by HustleUp.
          </p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: resendFromEmail,
      to: owner.email,
      subject,
      html,
    });

    if (emailError) {
      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while sending notification.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}