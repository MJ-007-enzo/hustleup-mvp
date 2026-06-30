"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

export default function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

useEffect(() => {
  function updateTheme() {
    setIsDarkMode(
      document.documentElement.getAttribute("data-theme") === "dark"
    );
  }

  updateTheme();

  const observer = new MutationObserver(updateTheme);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!mounted || !message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";



  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "18px",
        left: "50%",
        transform: "translateX(-50%)",
     zIndex: 2147483647,
        width: "min(94vw, 560px)",
padding: "18px 22px",
borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
   background: isDarkMode
  ? "#111827"
  : "#ffffff",
     border: isSuccess
  ? "1px solid rgba(16,185,129,.45)"
  : isError
  ? "1px solid rgba(239,68,68,.45)"
  : "1px solid rgba(59,130,246,.45)",
   color: isDarkMode
  ? "#F9FAFB"
  : "#111827",
      boxShadow:
"0 25px 70px rgba(0,0,0,.45)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <span
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontWeight: 950,
      background: isSuccess
  ? "#10B981"
  : isError
  ? "#EF4444"
  : "#3B82F6",
         color: "#fff",
          boxShadow: "0 8px 20px rgba(17,24,39,0.08)",
        }}
      >
        {isSuccess ? "✓" : isError ? "!" : "i"}
      </span>

      <strong
        style={{
          flex: 1,
          fontSize: "15px",
          lineHeight: 1.4,
          fontWeight: 850,
        }}
      >
        {message}
      </strong>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "999px",
     border: "none",
      background: "transparent",
          color: "inherit",
          fontSize: "20px",
          fontWeight: 800,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>,
    document.body
  );
}