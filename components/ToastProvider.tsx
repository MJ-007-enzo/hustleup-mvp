"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Toast from "@/components/Toast";

type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
  });

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((previousToast) => ({
      ...previousToast,
      message: "",
    }));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}