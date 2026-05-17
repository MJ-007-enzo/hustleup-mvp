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
          ? "linear-gradient(180deg, #ecfdf5, #d1fae5)"
          : isError
            ? "linear-gradient(180deg, #fff1f2, #fee2e2)"
            : "linear-gradient(180deg, #ffffff, #fff7ed)",
        border: isSuccess
          ? "1px solid #86efac"
          : isError
            ? "1px solid #fca5a5"
            : "1px solid #fed7aa",
        color: isSuccess ? "#047857" : isError ? "#b91c1c" : "#9a3412",
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
          background: "rgba(255,255,255,0.78)",
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
          border: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(255,255,255,0.78)",
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