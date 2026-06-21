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
        width: "min(92vw, 620px)",
        padding: "16px 18px",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: isSuccess
  ? "linear-gradient(135deg, rgba(6,78,59,0.98), rgba(4,120,87,0.98))"
  : isError
    ? "linear-gradient(135deg, rgba(69,10,10,0.98), rgba(127,29,29,0.98))"
    : "linear-gradient(135deg, rgba(17,24,39,0.98), rgba(31,41,55,0.98))",
       border: isSuccess
  ? "1px solid rgba(16,185,129,0.35)"
  : isError
    ? "1px solid rgba(239,68,68,0.35)"
    : "1px solid rgba(255,90,31,0.25)",
      color: "#ffffff",
        boxShadow:
          "0 34px 100px rgba(0,0,0,0.32), 0 14px 34px rgba(17,24,39,0.18)",
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
         background: "rgba(255,255,255,0.08)",
          color: "inherit",
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
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.08)",
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