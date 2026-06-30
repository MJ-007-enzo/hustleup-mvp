import type { OwnerPlan } from "./types";

export function canViewContacts(plan?: OwnerPlan | string | null) {
  return (
    plan === "starter" ||
    plan === "growth" ||
    plan === "pro" ||
    plan === "business"
  );
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "Not added";

  const clean = phone.replace(/\D/g, "");

  if (clean.length <= 3) {
    return "*".repeat(clean.length);
  }

  return `${"*".repeat(clean.length - 3)}${clean.slice(-3)}`;
}

export function maskEmail(email?: string | null) {
  if (!email) return "Not added";

  const [name, domain] = email.split("@");

  if (!domain) return "********";

  const visible = name.slice(0, 1);

  return `${visible}${"*".repeat(
    Math.max(name.length - 1, 4)
  )}@${domain}`;
}

export function maskText(text?: string | null) {
  if (!text) return "Not added";

  return "*".repeat(Math.max(text.length, 12));
}