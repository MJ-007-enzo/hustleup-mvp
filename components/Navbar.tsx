"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/types";

export default function Navbar() {
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    function checkScreen() {
      setIsMobile(window.innerWidth <= 1120);
    }

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

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

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navLinkStyle(href: string): CSSProperties {
    const active = isActive(href);

    return {
      minHeight: 42,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      padding: isMobile ? "0 14px" : "0 10px",
      fontSize: 14,
      fontWeight: 800,
      textDecoration: "none",
      whiteSpace: "nowrap",
      color: active ? "var(--brand-dark)" : "var(--muted)",
      background: active ? "var(--brand-soft)" : "transparent",
      border: active
        ? "1px solid rgba(255,90,31,0.16)"
        : "1px solid transparent",
      boxShadow: active ? "0 12px 28px rgba(255,90,31,0.08)" : "none",
      width: isMobile ? "100%" : "auto",
    };
  }

  const headerStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    background:
      "linear-gradient(180deg, rgba(255,250,246,0.96), rgba(255,250,246,0.88))",
    borderBottom: "1px solid rgba(255,90,31,0.12)",
    boxShadow: "0 14px 34px rgba(17,24,39,0.06)",
  };

  const innerStyle: CSSProperties = {
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    minHeight: isMobile ? 72 : 88,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "nowrap",
    position: "relative",
  };

  const logoStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "var(--premium)",
    fontWeight: 950,
    fontSize: 22,
    letterSpacing: "-0.04em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const logoMarkStyle: CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 13,
    display: "grid",
    placeItems: "center",
    background: "var(--brand-gradient)",
    color: "white",
    boxShadow: "0 14px 30px rgba(255,90,31,0.2)",
    fontSize: 16,
    fontWeight: 950,
    flexShrink: 0,
  };

  const mobileButtonStyle: CSSProperties = {
    display: isMobile ? "grid" : "none",
    placeItems: "center",
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,90,31,0.14)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
    color: "var(--premium)",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(17,24,39,0.08)",
    flexShrink: 0,
  };

  const navStyle: CSSProperties = {
    display: isMobile ? (menuOpen ? "flex" : "none") : "flex",
    alignItems: "center",
    justifyContent: isMobile ? "stretch" : "flex-end",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 8 : 4,
    flexWrap: "nowrap",
    padding: isMobile ? 12 : 10,
    borderRadius: isMobile ? 24 : 999,
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,90,31,0.12)",
    boxShadow: "0 18px 44px rgba(17,24,39,0.08)",
    position: isMobile ? "absolute" : "static",
    top: isMobile ? 72 : "auto",
    left: isMobile ? 0 : "auto",
    right: isMobile ? 0 : "auto",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "100%" : "calc(100% - 210px)",
    overflowX: isMobile ? "visible" : "auto",
    scrollbarWidth: "none",
  };

  const logoutStyle: CSSProperties = {
    minHeight: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    padding: "0 13px",
    fontSize: 14,
    fontWeight: 850,
    fontFamily: "inherit",
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: "1px solid rgba(239,68,68,0.18)",
    color: "#b91c1c",
    background: "linear-gradient(180deg, #fff7f7, #fff1f1)",
    boxShadow: "0 12px 26px rgba(17,24,39,0.05)",
    width: isMobile ? "100%" : "auto",
    flexShrink: 0,
  };

  const loginStyle: CSSProperties = {
    ...navLinkStyle("/auth"),
    color: "white",
    background: "var(--brand-gradient)",
    boxShadow: "0 16px 34px rgba(255,90,31,0.2)",
  };

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <Link href="/" style={logoStyle} onClick={closeMenu}>
          <span style={logoMarkStyle}>H</span>
          <span>HustleUp</span>
        </Link>

        <button
          style={mobileButtonStyle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav style={navStyle}>
          <Link href="/jobs" style={navLinkStyle("/jobs")} onClick={closeMenu}>
            Jobs
          </Link>

          <Link
            href="/pricing"
            style={navLinkStyle("/pricing")}
            onClick={closeMenu}
          >
            Pricing
          </Link>

          {!loading && email && (role === "job_owner" || role === "admin") && (
            <Link
              href="/post-job"
              style={navLinkStyle("/post-job")}
              onClick={closeMenu}
            >
              Post Job
            </Link>
          )}

          {!loading && email && (role === "job_owner" || role === "admin") && (
            <Link
              href="/my-jobs"
              style={navLinkStyle("/my-jobs")}
              onClick={closeMenu}
            >
              My Jobs
            </Link>
          )}

          {!loading && email && (
            <Link
              href="/applications"
              style={navLinkStyle("/applications")}
              onClick={closeMenu}
            >
              Applications
            </Link>
          )}

          {!loading && email && (
            <Link
              href="/dashboard"
              style={navLinkStyle("/dashboard")}
              onClick={closeMenu}
            >
              Dashboard
            </Link>
          )}

          {!loading && email && (
            <Link
              href="/profile"
              style={navLinkStyle("/profile")}
              onClick={closeMenu}
            >
              Profile
            </Link>
          )}

          {!loading && email && role === "admin" && (
            <Link
              href="/admin"
              style={navLinkStyle("/admin")}
              onClick={closeMenu}
            >
              Admin
            </Link>
          )}

          {!loading &&
            (email ? (
              <button style={logoutStyle} onClick={signOut}>
                Logout
              </button>
            ) : (
              <Link href="/auth" style={loginStyle} onClick={closeMenu}>
                Login
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}