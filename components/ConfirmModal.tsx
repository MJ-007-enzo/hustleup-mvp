"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);
useEffect(() => {
  if (!open) return;

  const previousOverflow = document.body.style.overflow;

  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [open]);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        display: "grid",
        placeItems: "center",
        padding: 18,
        background: "rgba(17,24,39,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          width: "min(92vw, 480px)",
          borderRadius: 28,
          padding: 26,
          overflow: "hidden",
          border: danger
            ? "1px solid rgba(239,68,68,0.24)"
            : "1px solid rgba(255,90,31,0.18)",
          background: danger
            ? "radial-gradient(circle at 10% 8%, rgba(239,68,68,0.12), transparent 30%), linear-gradient(180deg, #ffffff, #fff7f7)"
            : "radial-gradient(circle at 10% 8%, rgba(255,90,31,0.13), transparent 30%), linear-gradient(180deg, #ffffff, #fffaf6)",
          boxShadow:
            "0 40px 110px rgba(0,0,0,0.34), 0 18px 46px rgba(17,24,39,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 5,
            background: danger
              ? "linear-gradient(90deg, #ef4444, #fb7185)"
              : "var(--brand-gradient)",
          }}
        />

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 18,
            display: "grid",
            placeItems: "center",
            background: danger ? "#fee2e2" : "var(--brand-soft)",
            color: danger ? "#b91c1c" : "var(--brand-dark)",
            fontWeight: 950,
            fontSize: 22,
            marginBottom: 16,
            boxShadow: "0 14px 30px rgba(17,24,39,0.08)",
          }}
        >
          {danger ? "!" : "✓"}
        </div>

        <h2
          style={{
            marginTop: 0,
            marginBottom: 10,
            color: "var(--premium)",
            fontSize: 30,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 22,
            color: "var(--muted)",
            fontWeight: 650,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={busy}
            style={{
              minHeight: 50,
              borderRadius: 16,
              padding: "0 18px",
              fontWeight: 850,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,246,0.94))",
              border: "1px solid rgba(255,90,31,0.16)",
              color: "var(--premium)",
              boxShadow: "0 12px 28px rgba(17,24,39,0.08)",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={danger ? "btn" : "btn btn-primary"}
            onClick={onConfirm}
            disabled={busy}
            style={{
              minHeight: 50,
              borderRadius: 16,
              padding: "0 18px",
              fontWeight: 850,
              background: danger
                ? "linear-gradient(180deg, #fff7f7, #fff1f1)"
                : undefined,
              border: danger ? "1px solid rgba(239,68,68,0.24)" : undefined,
              color: danger ? "#b91c1c" : undefined,
              boxShadow: danger
                ? "0 16px 34px rgba(239,68,68,0.12), 0 10px 24px rgba(17,24,39,0.08)"
                : "0 18px 40px rgba(255,90,31,0.18), 0 10px 24px rgba(17,24,39,0.08)",
            }}
          >
            {busy ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}