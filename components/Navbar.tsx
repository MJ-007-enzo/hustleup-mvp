"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/types";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setEmail(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setEmail(user.email ?? null);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole((profileData?.role as UserRole) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    setRole(null);
    window.location.href = "/";
  }

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link href="/" className="logo">
          HustleUp
        </Link>

        <nav className="nav-links">
          <Link href="/jobs">Jobs</Link>
          <Link href="/pricing">Pricing</Link>

          {!loading && email && (role === "job_owner" || role === "admin") && (
            <Link href="/post-job">Post Job</Link>
          )}

          {!loading && email && <Link href="/applications">Applications</Link>}

          {!loading && email && <Link href="/dashboard">Dashboard</Link>}

          {!loading && email && <Link href="/profile">Profile</Link>}

          {!loading && email && role === "admin" && (
            <Link href="/admin">Admin</Link>
          )}

          {!loading &&
            (email ? (
              <button onClick={signOut}>Logout</button>
            ) : (
              <Link href="/auth">Login</Link>
            ))}
        </nav>
      </div>
    </header>
  );
}