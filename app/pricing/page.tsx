"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";
import SeekerPricing from "./SeekerPricing";
import OwnerPricing from "./OwnerPricing";

export default function PricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (!error && data) {
      setProfile(data as Profile);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading pricing...</p>
      </main>
    );
  }

  if (profile?.role === "job_owner") {
    return <OwnerPricing profile={profile} />;
  }

  return <SeekerPricing />;
}
