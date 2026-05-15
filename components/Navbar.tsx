"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/types";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
    window.location.href = "/";
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-top">
          <Link href="/" className="logo" onClick={closeMenu}>
            HustleUp
          </Link>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <Link href="/jobs" onClick={closeMenu}>
            Jobs
          </Link>

          <Link href="/pricing" onClick={closeMenu}>
            Pricing
          </Link>

          {!loading && email && (role === "job_owner" || role === "admin") && (
            <Link href="/post-job" onClick={closeMenu}>
              Post Job
            </Link>
          )}

          {!loading && email && (
            <Link href="/applications" onClick={closeMenu}>
              Applications
            </Link>
          )}

          {!loading && email && (
            <Link href="/dashboard" onClick={closeMenu}>
              Dashboard
            </Link>
          )}

          {!loading && email && (
            <Link href="/profile" onClick={closeMenu}>
              Profile
            </Link>
          )}

          {!loading && email && role === "admin" && (
            <Link href="/admin" onClick={closeMenu}>
              Admin
            </Link>
          )}

          {!loading &&
            (email ? (
              <button onClick={signOut}>Logout</button>
            ) : (
              <Link href="/auth" onClick={closeMenu}>
                Login
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}