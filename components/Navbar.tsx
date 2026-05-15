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
      const mobile = window.innerWidth <= 1120;
      setIsMobile(mobile);

      if (!mobile) {
        setMenuOpen(false);
      }
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
      minHeight: isMobile ? 50 : 42,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: isMobile ? 16 : 14,
      padding: isMobile ? "0 16px" : "0 10px",
      fontSize: isMobile ? 15 : 14,
      fontWeight: 850,
      textDecoration: "none",
      whiteSpace: "nowrap",
      color: active ? "var(--brand-dark)" : "var(--premium)",
      background: active ? "var(--brand-soft)" : "rgba(255,255,255,0.84)",
      border: active
        ? "1px solid rgba(255,90,31,0.2)"
        : "1px solid rgba(255,90,31,0.1)",
      boxShadow: active
        ? "0 12px 28px rgba(255,90,31,0.1)"
        : "0 8px 18px rgba(17,24,39,0.035)",
      width: isMobile ? "100%" : "auto",
      flexShrink: 0,
    };
  }

  const headerStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 2000,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    background:
      "linear-gradient(180deg, rgba(255,250,246,0.97), rgba(255,250,246,0.9))",
    borderBottom: "1px solid rgba(255,90,31,0.12)",
    boxShadow: "0 14px 34px rgba(17,24,39,0.06)",
  };

  const innerStyle: CSSProperties = {
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    minHeight: isMobile ? 82 : 88,
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
    width: 46,
    height: 46,
    borderRadius: 16,
    border: "1px solid rgba(255,90,31,0.14)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
    color: "var(--premium)",
    fontSize: 22,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(17,24,39,0.08)",
    flexShrink: 0,
  };

  const desktopNavStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    gap: 4,
    flexWrap: "nowrap",
    padding: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.76)",
    border: "1px solid rgba(255,90,31,0.12)",
    boxShadow: "0 18px 44px rgba(17,24,39,0.08)",
    width: "auto",
    maxWidth: "calc(100% - 210px)",
    overflowX: "auto",
    scrollbarWidth: "none",
  };

  const mobileNavStyle: CSSProperties = {
    position: "fixed",
    top: 96,
    left: 16,
    right: 16,
    zIndex: 3000,
    display: menuOpen ? "flex" : "none",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    padding: 16,
    borderRadius: 28,
    background:
      "radial-gradient(circle at 10% 0%, rgba(255,90,31,0.12), transparent 34%), linear-gradient(180deg, #fffaf6 0%, #ffffff 100%)",
    border: "1px solid rgba(255,90,31,0.18)",
    boxShadow:
      "0 40px 100px rgba(17,24,39,0.32), 0 16px 40px rgba(255,90,31,0.12)",
  };

  const logoutStyle: CSSProperties = {
    minHeight: isMobile ? 50 : 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: isMobile ? 16 : 14,
    padding: "0 14px",
    fontSize: isMobile ? 15 : 14,
    fontWeight: 850,
    fontFamily: "inherit",
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: "1px solid rgba(239,68,68,0.22)",
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

  const navStyle = isMobile ? mobileNavStyle : desktopNavStyle;

  return (
    <>
      {isMobile && menuOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            background: "rgba(17,24,39,0.42)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
      )}

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

            {!loading &&
              email &&
              (role === "job_owner" || role === "admin") && (
                <Link
                  href="/post-job"
                  style={navLinkStyle("/post-job")}
                  onClick={closeMenu}
                >
                  Post Job
                </Link>
              )}

            {!loading &&
              email &&
              (role === "job_owner" || role === "admin") && (
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
    </>
  );
}